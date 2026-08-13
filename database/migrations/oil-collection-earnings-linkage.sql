-- =====================================================================
-- Migration: oil_collection_earnings FK + backfill of collections
-- Purpose : Same dead-parallel-table bug as oil_collections: the
--           job_id foreign key on oil_collection_earnings pointed at
--           oil_collection_jobs(id), which is empty and unread. Every
--           earnings insert therefore failed silently, so Total
--           Earnings on the driver app always showed R0.00.
--
--           Repoints the FK at jobs(id) ON DELETE SET NULL and
--           backfills earnings for the two collections that the driver
--           completed on 2026-08-13 but whose collection rows were
--           lost to the same silent-orphan bug (see
--           fix_oil_collections_linkage.sql for context).
--
-- Applied on: 2026-08-13
-- Apply with:
--   curl -s -X POST "https://api.supabase.com/v1/projects/ishhgfitddfeqaatimwl/database/query" \
--     -H "Authorization: Bearer <service_role_key>" \
--     -H "Content-Type: application/json" \
--     -d @oil-collection-earnings-linkage.sql.json
-- =====================================================================

-- 1. Drop the wrong FK (oil_collection_jobs) and recreate against jobs(id)
DO $$
DECLARE fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = con.conrelid
                             AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'oil_collection_earnings'
          AND con.contype = 'f'
          AND att.attname = 'job_id'
    LOOP
        EXECUTE format('ALTER TABLE oil_collection_earnings DROP CONSTRAINT %I', fk_name);
        RAISE NOTICE 'Dropped old foreign key: %', fk_name);
    END LOOP;
END $$;

ALTER TABLE oil_collection_earnings
    ADD CONSTRAINT oil_collection_earnings_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;


-- 2. Backfill earnings for the two collections that already exist
--    (Osward Chipasha 4L UCO, Mahomed Hassim 125L UCO - both by
--    driver Shelden on 2026-08-13). Earnings formula used here:
--      base = R50, volume bonus = R2/L, commission = 20% (driver net 80%).
--    These are placeholder values since the original earnings were
--    never persisted; the real values should be re-confirmed by the
--    office before being paid out.
INSERT INTO oil_collection_earnings
    (driver_id, job_id, collection_id,
     base_payment, volume_bonus, quality_bonus, efficiency_bonus,
     gross_amount, commission_rate, commission_amount, net_amount,
     payment_status, payment_date, created_at)
VALUES
    ('49e3348e-78f8-4039-95a9-ee45fb92b35d',
     'ec8389fb-d381-4ccd-8f63-ec51358b9b14',
     '98364ea8-19d0-4e34-85d7-4e3be91d1084',
     50.00, 8.00, 0.00, 0.00,
     58.00, 0.20, 11.60, 46.40,
     'pending', NULL, '2026-08-13 12:18:38.061+00'),
    ('49e3348e-78f8-4039-95a9-ee45fb92b35d',
     'e7e3061f-cb87-4997-95ff-4ddaff7506dd',
     '2d6d0bc3-ebea-49f7-9fad-71967abd13de',
     50.00, 250.00, 0.00, 0.00,
     300.00, 0.20, 60.00, 240.00,
     'pending', NULL, '2026-08-13 12:48:13.764+00')
ON CONFLICT DO NOTHING;