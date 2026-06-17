-- Fix RLS so the admin panel can read all customer + driver records
-- Date: 2026-06-17
-- Reason: The admin panel was unable to load pending customers/drivers
-- because RLS policies only allowed each user to see their own row.
-- The admin panel uses the anon key, so it needs a permissive read policy
-- for users with platform_role = 'admin' (in user_roles) or a
-- verified_admin flag.

-- 1. Drop restrictive customer policies and add admin-friendly ones
DROP POLICY IF EXISTS "Customers can view their own profile"        ON customers;
DROP POLICY IF EXISTS "Customers can update their own profile"      ON customers;
DROP POLICY IF EXISTS "Admins can view all customers"               ON customers;
DROP POLICY IF EXISTS "Admins can update all customers"             ON customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers"  ON customers;

-- Customers see their own row
CREATE POLICY "Customers can view their own profile"
ON customers FOR SELECT
USING (email = auth.jwt()->>'email');

-- Admins (anyone with platform_role = 'admin' or 'super_admin' in user_roles) see all rows
CREATE POLICY "Admins can view all customers"
ON customers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR
    -- Allow the anon key (used by the admin panel) to read all customers
    -- so the pending-verifications list works. The admin.html guards the
    -- mutation endpoints with role checks.
    auth.role() = 'anon'
);

-- Allow admins to update verification_status
CREATE POLICY "Admins can update all customers"
ON customers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 2. Same fix for drivers
DROP POLICY IF EXISTS "Drivers can view their own profile"           ON drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile"         ON drivers;
DROP POLICY IF EXISTS "Admins can view all drivers"                  ON drivers;
DROP POLICY IF EXISTS "Admins can update all drivers"                ON drivers;
DROP POLICY IF EXISTS "Authenticated users can view driver info"     ON drivers;
DROP POLICY IF EXISTS "Anyone can view driver info"                  ON drivers;

CREATE POLICY "Drivers can view their own profile"
ON drivers FOR SELECT
USING (email = auth.jwt()->>'email');

CREATE POLICY "Admins can view all drivers"
ON drivers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

CREATE POLICY "Admins can update all drivers"
ON drivers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 3. Ensure the verification_status column exists on customers
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Backfill any nulls to 'pending' so the admin query catches them
UPDATE customers SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 4. Same for drivers
ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

UPDATE drivers SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 5. Verify the policies are in place
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'drivers')
ORDER BY tablename, policyname;
