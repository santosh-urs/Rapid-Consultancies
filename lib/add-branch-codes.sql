-- Second-branch support: switch the free-text `branch` columns over to
-- stable codes ('musthafa_nagar' / 'branch_2') instead of display names.
--
-- Display details (name/address/phone) now live in lib/branches.ts, keyed
-- by these codes. Renaming a branch later is a one-line edit there — it no
-- longer requires touching this data. Run this once in the Supabase SQL
-- Editor (same as the other lib/*.sql patch scripts in this project).

UPDATE customers SET branch = 'musthafa_nagar' WHERE branch IS NULL OR branch = 'Musthafa Nagar Branch';
UPDATE loans SET branch = 'musthafa_nagar' WHERE branch IS NULL OR branch = 'Musthafa Nagar Branch';
UPDATE staff SET branch = 'musthafa_nagar' WHERE branch IS NULL OR branch = 'Musthafa Nagar Branch';
UPDATE access_requests SET branch = 'musthafa_nagar' WHERE branch IS NULL OR branch = 'Musthafa Nagar Branch';
UPDATE loan_sanction_requests SET branch = 'musthafa_nagar' WHERE branch IS NULL OR branch = 'Musthafa Nagar Branch';

ALTER TABLE customers ALTER COLUMN branch SET DEFAULT 'musthafa_nagar';
ALTER TABLE loans ALTER COLUMN branch SET DEFAULT 'musthafa_nagar';
ALTER TABLE staff ALTER COLUMN branch SET DEFAULT 'musthafa_nagar';
ALTER TABLE access_requests ALTER COLUMN branch SET DEFAULT 'musthafa_nagar';
ALTER TABLE loan_sanction_requests ALTER COLUMN branch SET DEFAULT 'musthafa_nagar';

ALTER TABLE customers ADD CONSTRAINT customers_branch_check CHECK (branch IN ('musthafa_nagar', 'branch_2'));
ALTER TABLE loans ADD CONSTRAINT loans_branch_check CHECK (branch IN ('musthafa_nagar', 'branch_2'));
ALTER TABLE staff ADD CONSTRAINT staff_branch_check CHECK (branch IN ('musthafa_nagar', 'branch_2'));
ALTER TABLE access_requests ADD CONSTRAINT access_requests_branch_check CHECK (branch IN ('musthafa_nagar', 'branch_2'));
ALTER TABLE loan_sanction_requests ADD CONSTRAINT loan_sanction_requests_branch_check CHECK (branch IN ('musthafa_nagar', 'branch_2'));
