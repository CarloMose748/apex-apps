-- Add test collections for your logged-in account
-- Run this in Supabase SQL Editor

-- Step 1: Check what email you're logged in as
SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Step 2: Find or create your customer record
-- First check if you have a customer record
SELECT id, email, full_name, status FROM customers;

-- If you don't have a customer record, create one
-- Replace 'YOUR_EMAIL_HERE' with the email from Step 1
INSERT INTO customers (email, full_name, phone_number, address, business_name, verification_status, status)
VALUES ('YOUR_EMAIL_HERE', 'Sheldon Ramrathan', '+27123456789', '123 Main St, Cape Town', 'Test Business', 'approved', 'active')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    status = 'active',
    verification_status = 'approved';

-- Step 3: Add test collections
-- Replace 'YOUR_EMAIL_HERE' with your actual email
INSERT INTO oil_collections (
    customer_id,
    driver_id,
    collection_date,
    collected_volume,
    unit,
    oil_type,
    oil_condition,
    collection_method,
    status,
    verified_by,
    verified_at,
    cost_collection_fee,
    notes
)
SELECT 
    c.id,
    (SELECT id FROM drivers LIMIT 1),
    NOW() - INTERVAL '5 days',
    25.5,
    'litres',
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    (SELECT id FROM admins LIMIT 1),
    NOW() - INTERVAL '4 days',
    150.00,
    'Test collection from restaurant'
FROM customers c
WHERE c.email = 'YOUR_EMAIL_HERE';

-- Add another collection
INSERT INTO oil_collections (
    customer_id,
    driver_id,
    collection_date,
    collected_volume,
    unit,
    oil_type,
    oil_condition,
    collection_method,
    status,
    verified_by,
    verified_at,
    cost_collection_fee,
    notes
)
SELECT 
    c.id,
    (SELECT id FROM drivers LIMIT 1),
    NOW() - INTERVAL '12 days',
    18.3,
    'litres',
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    (SELECT id FROM admins LIMIT 1),
    NOW() - INTERVAL '11 days',
    110.00,
    'Weekly collection'
FROM customers c
WHERE c.email = 'YOUR_EMAIL_HERE';

-- Step 4: Verify the collections were added
SELECT 
    c.email,
    oc.collection_date,
    oc.collected_volume,
    oc.unit,
    oc.cost_collection_fee,
    oc.status
FROM oil_collections oc
JOIN customers c ON c.id = oc.customer_id
WHERE c.email = 'YOUR_EMAIL_HERE'
ORDER BY oc.collection_date DESC;
