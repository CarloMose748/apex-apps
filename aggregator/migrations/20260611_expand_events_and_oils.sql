-- Migration: Expand aggregator events + oil type options
-- Date: 2026-06-11
-- Reason: Depot app now allows dual units (kg/L) and additional oil types
-- (Black Oil, Other). Add columns to high_aggregator_events so the admin
-- panel can show all data captured at receipt.

-- 1. Add new oil types to the CHECK constraint
ALTER TABLE high_aggregator_events
    DROP CONSTRAINT IF EXISTS valid_oil_type;

ALTER TABLE high_aggregator_events
    ADD CONSTRAINT valid_oil_type CHECK (
        oil_type IS NULL OR oil_type IN (
            'UCO',
            'WINTERIZED',
            'ACID_OIL',
            'GUM_OIL',
            'MIXED_OIL',
            'DRAINED_OIL',
            'BLACK_OIL',
            'OTHER'
        )
    );

-- 2. Add new columns to events
ALTER TABLE high_aggregator_events
    ADD COLUMN IF NOT EXISTS company_name  TEXT,
    ADD COLUMN IF NOT EXISTS inbound_kg    DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS quantity_unit TEXT;

-- 3. Make the inbound_litres / inbound_kg / company_name columns selectable
--    for everyone authenticated (re-apply the existing permissive policy
--    pattern — they already SELECT * but we explicitly allow the new columns
--    by keeping SELECT *).
--    No RLS changes needed: existing policies use FOR SELECT.

-- 4. Index for company-name lookups
CREATE INDEX IF NOT EXISTS idx_events_company
    ON high_aggregator_events(company_name);

-- 5. Optional: backfill company_name from aggregator name when missing
--    (only where company_name is null and aggregator_id is set)
UPDATE high_aggregator_events e
   SET company_name = b.name
  FROM high_aggregator_branches b
 WHERE e.aggregator_id = b.id
   AND e.company_name IS NULL
   AND e.event_type = 'RECEIVED';
