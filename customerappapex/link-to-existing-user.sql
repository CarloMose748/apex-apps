-- Link test collections to your existing user account
-- Run this in Supabase SQL Editor

-- First, check if you have a customer record
SELECT id, email, full_name FROM customers WHERE email LIKE '%sheldon%' OR email LIKE '%ramrathan%';

-- If no customer record exists, create one (replace with your actual email)
INSERT INTO customers (email, full_name, phone_number, address, business_name, verification_status, status)
VALUES ('your_email@example.com', 'Sheldon Ramrathan', '+27123456789', '123 Main St, Cape Town', 'Test Business', 'approved', 'active')
ON CONFLICT (email) DO NOTHING;

-- Add test collections linked to your account (replace with your actual email)
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
    (SELECT id FROM customers WHERE email = 'your_email@example.com'),
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
    'Test collection - Customer App'
WHERE (SELECT id FROM customers WHERE email = 'your_email@example.com') IS NOT NULL;
