-- Clean setup: Drop and recreate all tables
-- WARNING: This will delete all existing data!
-- Run this in Supabase SQL Editor

-- 1. Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS oil_collections CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 2. Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    address TEXT,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    business_registration VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'active',
    total_orders INTEGER DEFAULT 0,
    location GEOGRAPHY(POINT),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    vehicle_type VARCHAR(100),
    vehicle_registration VARCHAR(100),
    license_number VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create oil_collections table
CREATE TABLE oil_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    collected_volume DECIMAL(10, 2) NOT NULL,
    oil_type VARCHAR(100) DEFAULT 'Used Cooking Oil',
    oil_condition VARCHAR(50),
    collection_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending_verification',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255),
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    quality_assessment TEXT,
    disposal_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX idx_oil_collections_customer ON oil_collections(customer_id);
CREATE INDEX idx_oil_collections_driver ON oil_collections(driver_id);
CREATE INDEX idx_oil_collections_date ON oil_collections(collection_date);

-- 6. Enable RLS
ALTER TABLE oil_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Customers can view their own collections" 
ON oil_collections FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM customers WHERE email = auth.email()
    )
);

CREATE POLICY "Drivers can view their collections" 
ON oil_collections FOR SELECT 
USING (
    driver_id = auth.uid()
);

CREATE POLICY "Users can view their own customer record" 
ON customers FOR SELECT 
USING (email = auth.email());

-- 8. Insert sample customer and driver for testing
INSERT INTO customers (email, full_name, phone_number, address, business_name, verification_status, status)
VALUES 
('demo@customer.com', 'Demo Restaurant', '+27123456789', '123 Main St, Cape Town', 'Demo Restaurant Ltd', 'approved', 'active');

INSERT INTO drivers (email, full_name, phone_number, vehicle_type, verification_status, status)
VALUES 
('demo@driver.com', 'John Driver', '+27987654321', 'Truck', 'approved', 'active');

-- 9. Insert sample oil collections
INSERT INTO oil_collections (
    customer_id,
    driver_id,
    collection_date,
    collected_volume,
    oil_type,
    oil_condition,
    collection_method,
    status,
    verified_by,
    verified_at,
    payment_amount,
    notes
)
VALUES 
(
    (SELECT id FROM customers WHERE email = 'demo@customer.com'),
    (SELECT id FROM drivers WHERE email = 'demo@driver.com'),
    NOW() - INTERVAL '5 days',
    25.5,
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    'Admin User',
    NOW() - INTERVAL '4 days',
    76.50,
    'Regular collection from restaurant'
),
(
    (SELECT id FROM customers WHERE email = 'demo@customer.com'),
    (SELECT id FROM drivers WHERE email = 'demo@driver.com'),
    NOW() - INTERVAL '12 days',
    18.3,
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    'Admin User',
    NOW() - INTERVAL '11 days',
    54.90,
    'Weekly collection'
);

-- 10. Verify tables created
SELECT 
    'customers' as table_name,
    COUNT(*) as row_count
FROM customers
UNION ALL
SELECT 
    'drivers' as table_name,
    COUNT(*) as row_count
FROM drivers
UNION ALL
SELECT 
    'oil_collections' as table_name,
    COUNT(*) as row_count
FROM oil_collections;
