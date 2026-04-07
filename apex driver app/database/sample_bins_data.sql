-- Sample Data for Bins System Testing
-- Run this after creating the bins tables and having some customers in the database

-- First, let's add some sample customers (if you don't have any yet)
INSERT INTO customers (id, email, full_name, phone_number, address, verification_status, verified_by, verified_at, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.smith@email.com', 'John Smith', '+27821234567', '123 Oak Street, Durban North, Durban', 'approved', 'admin@apexdriver.com', NOW() - INTERVAL '2 days', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson@email.com', 'Sarah Johnson', '+27821234568', '456 Pine Avenue, Berea, Durban', 'approved', 'admin@apexdriver.com', NOW() - INTERVAL '1 day', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'mike.williams@email.com', 'Mike Williams', '+27821234569', '789 Maple Drive, Westville, Durban', 'approved', 'admin@apexdriver.com', NOW() - INTERVAL '3 hours', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'lisa.brown@email.com', 'Lisa Brown', '+27821234570', '321 Cedar Road, Chatsworth, Durban', 'pending', NULL, NULL, 'active'),
('550e8400-e29b-41d4-a716-446655440005', 'david.davis@email.com', 'David Davis', '+27821234571', '654 Birch Lane, Umhlanga, Durban', 'approved', 'admin@apexdriver.com', NOW() - INTERVAL '5 days', 'active');

-- Sample bins assigned to approved customers
INSERT INTO bins (customer_id, bin_serial_number, bin_type, bin_size_liters, assigned_by, collection_frequency, location_notes, special_instructions, next_scheduled_collection) VALUES
-- John Smith's bins
('550e8400-e29b-41d4-a716-446655440001', 'BIN001', 'standard', 120, 'admin@apexdriver.com', 'weekly', 'Front gate, blue bin next to driveway', 'Please close gate after collection', NOW() + INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440001', 'BIN002', 'large', 240, 'admin@apexdriver.com', 'bi-weekly', 'Back yard, green bin behind garage', 'Use side gate, key under flower pot', NOW() + INTERVAL '5 days'),

-- Sarah Johnson's bin
('550e8400-e29b-41d4-a716-446655440002', 'BIN003', 'standard', 120, 'admin@apexdriver.com', 'weekly', 'Apartment complex, Unit 5B, communal area', 'Ring buzzer for access, bin marked SJ', NOW() + INTERVAL '1 day'),

-- Mike Williams's bins
('550e8400-e29b-41d4-a716-446655440003', 'BIN004', 'small', 80, 'admin@apexdriver.com', 'weekly', 'Front porch, black bin', NULL, NOW() + INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440003', 'BIN005', 'commercial', 660, 'admin@apexdriver.com', 'daily', 'Business premises, loading dock area', 'Commercial pickup - heavy machinery may be needed', NOW() + INTERVAL '1 day'),

-- David Davis's bin (older customer with history)
('550e8400-e29b-41d4-a716-446655440005', 'BIN006', 'standard', 120, 'admin@apexdriver.com', 'weekly', 'Front lawn, brown bin near mailbox', 'Customer prefers early morning pickup', NOW() + INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440005', 'BIN007', 'large', 240, 'admin@apexdriver.com', 'monthly', 'Garden shed, white bin for garden waste', 'Organic waste only', NOW() + INTERVAL '15 days');

-- Sample collection history (some past collections)
INSERT INTO bin_collections (bin_id, customer_id, driver_id, collection_date, collection_status, collection_type, waste_amount_kg, waste_type, collection_notes, customer_satisfaction) VALUES
-- John Smith's collections
((SELECT id FROM bins WHERE bin_serial_number = 'BIN001'), '550e8400-e29b-41d4-a716-446655440001', NULL, NOW() - INTERVAL '7 days', 'completed', 'regular', 15.5, 'household', 'Standard pickup, bin was full', 5),
((SELECT id FROM bins WHERE bin_serial_number = 'BIN001'), '550e8400-e29b-41d4-a716-446655440001', NULL, NOW() - INTERVAL '14 days', 'completed', 'regular', 12.0, 'household', 'Normal collection', 4),

-- Sarah Johnson's collections
((SELECT id FROM bins WHERE bin_serial_number = 'BIN003'), '550e8400-e29b-41d4-a716-446655440002', NULL, NOW() - INTERVAL '7 days', 'completed', 'regular', 8.5, 'household', 'Apartment pickup completed', 5),

-- Mike Williams's collections (commercial customer)
((SELECT id FROM bins WHERE bin_serial_number = 'BIN005'), '550e8400-e29b-41d4-a716-446655440003', NULL, NOW() - INTERVAL '1 day', 'completed', 'regular', 45.0, 'commercial', 'Large commercial bin, required extra time', 4),
((SELECT id FROM bins WHERE bin_serial_number = 'BIN005'), '550e8400-e29b-41d4-a716-446655440003', NULL, NOW() - INTERVAL '2 days', 'completed', 'regular', 50.2, 'commercial', 'Heavy load, used mechanical assistance', 5),

-- David Davis's collections (long-time customer)
((SELECT id FROM bins WHERE bin_serial_number = 'BIN006'), '550e8400-e29b-41d4-a716-446655440005', NULL, NOW() - INTERVAL '7 days', 'completed', 'regular', 18.0, 'household', 'Regular weekly pickup', 5),
((SELECT id FROM bins WHERE bin_serial_number = 'BIN006'), '550e8400-e29b-41d4-a716-446655440005', NULL, NOW() - INTERVAL '14 days', 'completed', 'regular', 16.5, 'household', 'Customer very satisfied with service', 5),
((SELECT id FROM bins WHERE bin_serial_number = 'BIN007'), '550e8400-e29b-41d4-a716-446655440005', NULL, NOW() - INTERVAL '30 days', 'completed', 'regular', 25.0, 'organic', 'Garden waste collection', 4);

-- Sample bin maintenance records
INSERT INTO bin_maintenance (bin_id, maintenance_type, maintenance_status, reported_by, issue_description, resolution_notes, scheduled_date, completed_date) VALUES
-- Completed maintenance
((SELECT id FROM bins WHERE bin_serial_number = 'BIN002'), 'repair', 'completed', 'john.smith@email.com', 'Lid hinge broken, cannot close properly', 'Replaced lid hinge mechanism, tested functionality', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),

-- Pending maintenance
((SELECT id FROM bins WHERE bin_serial_number = 'BIN004'), 'cleaning', 'pending', 'mike.williams@email.com', 'Strong odor, needs deep cleaning', NULL, NOW() + INTERVAL '2 days', NULL),

-- In progress maintenance
((SELECT id FROM bins WHERE bin_serial_number = 'BIN005'), 'inspection', 'in_progress', 'admin@apexdriver.com', 'Routine commercial bin inspection', 'Currently inspecting for wear and safety compliance', NOW(), NULL);

-- Update some bins with realistic last collection dates based on the collection history
UPDATE bins SET 
    last_collection_date = NOW() - INTERVAL '7 days'
WHERE bin_serial_number IN ('BIN001', 'BIN003', 'BIN006');

UPDATE bins SET 
    last_collection_date = NOW() - INTERVAL '1 day'
WHERE bin_serial_number = 'BIN005';

UPDATE bins SET 
    last_collection_date = NOW() - INTERVAL '30 days'
WHERE bin_serial_number = 'BIN007';

-- Add some bins with different statuses for testing
INSERT INTO bins (customer_id, bin_serial_number, bin_type, bin_size_liters, bin_status, assigned_by, collection_frequency, location_notes, special_instructions) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'BIN008', 'standard', 120, 'maintenance', 'admin@apexdriver.com', 'weekly', 'Second bin for apartment', 'Currently under repair'),
('550e8400-e29b-41d4-a716-446655440003', 'BIN009', 'large', 240, 'inactive', 'admin@apexdriver.com', 'weekly', 'Temporary bin, not in use', 'Customer requested temporary suspension');

-- Sample queries to test the data
/*
-- Test queries (uncomment to run):

-- Get all bins for a specific customer
SELECT * FROM get_customer_bins('550e8400-e29b-41d4-a716-446655440001');

-- Get bins due for collection in the next 7 days
SELECT * FROM get_bins_due_for_collection(7);

-- View all customers with their bins
SELECT 
    c.full_name,
    c.phone_number,
    b.bin_serial_number,
    b.bin_type,
    b.bin_status,
    b.collection_frequency,
    b.next_scheduled_collection
FROM customers c
JOIN bins b ON c.id = b.customer_id
WHERE c.verification_status = 'approved'
ORDER BY c.full_name, b.bin_serial_number;

-- Collection history summary
SELECT 
    c.full_name,
    b.bin_serial_number,
    COUNT(bc.id) as total_collections,
    AVG(bc.customer_satisfaction) as avg_satisfaction,
    SUM(bc.waste_amount_kg) as total_waste_kg
FROM customers c
JOIN bins b ON c.id = b.customer_id
LEFT JOIN bin_collections bc ON b.id = bc.bin_id AND bc.collection_status = 'completed'
GROUP BY c.id, b.id
ORDER BY total_collections DESC;
*/