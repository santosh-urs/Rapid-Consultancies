-- Security migration: hash customer/staff passwords, add secure login RPCs.
-- Run this once in Supabase Dashboard > SQL Editor (paste and click Run).
--
-- What this does:
--   1. Hashes every existing plaintext password (customers + staff) with bcrypt.
--   2. Installs a trigger so any future INSERT/UPDATE auto-hashes a plaintext
--      password before it hits disk — this makes the existing admin/staff
--      dashboard write code (which still does `.update({ password: ... })`)
--      safe with ZERO changes required there.
--   3. Preserves the existing "DELETED_" prefix soft-delete convention used
--      throughout the admin/staff dashboards (`password.startsWith('DELETED_')`)
--      — the prefix stays in plaintext, only the part after it gets hashed.
--   4. Adds verify_customer_login / verify_staff_login RPCs so login checks
--      happen inside the database (via crypt()) instead of comparing
--      plaintext passwords in client-side JS after fetching the whole row.
--   5. Adds set_customer_password_by_id / set_staff_password_by_id /
--      *_by_email RPCs for reset-password flows.
--
-- Safe to re-run: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 1. One-time hash of existing plaintext passwords -------------------------

UPDATE customers
SET password = CASE
  WHEN password LIKE 'DELETED\_%' ESCAPE '\' THEN 'DELETED_' || crypt(substring(password from 9), gen_salt('bf'))
  ELSE crypt(password, gen_salt('bf'))
END
WHERE password IS NOT NULL AND password !~ '^(DELETED_)?\$2[aby]\$';

UPDATE staff
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL AND password !~ '^\$2[aby]\$';

-- 2 & 3. Auto-hash trigger for all future writes ----------------------------

CREATE OR REPLACE FUNCTION hash_password_trigger() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.password IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.password ~ '^(DELETED_)?\$2[aby]\$' THEN
    RETURN NEW; -- already hashed (e.g. re-saved unchanged by a dashboard form)
  END IF;
  IF NEW.password LIKE 'DELETED\_%' ESCAPE '\' THEN
    NEW.password := 'DELETED_' || crypt(substring(NEW.password from 9), gen_salt('bf'));
  ELSE
    NEW.password := crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_hash_password ON customers;
CREATE TRIGGER customers_hash_password BEFORE INSERT OR UPDATE OF password ON customers
FOR EACH ROW EXECUTE FUNCTION hash_password_trigger();

DROP TRIGGER IF EXISTS staff_hash_password ON staff;
CREATE TRIGGER staff_hash_password BEFORE INSERT OR UPDATE OF password ON staff
FOR EACH ROW EXECUTE FUNCTION hash_password_trigger();

-- 4. Login verification RPCs -------------------------------------------------

CREATE OR REPLACE FUNCTION verify_customer_login(p_identifier TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_is_email BOOLEAN := position('@' in p_identifier) > 0;
  v_clean TEXT := regexp_replace(p_identifier, '\D', '', 'g');
  v_row customers%ROWTYPE;
  v_any_match BOOLEAN := FALSE;
  v_stored TEXT;
  v_is_deleted BOOLEAN;
BEGIN
  FOR v_row IN
    SELECT * FROM customers
    WHERE (v_is_email AND email ILIKE trim(p_identifier))
       OR (NOT v_is_email AND v_clean <> '' AND mobile ILIKE '%' || v_clean)
  LOOP
    v_any_match := TRUE;
    v_is_deleted := v_row.password LIKE 'DELETED\_%' ESCAPE '\';
    v_stored := CASE WHEN v_is_deleted THEN substring(v_row.password from 9) ELSE v_row.password END;

    IF v_stored IS NOT NULL AND crypt(p_password, v_stored) = v_stored THEN
      IF v_is_deleted THEN
        RETURN json_build_object('status', 'deleted');
      END IF;
      RETURN json_build_object(
        'status', 'ok', 'id', v_row.id, 'name', v_row.name, 'mobile', v_row.mobile,
        'email', v_row.email, 'address', v_row.address, 'dob', v_row.dob,
        'kyc_status', v_row.kyc_status, 'branch', v_row.branch,
        'joined_date', v_row.joined_date, 'avatar_url', v_row.avatar_url
      );
    END IF;
  END LOOP;

  IF NOT v_any_match THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  RETURN json_build_object('status', 'invalid_password');
END;
$$;

CREATE OR REPLACE FUNCTION verify_staff_login(p_identifier TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_is_email BOOLEAN := position('@' in p_identifier) > 0;
  v_clean TEXT := regexp_replace(p_identifier, '\D', '', 'g');
  v_row staff%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM staff
  WHERE is_active = TRUE
    AND ((v_is_email AND email ILIKE trim(p_identifier)) OR (NOT v_is_email AND v_clean <> '' AND mobile ILIKE '%' || v_clean))
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  IF v_row.password IS NULL OR crypt(p_password, v_row.password) <> v_row.password THEN
    RETURN json_build_object('status', 'invalid_password');
  END IF;

  RETURN json_build_object('status', 'ok', 'id', v_row.id, 'name', v_row.name, 'mobile', v_row.mobile, 'branch', v_row.branch);
END;
$$;

-- 5. Password set/reset RPCs -------------------------------------------------

CREATE OR REPLACE FUNCTION set_customer_password_by_id(p_customer_id TEXT, p_new_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  UPDATE customers SET password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_customer_id AND password NOT LIKE 'DELETED\_%' ESCAPE '\';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION set_customer_password_by_email(p_email TEXT, p_new_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  UPDATE customers SET password = crypt(p_new_password, gen_salt('bf'))
  WHERE email ILIKE trim(p_email) AND password NOT LIKE 'DELETED\_%' ESCAPE '\';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION set_staff_password_by_id(p_staff_id TEXT, p_new_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  UPDATE staff SET password = crypt(p_new_password, gen_salt('bf')) WHERE id = p_staff_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION set_staff_password_by_email(p_email TEXT, p_new_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  UPDATE staff SET password = crypt(p_new_password, gen_salt('bf')) WHERE email ILIKE trim(p_email);
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_customer_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_customer_password_by_id(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_customer_password_by_email(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_staff_password_by_id(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_staff_password_by_email(TEXT, TEXT) TO anon, authenticated;
