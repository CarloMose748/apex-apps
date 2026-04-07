-- Add customer_id column to oil_collections table for Customer App
-- This allows customers to view their collections directly

-- 1. Add customer_id column
ALTER TABLE oil_collections 
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- 2. Add foreign key constraint to customers table
ALTER TABLE oil_collections 
ADD CONSTRAINT fk_oil_collections_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_oil_collections_customer_id ON oil_collections(customer_id);

-- 4. Update RLS policy to include customer_id queries
DROP POLICY IF EXISTS "Customers can view their own collections" ON oil_collections;

CREATE POLICY "Customers can view their own collections" 
ON oil_collections FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM customers WHERE email = auth.email()
    )
);

-- 5. Insert sample data with customer_id for testing
-- First, ensure we have a test customer
INSERT INTO customers (email, full_name, phone_number, address, business_name, verification_status, status)
VALUES ('demo@customer.com', 'Demo Restaurant', '+27123456789', '123 Main St, Cape Town', 'Demo Restaurant Ltd', 'approved', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert test collections with customer_id
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
    (SELECT id FROM customers WHERE email = 'demo@customer.com'),
    (SELECT id FROM drivers LIMIT 1),
    NOW() - INTERVAL '5 days',
    25.5,
    'litres',
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    (SELECT id FROM admins LIMIT 1),  -- Use admin ID, not driver ID
    NOW() - INTERVAL '4 days',
    150.00,
    'Regular collection from restaurant - Test data for Customer App'
WHERE NOT EXISTS (
    SELECT 1 FROM oil_collections 
    WHERE customer_id = (SELECT id FROM customers WHERE email = 'demo@customer.com')
);

-- Add another test collection
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
    (SELECT id FROM customers WHERE email = 'demo@customer.com'),
    (SELECT id FROM drivers LIMIT 1),
    NOW() - INTERVAL '12 days',
    18.3,
    'litres',
    'Used Cooking Oil',
    'Good',
    'Manual Collection',
    'completed',
    (SELECT id FROM admins LIMIT 1),  -- Use admin ID, not driver ID
    NOW() - INTERVAL '11 days',
    110.00,
    'Weekly collection - Test data for Customer App'
WHERE (
    SELECT COUNT(*) FROM oil_collections 
    WHERE customer_id = (SELECT id FROM customers WHERE email = 'demo@customer.com')
) < 2;

-- 6. Verify the changes
SELECT 
    c.email as customer_email,
    c.full_name as customer_name,
    oc.collection_date,
    oc.collected_volume,
    oc.unit,
    oc.oil_type,
    oc.status
FROM oil_collections oc
JOIN customers c ON oc.customer_id = c.id
ORDER BY oc.collection_date DESC;
