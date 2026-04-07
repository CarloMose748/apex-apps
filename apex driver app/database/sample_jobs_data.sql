-- Sample Jobs Data for Apex Driver App
-- This script inserts comprehensive job data that matches the mock data structure used in jobs.html
-- Run this after your main schema.sql to populate the database with realistic job data

-- First, let's add some additional job types to better match your frontend
-- Update the existing jobs table to include more specific job categories
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Insert realistic Durban-area jobs that match your mock data structure
INSERT INTO jobs (
    customer_name, 
    customer_phone, 
    customer_email,
    pickup_address, 
    pickup_location, 
    dropoff_address, 
    dropoff_location,
    job_type, 
    business_name,
    description, 
    price, 
    estimated_duration,
    priority,
    special_instructions,
    status
) VALUES
-- Food Delivery Jobs
(
    'Sarah Johnson', 
    '+27823456789', 
    'sarah.j@email.com',
    '380 Anton Lembede St, Durban Central, Durban', 
    ST_GeomFromText('POINT(31.0218 -29.8587)', 4326),
    '15 Riverside Crescent, Berea, Durban',
    ST_GeomFromText('POINT(30.9967 -29.8386)', 4326),
    'food_delivery',
    'KFC',
    'KFC Delivery - 2 piece meal with chips and drink', 
    85.00, 
    25,
    false,
    'Customer prefers contactless delivery',
    'available'
),
(
    'Mike Thompson', 
    '+27823456790', 
    'mike.t@email.com',
    'Gateway Theatre of Shopping, Umhlanga', 
    ST_GeomFromText('POINT(31.0621 -29.7282)', 4326),
    '45 Marine Drive, Umhlanga Rocks',
    ST_GeomFromText('POINT(31.0821 -29.7182)', 4326),
    'food_delivery',
    'McDonald\'s',
    'McDonald\'s Pickup - Family meal for 4', 
    120.00, 
    35,
    true,
    'Priority delivery - customer waiting',
    'available'
),
(
    'Lisa Chen', 
    '+27823456791', 
    'lisa.chen@email.com',
    '1 Chartwell Dr, Umhlanga', 
    ST_GeomFromText('POINT(31.0421 -29.7192)', 4326),
    '78 Silverton Road, Chatsworth',
    ST_GeomFromText('POINT(30.8821 -29.9192)', 4326),
    'food_delivery',
    'Steers',
    'Uber Eats - Steers burger meal', 
    110.00, 
    40,
    false,
    'Third floor apartment, use intercom',
    'available'
),

-- Grocery Delivery Jobs
(
    'Robert Davies', 
    '+27823456792', 
    'robert.d@email.com',
    '115 Musgrave Rd, Berea, Durban', 
    ST_GeomFromText('POINT(30.9967 -29.8386)', 4326),
    '234 Umbilo Road, Umbilo',
    ST_GeomFromText('POINT(30.9767 -29.8686)', 4326),
    'grocery_delivery',
    'Pick n Pay',
    'Grocery Delivery - Weekly shopping, 3 bags', 
    95.00, 
    20,
    false,
    'Heavy items included, may need assistance',
    'available'
),

-- Pharmacy Delivery Jobs
(
    'Mary Wilson', 
    '+27823456793', 
    'mary.w@email.com',
    'Pavilion Shopping Centre, Westville', 
    ST_GeomFromText('POINT(30.9285 -29.8276)', 4326),
    '123 Ridge Road, Durban North',
    ST_GeomFromText('POINT(31.0085 -29.8076)', 4326),
    'pharmacy_delivery',
    'Clicks',
    'Pharmacy Run - Prescription medication', 
    75.00, 
    30,
    false,
    'Requires signature on delivery',
    'available'
),

-- Document Delivery Jobs
(
    'Business Services Ltd', 
    '+27823456794', 
    'admin@bizservices.co.za',
    '45 Sydney Rd, Durban CBD', 
    ST_GeomFromText('POINT(31.0219 -29.8642)', 4326),
    '89 Florida Road, Morningside',
    ST_GeomFromText('POINT(30.9919 -29.8142)', 4326),
    'document_delivery',
    'Legal Documents',
    'Document Delivery - Legal contracts', 
    60.00, 
    15,
    false,
    'Confidential documents, ID required',
    'available'
),

-- Package Delivery Jobs
(
    'Online Store Customer', 
    '+27823456795', 
    'customer@email.com',
    'Durban Warehouse District', 
    ST_GeomFromText('POINT(31.0319 -29.8742)', 4326),
    '567 Stamford Hill Road, Durban',
    ST_GeomFromText('POINT(30.9719 -29.8042)', 4326),
    'package_delivery',
    'Courier Plus',
    'Package Delivery - Online shopping order', 
    80.00, 
    25,
    false,
    'Medium-sized package, fragile contents',
    'available'
);

-- Insert Oil Collection Jobs (matching your mock data)
INSERT INTO oil_collection_jobs (
    customer_name, 
    customer_phone, 
    customer_email,
    pickup_address, 
    pickup_location,
    job_type,
    description, 
    estimated_oil_volume,
    payment_amount,
    priority,
    special_instructions,
    status
) VALUES
(
    'Nando\'s Manager', 
    '+27823456796', 
    'manager@nandos-gateway.co.za',
    'Shop 2, Gateway Theatre of Shopping, Umhlanga', 
    ST_GeomFromText('POINT(31.0625 -29.7285)', 4326),
    'oil_collection',
    'Restaurant Oil Collection - Nando\'s weekly pickup', 
    45.0,
    150.00,
    'normal',
    'Collection between 10AM-2PM only',
    'available'
),
(
    'Southern Sun Hotel', 
    '+27823456797', 
    'operations@southernsun-durban.co.za',
    '54 O R Tambo Parade, Durban', 
    ST_GeomFromText('POINT(31.0292 -29.8579)', 4326),
    'oil_collection',
    'Hotel Oil Pickup - Kitchen waste oil collection', 
    120.0,
    200.00,
    'high',
    'Service entrance only, contact security first',
    'available'
),
(
    'KFC Pavilion', 
    '+27823456798', 
    'manager@kfc-pavilion.co.za',
    'Shop 15, Pavilion Shopping Centre, Westville', 
    ST_GeomFromText('POINT(30.9290 -29.8280)', 4326),
    'oil_collection',
    'Fast Food Oil Collection - KFC weekly service', 
    55.0,
    120.00,
    'normal',
    'Use rear entrance, containers ready at 3PM',
    'available'
);

-- Add some sample customers to match the jobs
INSERT INTO customers (
    email, 
    full_name, 
    phone_number, 
    address, 
    location,
    verification_status,
    total_orders
) VALUES
('sarah.j@email.com', 'Sarah Johnson', '+27823456789', '15 Riverside Crescent, Berea, Durban', ST_GeomFromText('POINT(30.9967 -29.8386)', 4326), 'approved', 5),
('mike.t@email.com', 'Mike Thompson', '+27823456790', '45 Marine Drive, Umhlanga Rocks', ST_GeomFromText('POINT(31.0821 -29.7182)', 4326), 'approved', 3),
('lisa.chen@email.com', 'Lisa Chen', '+27823456791', '78 Silverton Road, Chatsworth', ST_GeomFromText('POINT(30.8821 -29.9192)', 4326), 'approved', 8),
('robert.d@email.com', 'Robert Davies', '+27823456792', '234 Umbilo Road, Umbilo', ST_GeomFromText('POINT(30.9767 -29.8686)', 4326), 'approved', 2),
('mary.w@email.com', 'Mary Wilson', '+27823456793', '123 Ridge Road, Durban North', ST_GeomFromText('POINT(31.0085 -29.8076)', 4326), 'approved', 12);

-- Add some more verified drivers
INSERT INTO drivers (
    email, 
    full_name, 
    phone_number, 
    vehicle_type, 
    license_number, 
    vehicle_make, 
    vehicle_model, 
    vehicle_year, 
    vehicle_plate, 
    location,
    verification_status,
    status,
    rating,
    total_jobs
) VALUES
('peter.driver@email.com', 'Peter Matthews', '+27823456800', 'car', 'ABC789012', 'Honda', 'Civic', 2021, 'CA789GP', ST_GeomFromText('POINT(31.0018 -29.8524)', 4326), 'approved', 'active', 4.8, 156),
('susan.rider@email.com', 'Susan Naidoo', '+27823456801', 'motorcycle', 'DEF456789', 'Yamaha', 'R15', 2020, 'CA012GP', ST_GeomFromText('POINT(30.9918 -29.8824)', 4326), 'approved', 'active', 4.9, 203),
('david.express@email.com', 'David Mthembu', '+27823456802', 'van', 'GHI123456', 'Ford', 'Transit', 2019, 'CA345GP', ST_GeomFromText('POINT(31.0218 -29.8424)', 4326), 'approved', 'active', 4.7, 89),
('alex.delivery@email.com', 'Alex Patel', '+27823456803', 'car', 'JKL987654', 'Toyota', 'Corolla', 2022, 'CA678GP', ST_GeomFromText('POINT(30.9818 -29.8924)', 4326), 'approved', 'active', 4.6, 134);

-- Create a view for easy job retrieval that matches your frontend expectations
CREATE OR REPLACE VIEW available_jobs_view AS
SELECT 
    j.id,
    j.customer_name,
    j.customer_phone,
    j.pickup_address,
    j.dropoff_address,
    j.pickup_location,
    j.dropoff_location,
    j.job_type,
    j.business_name,
    j.description,
    j.price,
    j.estimated_duration,
    j.priority,
    j.special_instructions,
    j.status,
    j.created_at,
    -- Extract coordinates for frontend use
    ST_X(j.pickup_location) as pickup_lng,
    ST_Y(j.pickup_location) as pickup_lat,
    ST_X(j.dropoff_location) as dropoff_lng,
    ST_Y(j.dropoff_location) as dropoff_lat
FROM jobs j
WHERE j.status = 'available'
ORDER BY 
    CASE WHEN j.priority = true THEN 0 ELSE 1 END,
    j.created_at DESC;

-- Create a view for oil collection jobs
CREATE OR REPLACE VIEW available_oil_collection_jobs_view AS
SELECT 
    ocj.id,
    ocj.customer_name,
    ocj.customer_phone,
    ocj.pickup_address,
    ocj.pickup_location,
    ocj.job_type,
    ocj.description,
    ocj.estimated_oil_volume,
    ocj.payment_amount,
    ocj.priority,
    ocj.special_instructions,
    ocj.status,
    ocj.created_at,
    -- Extract coordinates for frontend use
    ST_X(ocj.pickup_location) as pickup_lng,
    ST_Y(ocj.pickup_location) as pickup_lat
FROM oil_collection_jobs ocj
WHERE ocj.status = 'available'
ORDER BY 
    CASE ocj.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    ocj.created_at DESC;

-- Function to get all available jobs in format expected by frontend
CREATE OR REPLACE FUNCTION get_available_jobs_for_frontend()
RETURNS JSON AS $$
DECLARE
    jobs_json JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'customer_name', customer_name,
            'customer_phone', customer_phone,
            'pickup_address', pickup_address,
            'dropoff_address', dropoff_address,
            'pickup_location', pickup_location,
            'pickup_lat', pickup_lat,
            'pickup_lng', pickup_lng,
            'dropoff_lat', dropoff_lng,
            'dropoff_lng', dropoff_lng,
            'job_type', job_type,
            'business_name', business_name,
            'description', description,
            'price', price,
            'estimated_duration', estimated_duration,
            'priority', priority,
            'special_instructions', special_instructions,
            'created_at', created_at
        )
    ) INTO jobs_json
    FROM available_jobs_view;
    
    RETURN COALESCE(jobs_json, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get available oil collection jobs for frontend
CREATE OR REPLACE FUNCTION get_available_oil_jobs_for_frontend()
RETURNS JSON AS $$
DECLARE
    jobs_json JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'customer_name', customer_name,
            'customer_phone', customer_phone,
            'pickup_address', pickup_address,
            'pickup_lat', pickup_lat,
            'pickup_lng', pickup_lng,
            'job_type', job_type,
            'description', description,
            'estimated_oil_volume', estimated_oil_volume,
            'payment_amount', payment_amount,
            'priority', priority,
            'special_instructions', special_instructions,
            'created_at', created_at
        )
    ) INTO jobs_json
    FROM available_oil_collection_jobs_view;
    
    RETURN COALESCE(jobs_json, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Add some completed jobs for analytics
INSERT INTO jobs (
    customer_name, 
    customer_phone, 
    pickup_address, 
    pickup_location, 
    dropoff_address, 
    dropoff_location,
    job_type, 
    business_name,
    description, 
    price, 
    estimated_duration,
    actual_duration,
    status,
    driver_id,
    assigned_at,
    started_at,
    completed_at,
    customer_rating,
    driver_rating
) 
SELECT 
    'Completed Customer ' || generate_series,
    '+2782345' || LPAD(generate_series::text, 4, '0'),
    'Sample Address ' || generate_series || ', Durban',
    ST_GeomFromText('POINT(' || (31.0 + random() * 0.1) || ' ' || (-29.85 + random() * 0.1) || ')', 4326),
    'Destination ' || generate_series || ', Durban',
    ST_GeomFromText('POINT(' || (31.0 + random() * 0.1) || ' ' || (-29.85 + random() * 0.1) || ')', 4326),
    CASE (generate_series % 4)
        WHEN 0 THEN 'food_delivery'
        WHEN 1 THEN 'grocery_delivery'
        WHEN 2 THEN 'pharmacy_delivery'
        ELSE 'package_delivery'
    END,
    'Business ' || generate_series,
    'Completed job ' || generate_series,
    50.00 + (random() * 100),
    20 + (random() * 40)::integer,
    15 + (random() * 35)::integer,
    'completed',
    (SELECT id FROM drivers WHERE verification_status = 'approved' ORDER BY random() LIMIT 1),
    NOW() - interval '2 days' + (random() * interval '1 day'),
    NOW() - interval '2 days' + (random() * interval '1 day') + interval '5 minutes',
    NOW() - interval '2 days' + (random() * interval '1 day') + interval '30 minutes',
    3 + (random() * 2)::integer, -- Random rating 3-5
    4 + (random() * 1)::integer  -- Random rating 4-5
FROM generate_series(1, 20);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== SAMPLE JOBS DATA INSERTED SUCCESSFULLY ===';
    RAISE NOTICE 'Regular Jobs: 7 available jobs inserted';
    RAISE NOTICE 'Oil Collection Jobs: 3 available jobs inserted'; 
    RAISE NOTICE 'Additional Customers: 5 customers added';
    RAISE NOTICE 'Additional Drivers: 4 drivers added';
    RAISE NOTICE 'Historical Jobs: 20 completed jobs for analytics';
    RAISE NOTICE 'Views Created: available_jobs_view, available_oil_collection_jobs_view';
    RAISE NOTICE 'Functions Created: get_available_jobs_for_frontend(), get_available_oil_jobs_for_frontend()';
    RAISE NOTICE '';
    RAISE NOTICE 'Your database is now ready for live data!';
    RAISE NOTICE 'Update your ApexDriverService.getAvailableJobs() to use the new database data.';
END $$;