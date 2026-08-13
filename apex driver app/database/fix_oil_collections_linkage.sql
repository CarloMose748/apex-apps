-- =====================================================================
-- FIX: oil_collections rows are saved with NULL job_id and driver_id
-- =====================================================================
--
-- ROOT CAUSE
--   oil_collections.job_id had a foreign key to oil_collection_jobs(id),
--   but every job the driver app actually works with lives in jobs(id).
--   The insert therefore always failed the FK check, and the app's error
--   handler silently retried with job_id and driver_id stripped out,
--   writing the real values into the notes column instead.
--
-- THIS SCRIPT
--   1. Repoints the foreign key at jobs(id)
--   2. Recovers job_id / driver_id on existing orphaned rows from notes
--   3. Marks jobs completed where a collection proves they were done
--
-- SAFE TO RE-RUN. Wrap in a transaction; review step 4 before COMMIT.
-- Take a database backup before running this on production.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- STEP 1: Repoint the foreign key from oil_collection_jobs to jobs
-- ---------------------------------------------------------------------

-- Drop whatever FK currently exists on oil_collections.job_id,
-- regardless of what it was named.
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = con.conrelid
                             AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'oil_collections'
          AND con.contype = 'f'
          AND att.attname = 'job_id'
    LOOP
        EXECUTE format('ALTER TABLE oil_collections DROP CONSTRAINT %I', fk_name);
        RAISE NOTICE 'Dropped old foreign key: %', fk_name;
    END LOOP;
END $$;

-- Recreate it against the table the app actually uses.
-- ON DELETE SET NULL, not CASCADE: deleting a job must never destroy the
-- collection record, which is compliance evidence.
ALTER TABLE oil_collections
    ADD CONSTRAINT oil_collections_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------
-- STEP 2: Recover job_id on orphaned rows
-- ---------------------------------------------------------------------
-- The app wrote the original id into notes as:
--   [FALLBACK] Original Job ID: <uuid>
-- Only restore it where that job genuinely exists in jobs.

UPDATE oil_collections oc
SET    job_id = recovered.job_uuid
FROM (
    SELECT id,
           (substring(notes from 'Original Job ID:\s*([0-9a-fA-F-]{36})'))::uuid AS job_uuid
    FROM   oil_collections
    WHERE  job_id IS NULL
      AND  notes ~ 'Original Job ID:\s*[0-9a-fA-F-]{36}'
) AS recovered
WHERE oc.id = recovered.id
  AND EXISTS (SELECT 1 FROM jobs j WHERE j.id = recovered.job_uuid);


-- ---------------------------------------------------------------------
-- STEP 3: Recover driver_id
-- ---------------------------------------------------------------------
-- 3a. Preferred route: take the driver straight off the recovered job.
--     This is the most reliable source, because jobs.driver_id already
--     holds a real drivers.id.

UPDATE oil_collections oc
SET    driver_id = j.driver_id
FROM   jobs j
WHERE  oc.job_id = j.id
  AND  oc.driver_id IS NULL
  AND  j.driver_id IS NOT NULL;

-- 3b. Fallback: the app stored the AUTH user id, not the drivers.id.
--     Map auth user -> driver via email address.

UPDATE oil_collections oc
SET    driver_id = d.id
FROM   auth.users u
JOIN   drivers d ON lower(d.email) = lower(u.email)
WHERE  oc.driver_id IS NULL
  AND  oc.notes ~ 'Original Driver ID:\s*[0-9a-fA-F-]{36}'
  AND  u.id = (substring(oc.notes from 'Original Driver ID:\s*([0-9a-fA-F-]{36})'))::uuid;


-- ---------------------------------------------------------------------
-- STEP 4: Close out jobs that were actually completed
-- ---------------------------------------------------------------------
-- A collection record is proof the driver did the work. Any linked job
-- still sitting in pending/accepted/in_progress should be completed.
--
-- REVIEW THE SELECT BELOW BEFORE COMMITTING.

-- Preview what will change:
--   SELECT j.id, j.customer_name, j.status, oc.collection_date
--   FROM jobs j
--   JOIN oil_collections oc ON oc.job_id = j.id
--   WHERE j.status IN ('pending', 'available', 'accepted', 'in_progress');

UPDATE jobs j
SET    status       = 'completed',
       completed_at = COALESCE(j.completed_at, oc.collection_date),
       driver_id    = COALESCE(j.driver_id, oc.driver_id),
       updated_at   = NOW()
FROM   oil_collections oc
WHERE  oc.job_id = j.id
  AND  j.status IN ('pending', 'available', 'accepted', 'in_progress');


-- ---------------------------------------------------------------------
-- STEP 5: Report
-- ---------------------------------------------------------------------

DO $$
DECLARE
    total_rows      INT;
    still_orphaned  INT;
    no_driver       INT;
BEGIN
    SELECT count(*) INTO total_rows     FROM oil_collections;
    SELECT count(*) INTO still_orphaned FROM oil_collections WHERE job_id IS NULL;
    SELECT count(*) INTO no_driver      FROM oil_collections WHERE driver_id IS NULL;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'oil_collections total rows      : %', total_rows;
    RAISE NOTICE 'still missing job_id            : %', still_orphaned;
    RAISE NOTICE 'still missing driver_id         : %', no_driver;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Rows still missing job_id were saved against a job id';
    RAISE NOTICE 'that never existed (generated client-side). Those must';
    RAISE NOTICE 'be matched by hand using collection_address and date.';
END $$;

COMMIT;


-- =====================================================================
-- OPTIONAL: retire the dead table
-- =====================================================================
-- oil_collection_jobs is written to by createOilCollectionJob() but read
-- by nothing. Confirm it is empty before dropping it. Leaving it in place
-- is harmless; it is listed here only so it does not cause confusion later.
--
--   SELECT count(*) FROM oil_collection_jobs;
--   -- if 0:
--   -- DROP TABLE oil_collection_jobs;
