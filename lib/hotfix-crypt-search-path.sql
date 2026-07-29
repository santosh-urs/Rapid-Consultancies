-- URGENT HOTFIX: the previous fix-phone-matching.sql update broke login
-- entirely. crypt() (from pgcrypto) stopped resolving because the function
-- restricted search_path to only "public", and pgcrypto apparently lives
-- in a different schema (commonly "extensions" on Supabase). Broadening
-- the search_path to check both fixes it. Safe to re-run.

CREATE OR REPLACE FUNCTION verify_customer_login(p_identifier TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_is_email BOOLEAN := position('@' in p_identifier) > 0;
  v_clean TEXT := right(regexp_replace(p_identifier, '\D', '', 'g'), 10);
  v_row customers%ROWTYPE;
  v_any_match BOOLEAN := FALSE;
  v_stored TEXT;
  v_is_deleted BOOLEAN;
BEGIN
  FOR v_row IN
    SELECT * FROM customers
    WHERE (v_is_email AND email ILIKE trim(p_identifier))
       OR (NOT v_is_email AND v_clean <> '' AND right(regexp_replace(mobile, '\D', '', 'g'), 10) = v_clean)
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_is_email BOOLEAN := position('@' in p_identifier) > 0;
  v_clean TEXT := right(regexp_replace(p_identifier, '\D', '', 'g'), 10);
  v_row staff%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM staff
  WHERE is_active = TRUE
    AND ((v_is_email AND email ILIKE trim(p_identifier))
         OR (NOT v_is_email AND v_clean <> '' AND right(regexp_replace(mobile, '\D', '', 'g'), 10) = v_clean))
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

GRANT EXECUTE ON FUNCTION verify_customer_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_login(TEXT, TEXT) TO anon, authenticated;
