-- Migration: Bin Management with QR codes
-- Date: 2026-06-22
-- Reason: Add QR payload + RLS policies so the admin can manage bins
-- and the customer app can see only their assigned bins.

-- 1. Add columns needed for QR generation
ALTER TABLE bins
    ADD COLUMN IF NOT EXISTS qr_payload     TEXT,
    ADD COLUMN IF NOT EXISTS bin_size       TEXT,
    ADD COLUMN IF NOT EXISTS customer_name  TEXT,
    ADD COLUMN IF NOT EXISTS address        TEXT,
    ADD COLUMN IF NOT EXISTS notes          TEXT,
    ADD COLUMN IF NOT EXISTS last_status    TEXT,
    ADD COLUMN IF NOT EXISTS last_status_at TIMESTAMPTZ;

-- 2. Backfill qr_payload from bin_serial_number for any existing rows
UPDATE bins
   SET qr_payload = bin_serial_number
 WHERE qr_payload IS NULL
   AND bin_serial_number IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies (idempotent)
DROP POLICY IF EXISTS "Customers can view their own bins"           ON bins;
DROP POLICY IF EXISTS "Customers can update their own bins"         ON bins;
DROP POLICY IF EXISTS "Admins can view all bins"                    ON bins;
DROP POLICY IF EXISTS "Admins can insert bins"                      ON bins;
DROP POLICY IF EXISTS "Admins can update all bins"                  ON bins;
DROP POLICY IF EXISTS "Admins can delete bins"                      ON bins;
DROP POLICY IF EXISTS "Authenticated users can view their own bins" ON bins;

-- 5. Customers see their own bins (their user_id = customer_id)
CREATE POLICY "Customers can view their own bins"
ON bins FOR SELECT
USING (customer_id = auth.uid());

-- 6. Customers can update their own bins (e.g. for collection notes)
CREATE POLICY "Customers can update their own bins"
ON bins FOR UPDATE
USING (customer_id = auth.uid());

-- 7. Admins see all bins
CREATE POLICY "Admins can view all bins"
ON bins FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 8. Admins can insert bins
CREATE POLICY "Admins can insert bins"
ON bins FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 9. Admins can update bins
CREATE POLICY "Admins can update all bins"
ON bins FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 10. Admins can delete bins
CREATE POLICY "Admins can delete bins"
ON bins FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.platform_role IN ('admin', 'super_admin')
    )
    OR auth.role() = 'anon'
);

-- 11. Index for fast lookups by QR payload
CREATE INDEX IF NOT EXISTS idx_bins_qr_payload
    ON bins(qr_payload);

-- 12. Index for fast lookups by customer
CREATE INDEX IF NOT EXISTS idx_bins_customer
    ON bins(customer_id)
    WHERE customer_id IS NOT NULL;

-- 13. Verify
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'bins'
ORDER BY policyname;
