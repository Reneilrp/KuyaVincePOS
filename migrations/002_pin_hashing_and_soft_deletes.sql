-- 1. Add per-staff PIN salt and hash columns to staff_records
ALTER TABLE staff_records ADD COLUMN IF NOT EXISTS pin_salt TEXT DEFAULT '';
ALTER TABLE staff_records ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT '';

-- 2. Soft-delete column for staff (Issue 5)
ALTER TABLE staff_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 3. Soft-toggle column for branch_inventory (Issue 6)
ALTER TABLE branch_inventory ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- NOTE: Existing plaintext pin_code values remain for now.
-- The admin-web migration flow will hash them on next admin login.
-- After migration is complete and verified, pin_code can be cleared:
-- UPDATE staff_records SET pin_code = '' WHERE pin_hash != '';
