-- Fix RLS policies to allow customers to query their data
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing customer policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON customers;

-- 3. Create policy for customers to view their own data
CREATE POLICY "Customers can view their own profile" 
ON customers FOR SELECT 
USING (email = auth.jwt()->>'email');

-- 4. Create policy for customers to update their own data
CREATE POLICY "Customers can update their own profile" 
ON customers FOR UPDATE 
USING (email = auth.jwt()->>'email');

-- 5. Fix oil_collections RLS policy
DROP POLICY IF EXISTS "Customers can view their own collections" ON oil_collections;

CREATE POLICY "Customers can view their own collections" 
ON oil_collections FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
);

-- 6. Create policy for drivers table (if customers need to see driver names)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view driver info" ON drivers;

CREATE POLICY "Anyone can view driver info" 
ON drivers FOR SELECT 
USING (true);

-- 7. Verify policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('customers', 'oil_collections', 'drivers')
ORDER BY tablename, policyname;
