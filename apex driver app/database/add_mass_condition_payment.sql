-- =====================================================================
-- Driver app: unit choice, oil condition and payment amount
-- =====================================================================
--
-- Run this in the Supabase SQL editor BEFORE deploying the driver app.
-- Safe to re-run.
--
-- WHY
--   The driver could only enter a quantity labelled "kg", while the code
--   converted it as if it were litres. Collections are now entered in
--   either unit, so both figures are stored explicitly and nothing has to
--   guess which one a number represents.
--
--   Payment was never written at all, which is why every collection shows
--   R0.00. It now writes to cost_collection_fee, which is the column the
--   customer app and admin panel already read.
-- =====================================================================

BEGIN;

-- net_mass_kg is already read by the admin panel
-- (admin-panel/admin.html: collection.net_mass_kg || litresToKilograms(...))
-- but was never created. cost_collection_fee already exists from
-- oil_collections_update.sql; included here so the script stands alone.
ALTER TABLE oil_collections
    ADD COLUMN IF NOT EXISTS net_mass_kg          DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS unit                 VARCHAR(10) DEFAULT 'litres',
    ADD COLUMN IF NOT EXISTS cost_collection_fee  DECIMAL(10,2);

COMMENT ON COLUMN oil_collections.collected_volume IS
    'Quantity collected in LITRES. Canonical volume figure.';
COMMENT ON COLUMN oil_collections.net_mass_kg IS
    'Quantity collected in KILOGRAMS. Authoritative mass figure; 1 L = 0.92 kg.';
COMMENT ON COLUMN oil_collections.unit IS
    'The unit the driver actually measured in on site: litres or kg.';
COMMENT ON COLUMN oil_collections.cost_collection_fee IS
    'Amount actually paid to the customer for this collection, in Rand.';

-- Backfill mass for historical rows. Existing collected_volume values were
-- written by the old code, which treated the entered number as litres.
UPDATE oil_collections
SET    net_mass_kg = ROUND((collected_volume * 0.92)::numeric, 2)
WHERE  net_mass_kg IS NULL
  AND  collected_volume IS NOT NULL;

-- Existing rows were written with 'L'. Normalise to the single representation
-- the app now writes, so there is only one spelling in the column.
UPDATE oil_collections
SET    unit = 'litres'
WHERE  unit IS NULL
   OR  lower(btrim(unit)) IN ('l', 'litre', 'liters', 'liter', 'litres');

-- Oil condition already exists but was always written as 'Good' because the
-- driver had no way to change it. Normalise anything unexpected so the four
-- app values are the only ones present going forward.
UPDATE oil_collections
SET    oil_condition = 'Good'
WHERE  oil_condition IS NULL OR btrim(oil_condition) = '';

DO $$
DECLARE
    missing_mass INT;
    missing_pay  INT;
BEGIN
    SELECT count(*) INTO missing_mass FROM oil_collections WHERE net_mass_kg IS NULL;
    SELECT count(*) INTO missing_pay  FROM oil_collections WHERE cost_collection_fee IS NULL;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'rows still without net_mass_kg          : %', missing_mass;
    RAISE NOTICE 'rows still without cost_collection_fee  : %', missing_pay;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Historical rows have no payment figure recorded.';
    RAISE NOTICE 'They must be filled in by the office from the';
    RAISE NOTICE 'payment slips, or left blank. New collections will';
    RAISE NOTICE 'capture it at the point of payment.';
END $$;

COMMIT;
