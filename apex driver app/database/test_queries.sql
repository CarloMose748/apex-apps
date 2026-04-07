-- Test Queries for Apex Driver Database
-- Run these in your Supabase SQL Editor to verify everything is working

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'customers', 'jobs', 'oil_collection_jobs', 'admins')
ORDER BY table_name;

-- 2. Count records in each table
SELECT 
    'drivers' as table_name, COUNT(*) as record_count FROM drivers
UNION ALL
SELECT 
    'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 
    'jobs' as table_name, COUNT(*) as record_count FROM jobs
UNION ALL
SELECT 
    'oil_collection_jobs' as table_name, COUNT(*) as record_count FROM oil_collection_jobs
UNION ALL
SELECT 
    'admins' as table_name, COUNT(*) as record_count FROM admins;

-- 3. Test the nearby_jobs function (Durban coordinates)
SELECT 
    id,
    customer_name,
    pickup_address,
    job_type,
    price,
    distance_km
FROM nearby_jobs(-29.8587, 31.0218, 15.0)
LIMIT 5;

-- 4. Test the nearby_oil_collection_jobs function
SELECT 
    id,
    customer_name,
    pickup_address,
    estimated_oil_volume,
    payment_amount,
    priority,
    distance_km
FROM nearby_oil_collection_jobs(-29.8587, 31.0218, 20.0);

-- 5. Check available jobs (what your frontend will see)
SELECT 
    id,
    customer_name,
    pickup_address,
    job_type,
    price,
    priority,
    created_at
FROM jobs 
WHERE status = 'available'
ORDER BY priority DESC, created_at DESC;

-- 6. Check available oil collection jobs
SELECT 
    id,
    customer_name,
    pickup_address,
    estimated_oil_volume,
    payment_amount,
    priority,
    created_at
FROM oil_collection_jobs 
WHERE status = 'available'
ORDER BY 
    CASE priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    created_at DESC;

-- 7. Test driver stats function (use an actual driver ID from your drivers table)
-- First, get a driver ID:
SELECT id, full_name FROM drivers WHERE verification_status = 'approved' LIMIT 1;

-- Then test the function (replace with actual driver ID):
-- SELECT * FROM get_driver_oil_collection_stats('ACTUAL_DRIVER_ID_HERE');

-- 8. Check if PostGIS is working correctly
SELECT 
    customer_name,
    pickup_address,
    ST_AsText(pickup_location) as location_text,
    ST_X(pickup_location) as longitude,
    ST_Y(pickup_location) as latitude
FROM jobs 
WHERE pickup_location IS NOT NULL
LIMIT 3;

-- 9. Test distance calculation function
SELECT calculate_distance(-29.8587, 31.0218, -29.7282, 31.0621) as distance_km_durban_to_umhlanga;

-- 10. Check RLS policies are active
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('drivers', 'customers', 'jobs', 'oil_collection_jobs');

-- Expected Results:
-- 1. Should show 5 tables
-- 2. Should show counts: drivers (4), customers (5), jobs (27), oil_collection_jobs (3), admins (2)
-- 3. Should show jobs sorted by distance from Durban
-- 4. Should show oil collection jobs
-- 5. Should show 7 available regular jobs
-- 6. Should show 3 available oil collection jobs
-- 7. Will work once you have a driver ID
-- 8. Should show coordinate data correctly
-- 9. Should return approximately 19.7 km
-- 10. All should show 'true' for rowsecurity