-- ============================================================
-- APEX Aggregator Depot — Clear Test / Demo Data
-- Run this in the Supabase SQL Editor for your project:
-- https://supabase.com/dashboard/project/ishhgfitddfeqaatimwl/sql
--
-- WARNING: This permanently deletes all records from the
-- aggregator tables. Only run this to wipe test data before
-- going live. Do NOT run once real operational data exists.
-- ============================================================

-- 1. Delete test results
DELETE FROM aggregator_test_results;

-- 2. Delete samples
DELETE FROM aggregator_samples;

-- 3. Delete purchase orders
DELETE FROM aggregator_purchase_orders;

-- 4. Delete bin events (receipts, store events, drainage events)
DELETE FROM aggregator_bin_events;

-- 5. Delete bins
DELETE FROM aggregator_bins;

-- Optional: also clear store assignments if that table exists
-- DELETE FROM aggregator_store_assignments;

-- Confirm row counts after cleanup
SELECT 'aggregator_bins' AS table_name, COUNT(*) AS remaining FROM aggregator_bins
UNION ALL
SELECT 'aggregator_bin_events', COUNT(*) FROM aggregator_bin_events
UNION ALL
SELECT 'aggregator_samples', COUNT(*) FROM aggregator_samples
UNION ALL
SELECT 'aggregator_test_results', COUNT(*) FROM aggregator_test_results;
