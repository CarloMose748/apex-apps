-- =====================================================================
-- Migration: jobs lifecycle - stale jobs + no-show + accepted state
-- Purpose : Adds new lifecycle states to the jobs table so the admin
--           team can detect and rectify pickups that linger without
--           being completed:
--             * 'accepted'   - driver claimed the job but hasn't started
--             * 'no_show'    - driver arrived but customer wasn't there
--             * 'stale'      - pending >72h, flagged for admin review
--
-- Background:
--   Previously the driver app's acceptJob() set status='in_progress'
--   immediately, so there was no way to tell "driver claimed and never
--   started" apart from "driver is actively collecting". Customers
--   also had no way to flag "no one showed up". The admin panel
--   silently showed pending jobs that were weeks old (Peter Badenhorst,
--   2026-06-22, sat in pending for ~25 days).
--
-- Applied on: 2026-07-16
-- Apply with:
--   curl -s -X POST "https://api.supabase.com/v1/projects/ishhgfitddfeqaatimwl/database/query" \
--     -H "Authorization: Bearer <service_role_key>" \
--     -H "Content-Type: application/json" \
--     -d @jobs-lifecycle-stale-jobs.sql.json
-- =====================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS accepted_at    timestamp with time zone;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_show_at     timestamp with time zone;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_show_notes  text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_show_by     uuid;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reverted_at    timestamp with time zone;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stale_at       timestamp with time zone;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stale_flagged_by uuid;

-- Partial indexes that make the stale-job queries cheap:
--   1. Jobs accepted more than 2 hours ago (for revertExpiredAccepts)
--   2. Jobs stuck in pending for more than 72 hours (for stale flagging)
CREATE INDEX IF NOT EXISTS idx_jobs_accepted_pending
  ON jobs (accepted_at)
  WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_jobs_stale_pending
  ON jobs (created_at)
  WHERE status = 'pending';