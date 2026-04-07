-- Check and Create Tables for Customer App Collection History
-- Run this in Supabase SQL Editor

-- 1. Create customers table FIRST (no dependencies)
CREATE TABLE IF NOT EXISTS customers (
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

-- 2. Create drivers table SECOND (no dependencies)
CREATE TABLE IF NOT EXISTS drivers (
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

-- 3. Create oil_collections table THIRD (depends on customers and drivers)
CREATE TABLE IF NOT EXISTS oil_collections (
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

-- 4. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_oil_collections_customer ON oil_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_oil_collections_driver ON oil_collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_oil_collections_date ON oil_collections(collection_date);

-- 5. Enable Row Level Security
ALTER TABLE oil_collections ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own collections" ON oil_collections;
DROP POLICY IF EXISTS "Drivers can view their collections" ON oil_collections;

-- 7. Create RLS policies for customers to see their own collections
CREATE POLICY "Customers can view their own collections" 
ON oil_collections FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM customers WHERE email = auth.email()
    )
);

-- 8. Create RLS policies for drivers to see their collections
CREATE POLICY "Drivers can view their collections" 
ON oil_collections FOR SELECT 
USING (
    driver_id = auth.uid()
);

-- 9. Insert sample data for testing (optional)
-- Only insert if no collections exist for testing
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
SELECT 
    (SELECT id FROM customers LIMIT 1),
    (SELECT id FROM drivers LIMIT 1),
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
WHERE NOT EXISTS (SELECT 1 FROM oil_collections LIMIT 1);

-- 10. Query to check tables and data
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
