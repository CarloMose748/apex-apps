-- Check what tables and columns currently exist
-- Run this first to see what's in your database

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check columns in oil_collections table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'oil_collections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check columns in customers table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check columns in drivers table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
