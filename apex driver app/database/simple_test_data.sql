-- Simple test data for your jobs table
-- Run this in your Supabase SQL Editor to add some basic jobs

-- Clear existing test data (optional)
-- DELETE FROM jobs WHERE customer_name LIKE '%Test%';

-- Insert test jobs that match your schema exactly
INSERT INTO jobs (
    customer_name,
    customer_phone,
    customer_email,
    pickup_address,
    pickup_location,
    dropoff_address,
    dropoff_location,
    job_type,
    description,
    price,
    estimated_duration,
    status,
    created_at,
    updated_at
) VALUES 
(
    'Sarah Johnson',
    '+27823456789',
    'sarah.j@email.com',
    '380 Anton Lembede St, Durban Central, Durban',
    ST_GeomFromText('POINT(31.0218 -29.8587)', 4326),
    '15 Riverside Crescent, Berea, Durban',
    ST_GeomFromText('POINT(30.9967 -29.8386)', 4326),
    'delivery',
    'KFC food delivery - 2 piece meal with chips and drink',
    85.00,
    25,
    'available',
    NOW(),
    NOW()
),
(
    'Mike Thompson',
    '+27823456790',
    'mike.t@email.com',
    'Gateway Theatre of Shopping, Umhlanga',
    ST_GeomFromText('POINT(31.0621 -29.7282)', 4326),
    '45 Marine Drive, Umhlanga Rocks',
    ST_GeomFromText('POINT(31.0821 -29.7182)', 4326),
    'delivery',
    'McDonald''s family meal pickup and delivery',
    120.00,
    35,
    'available',
    NOW(),
    NOW()
),
(
    'Lisa Chen',
    '+27823456791',
    'lisa.chen@email.com',
    '115 Musgrave Rd, Berea, Durban',
    ST_GeomFromText('POINT(30.9967 -29.8386)', 4326),
    '234 Umbilo Road, Umbilo',
    ST_GeomFromText('POINT(30.9767 -29.8686)', 4326),
    'delivery',
    'Grocery delivery from Pick n Pay - 3 bags',
    95.00,
    20,
    'available',
    NOW(),
    NOW()
),
(
    'Robert Davies',
    '+27823456792',
    'robert.d@email.com',
    'Pavilion Shopping Centre, Westville',
    ST_GeomFromText('POINT(30.9285 -29.8276)', 4326),
    '123 Ridge Road, Durban North',
    ST_GeomFromText('POINT(31.0085 -29.8076)', 4326),
    'delivery',
    'Pharmacy delivery - prescription medication',
    75.00,
    30,
    'available',
    NOW(),
    NOW()
),
(
    'Business Services Ltd',
    '+27823456794',
    'admin@bizservices.co.za',
    '45 Sydney Rd, Durban CBD',
    ST_GeomFromText('POINT(31.0219 -29.8642)', 4326),
    '89 Florida Road, Morningside',
    ST_GeomFromText('POINT(30.9919 -29.8142)', 4326),
    'delivery',
    'Document delivery - legal contracts',
    60.00,
    15,
    'available',
    NOW(),
    NOW()
),
(
    'Express Customer',
    '+27823456795',
    'customer@email.com',
    'Durban Warehouse District',
    ST_GeomFromText('POINT(31.0319 -29.8742)', 4326),
    '567 Stamford Hill Road, Durban',
    ST_GeomFromText('POINT(30.9719 -29.8042)', 4326),
    'delivery',
    'Package delivery - online shopping order',
    180.00,
    25,
    'available',
    NOW(),
    NOW()
),
(
    'Priority Delivery Co',
    '+27823456796',
    'urgent@priority.co.za',
    'OR Tambo International Airport',
    ST_GeomFromText('POINT(31.0292 -29.8579)', 4326),
    'Sandton City Mall',
    ST_GeomFromText('POINT(28.0473 -26.1076)', 4326),
    'ride',
    'Airport transfer - urgent business trip',
    250.00,
    45,
    'available',
    NOW(),
    NOW()
);

-- Verify the data was inserted
SELECT 
    id,
    customer_name,
    pickup_address,
    job_type,
    price,
    status,
    ST_AsText(pickup_location) as pickup_coords
FROM jobs 
WHERE status = 'available'
ORDER BY created_at DESC;