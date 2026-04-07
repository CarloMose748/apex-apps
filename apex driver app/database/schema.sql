-- Apex Driver Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL, -- 'car', 'motorcycle', 'bicycle', 'van'
    license_number VARCHAR(100),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'busy', 'offline', 'suspended'
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
    verification_notes TEXT,
    verified_by VARCHAR(255), -- admin email who verified
    verified_at TIMESTAMPTZ,
    location GEOMETRY(POINT, 4326), -- Geographic location using PostGIS
    last_location_update TIMESTAMPTZ,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    pickup_address TEXT NOT NULL,
    pickup_location GEOMETRY(POINT, 4326),
    dropoff_address TEXT NOT NULL,
    dropoff_location GEOMETRY(POINT, 4326),
    job_type VARCHAR(50) DEFAULT 'delivery', -- 'delivery', 'ride', 'pickup'
    description TEXT,
    price DECIMAL(10,2),
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    distance_km DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'assigned', 'in_progress', 'completed', 'cancelled'
    driver_id UUID REFERENCES drivers(id),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job tracking table for real-time location updates during active jobs
CREATE TABLE IF NOT EXISTS job_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    location GEOMETRY(POINT, 4326),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    speed DECIMAL(5,2), -- km/h
    heading DECIMAL(5,2) -- degrees
);

-- Earnings table for driver payment tracking
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id),
    job_id UUID REFERENCES jobs(id),
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% commission
    commission_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver reviews table
CREATE TABLE IF NOT EXISTS driver_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id),
    driver_id UUID REFERENCES drivers(id),
    customer_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    location GEOMETRY(POINT, 4326),
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
    verification_notes TEXT,
    verified_by VARCHAR(255), -- admin email who verified
    verified_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended'
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin'
    permissions TEXT[], -- Array of permissions
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification history table to track all verification actions
CREATE TABLE IF NOT EXISTS verification_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'driver', 'customer'
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'pending'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_customers_verification_status ON customers(verification_status);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_verification_history_user ON verification_history(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_verification_history_admin ON verification_history(admin_email);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_driver_id ON jobs(driver_id);
CREATE INDEX IF NOT EXISTS idx_jobs_pickup_location ON jobs USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_jobs_dropoff_location ON jobs USING GIST(dropoff_location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_tracking_job_id ON job_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_job_tracking_timestamp ON job_tracking(timestamp);

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromText('POINT(' || lng1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lng2 || ' ' || lat2 || ')')
    ) / 1000.0; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby jobs
CREATE OR REPLACE FUNCTION nearby_jobs(lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 10.0)
RETURNS TABLE(
    id UUID,
    customer_name VARCHAR,
    pickup_address TEXT,
    dropoff_address TEXT,
    job_type VARCHAR,
    price DECIMAL,
    distance_km FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.customer_name,
        j.pickup_address,
        j.dropoff_address,
        j.job_type,
        j.price,
        ST_Distance(
            ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
            j.pickup_location::geography
        ) / 1000.0 as distance_km,
        j.created_at
    FROM jobs j
    WHERE j.status = 'available'
    AND j.pickup_location IS NOT NULL
    AND ST_DWithin(
        ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
        j.pickup_location::geography,
        radius_km * 1000 -- Convert km to meters
    )
    ORDER BY distance_km, j.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby drivers
CREATE OR REPLACE FUNCTION nearby_drivers(lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 5.0)
RETURNS TABLE(
    id UUID,
    full_name VARCHAR,
    vehicle_type VARCHAR,
    rating DECIMAL,
    distance_km FLOAT,
    last_location_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.full_name,
        d.vehicle_type,
        d.rating,
        ST_Distance(
            ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
            d.location::geography
        ) / 1000.0 as distance_km,
        d.last_location_update
    FROM drivers d
    WHERE d.status = 'active'
    AND d.location IS NOT NULL
    AND ST_DWithin(
        ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
        d.location::geography,
        radius_km * 1000 -- Convert km to meters
    )
    ORDER BY distance_km, d.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables that need updated_at tracking
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

-- Basic policies (you may want to customize these based on your authentication setup)
-- Allow all operations for authenticated users (you should customize this)
CREATE POLICY "Allow authenticated users full access to drivers" ON drivers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to customers" ON customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read admins" ON admins
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users full access to jobs" ON jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to job_tracking" ON job_tracking
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to driver_earnings" ON driver_earnings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to driver_reviews" ON driver_reviews
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous users to read available jobs (for public job board)
CREATE POLICY "Allow anonymous users to read available jobs" ON jobs
    FOR SELECT TO anon USING (status = 'available');

-- Allow anonymous users to create driver/customer records during signup
CREATE POLICY "Allow anonymous users to create driver records" ON drivers
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous users to create customer records" ON customers
    FOR INSERT TO anon WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO drivers (email, full_name, phone_number, vehicle_type, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, location, verification_status) VALUES
('john.doe@example.com', 'John Doe', '+27123456789', 'car', 'ABC123456', 'Toyota', 'Corolla', 2020, 'CA123GP', ST_GeomFromText('POINT(30.8595 -29.8824)', 4326), 'approved'), -- Durban area
('jane.smith@example.com', 'Jane Smith', '+27123456790', 'motorcycle', 'DEF789012', 'Honda', 'CBR600', 2019, 'CA456GP', ST_GeomFromText('POINT(30.8795 -29.8924)', 4326), 'pending');

INSERT INTO customers (email, full_name, phone_number, address, location, verification_status) VALUES
('alice.johnson@example.com', 'Alice Johnson', '+27123456791', '123 Smith Street, Durban', ST_GeomFromText('POINT(30.8595 -29.8824)', 4326), 'approved'),
('bob.wilson@example.com', 'Bob Wilson', '+27123456792', '789 Green Avenue, Durban', ST_GeomFromText('POINT(30.8495 -29.8724)', 4326), 'pending');

INSERT INTO admins (email, full_name, role, permissions) VALUES
('admin@apexcollector.com', 'System Administrator', 'super_admin', ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins']),
('moderator@apexcollector.com', 'Platform Moderator', 'admin', ARRAY['verify_users', 'view_analytics']);

-- NOTE: To create your own admin account:
-- 1. First create a regular account through auth.html with your email address
-- 2. Then update the admin email above to match your account, or add a new record:
-- 
-- INSERT INTO admins (email, full_name, role, permissions) VALUES
-- ('your-email@example.com', 'Your Name', 'super_admin', ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins']);
-- 
-- 3. If you created a driver/customer record during signup, update their verification status:
-- 
-- UPDATE drivers SET verification_status = 'approved' WHERE email = 'your-email@example.com';
-- -- OR
-- UPDATE customers SET verification_status = 'approved' WHERE email = 'your-email@example.com';
-- 
-- 4. After updating, you can access admin.html with your account

INSERT INTO jobs (customer_name, customer_phone, pickup_address, pickup_location, dropoff_address, dropoff_location, job_type, description, price) VALUES
('Alice Johnson', '+27123456791', '123 Smith Street, Durban', ST_GeomFromText('POINT(30.8595 -29.8824)', 4326), '456 Brown Street, Durban', ST_GeomFromText('POINT(30.8695 -29.8924)', 4326), 'delivery', 'Food delivery from restaurant', 45.00),
('Bob Wilson', '+27123456792', '789 Green Avenue, Durban', ST_GeomFromText('POINT(30.8495 -29.8724)', 4326), '321 Blue Road, Durban', ST_GeomFromText('POINT(30.8795 -29.9024)', 4326), 'ride', 'Ride to airport', 180.00);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Apex Driver database schema created successfully!';
    RAISE NOTICE 'Tables created: drivers, customers, admins, jobs, job_tracking, driver_earnings, driver_reviews, verification_history';
    RAISE NOTICE 'Functions created: calculate_distance, nearby_jobs, nearby_drivers';
    RAISE NOTICE 'Verification system enabled with admin controls';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;

-- =====================================
-- OIL COLLECTION SYSTEM TABLES
-- =====================================

-- Oil collection jobs table
CREATE TABLE IF NOT EXISTS oil_collection_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    pickup_address TEXT NOT NULL,
    pickup_location GEOMETRY(POINT, 4326),
    job_type VARCHAR(50) DEFAULT 'oil_collection',
    description TEXT,
    estimated_oil_volume DECIMAL(8,2), -- Expected volume in litres
    payment_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'assigned', 'in_progress', 'collected', 'completed', 'cancelled'
    driver_id UUID REFERENCES drivers(id),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    special_instructions TEXT,
    equipment_requirements TEXT[],
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oil collection records table
CREATE TABLE IF NOT EXISTS oil_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES oil_collection_jobs(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    collection_date TIMESTAMPTZ DEFAULT NOW(),
    collected_volume DECIMAL(8,2) NOT NULL, -- Actual volume collected in litres
    unit VARCHAR(10) DEFAULT 'litres', -- Always litres for consistency
    oil_type VARCHAR(50), -- Type of oil collected
    oil_condition VARCHAR(50), -- Condition assessment
    collection_method VARCHAR(50), -- How it was collected
    collection_location GEOMETRY(POINT, 4326), -- GPS location where collection happened
    collection_address TEXT, -- Human readable address
    notes TEXT, -- Additional notes from driver
    payment_method VARCHAR(50), -- How payment was made
    payment_reference VARCHAR(100), -- Payment reference number
    quality_assessment TEXT, -- Assessment of oil quality
    environmental_conditions TEXT, -- Weather, accessibility notes
    equipment_used TEXT[], -- Equipment used for collection
    disposal_method VARCHAR(100), -- How oil will be disposed/recycled
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'pending_verification', 'verified'
    verified_by UUID REFERENCES admins(id), -- Admin who verified the collection
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oil collection photos table
CREATE TABLE IF NOT EXISTS oil_collection_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES oil_collections(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) NOT NULL, -- 'oil', 'payment'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT, -- Path to stored file
    file_url TEXT, -- URL if using cloud storage
    file_size INTEGER, -- File size in bytes
    mime_type VARCHAR(100), -- image/jpeg, image/png, etc.
    photo_data TEXT, -- Base64 encoded photo data (if storing in DB)
    caption TEXT, -- Optional caption/description
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    gps_location GEOMETRY(POINT, 4326), -- GPS coordinates where photo was taken
    sequence_number INTEGER DEFAULT 0, -- Order of photos
    is_primary BOOLEAN DEFAULT false, -- Is this the main photo for this type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oil collection tracking table for route optimization
CREATE TABLE IF NOT EXISTS oil_collection_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES oil_collection_jobs(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    location GEOMETRY(POINT, 4326),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    speed DECIMAL(5,2), -- km/h
    heading DECIMAL(5,2), -- degrees
    status VARCHAR(50), -- 'traveling_to_site', 'on_site', 'collecting', 'returning'
    activity_description TEXT -- What the driver is doing at this location
);

-- Oil collection earnings table
CREATE TABLE IF NOT EXISTS oil_collection_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id),
    job_id UUID REFERENCES oil_collection_jobs(id),
    collection_id UUID REFERENCES oil_collections(id),
    base_payment DECIMAL(10,2) NOT NULL, -- Base payment for the job
    volume_bonus DECIMAL(10,2) DEFAULT 0, -- Bonus based on volume collected
    quality_bonus DECIMAL(10,2) DEFAULT 0, -- Bonus for high quality oil
    efficiency_bonus DECIMAL(10,2) DEFAULT 0, -- Bonus for quick completion
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% commission for oil collection
    commission_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_date TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oil inventory tracking table
CREATE TABLE IF NOT EXISTS oil_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES oil_collections(id),
    oil_type VARCHAR(50) NOT NULL,
    volume DECIMAL(8,2) NOT NULL, -- Volume in litres
    quality_grade VARCHAR(20), -- A, B, C based on quality
    storage_location VARCHAR(100), -- Where the oil is stored
    storage_container_id VARCHAR(50), -- Container/tank identifier
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    disposed_at TIMESTAMPTZ,
    disposal_method VARCHAR(100),
    disposal_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'stored', -- 'stored', 'processing', 'disposed'
    batch_number VARCHAR(50), -- For tracking batches
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for oil collection tables
CREATE INDEX IF NOT EXISTS idx_oil_collection_jobs_status ON oil_collection_jobs(status);
CREATE INDEX IF NOT EXISTS idx_oil_collection_jobs_driver_id ON oil_collection_jobs(driver_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_jobs_location ON oil_collection_jobs USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_oil_collection_jobs_created_at ON oil_collection_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_oil_collections_job_id ON oil_collections(job_id);
CREATE INDEX IF NOT EXISTS idx_oil_collections_driver_id ON oil_collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_oil_collections_date ON oil_collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_oil_collections_status ON oil_collections(status);
CREATE INDEX IF NOT EXISTS idx_oil_collections_location ON oil_collections USING GIST(collection_location);

CREATE INDEX IF NOT EXISTS idx_oil_collection_photos_collection_id ON oil_collection_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_photos_type ON oil_collection_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_oil_collection_photos_taken_at ON oil_collection_photos(taken_at);

CREATE INDEX IF NOT EXISTS idx_oil_collection_tracking_job_id ON oil_collection_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_tracking_driver_id ON oil_collection_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_tracking_timestamp ON oil_collection_tracking(timestamp);

CREATE INDEX IF NOT EXISTS idx_oil_collection_earnings_driver_id ON oil_collection_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_earnings_job_id ON oil_collection_earnings(job_id);
CREATE INDEX IF NOT EXISTS idx_oil_collection_earnings_payment_status ON oil_collection_earnings(payment_status);

CREATE INDEX IF NOT EXISTS idx_oil_inventory_collection_id ON oil_inventory(collection_id);
CREATE INDEX IF NOT EXISTS idx_oil_inventory_status ON oil_inventory(status);
CREATE INDEX IF NOT EXISTS idx_oil_inventory_oil_type ON oil_inventory(oil_type);
CREATE INDEX IF NOT EXISTS idx_oil_inventory_received_at ON oil_inventory(received_at);

-- Apply updated_at triggers to oil collection tables
CREATE TRIGGER update_oil_collection_jobs_updated_at
    BEFORE UPDATE ON oil_collection_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_collections_updated_at
    BEFORE UPDATE ON oil_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_inventory_updated_at
    BEFORE UPDATE ON oil_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for oil collection tables
ALTER TABLE oil_collection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_collection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_collection_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_collection_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for oil collection tables
CREATE POLICY "Allow authenticated users full access to oil_collection_jobs" ON oil_collection_jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to oil_collections" ON oil_collections
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to oil_collection_photos" ON oil_collection_photos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to oil_collection_tracking" ON oil_collection_tracking
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to oil_collection_earnings" ON oil_collection_earnings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to oil_inventory" ON oil_inventory
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous users to read available oil collection jobs
CREATE POLICY "Allow anonymous users to read available oil collection jobs" ON oil_collection_jobs
    FOR SELECT TO anon USING (status = 'available');

-- Functions for oil collection system

-- Function to find nearby oil collection jobs
CREATE OR REPLACE FUNCTION nearby_oil_collection_jobs(lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 20.0)
RETURNS TABLE(
    id UUID,
    customer_name VARCHAR,
    pickup_address TEXT,
    job_type VARCHAR,
    estimated_oil_volume DECIMAL,
    payment_amount DECIMAL,
    distance_km FLOAT,
    priority VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.customer_name,
        j.pickup_address,
        j.job_type,
        j.estimated_oil_volume,
        j.payment_amount,
        ST_Distance(
            ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
            j.pickup_location::geography
        ) / 1000.0 as distance_km,
        j.priority,
        j.created_at
    FROM oil_collection_jobs j
    WHERE j.status = 'available'
    AND j.pickup_location IS NOT NULL
    AND ST_DWithin(
        ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
        j.pickup_location::geography,
        radius_km * 1000 -- Convert km to meters
    )
    ORDER BY 
        CASE j.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
        END,
        distance_km, 
        j.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate oil collection earnings
CREATE OR REPLACE FUNCTION calculate_oil_collection_earnings(
    job_id_param UUID,
    collected_volume DECIMAL,
    collection_time_minutes INTEGER DEFAULT NULL
)
RETURNS TABLE(
    base_payment DECIMAL,
    volume_bonus DECIMAL,
    efficiency_bonus DECIMAL,
    total_gross DECIMAL,
    commission_amount DECIMAL,
    net_amount DECIMAL
) AS $$
DECLARE
    job_payment DECIMAL;
    vol_bonus DECIMAL := 0;
    eff_bonus DECIMAL := 0;
    total_gross DECIMAL;
    commission_rate DECIMAL := 0.10; -- 10%
    commission DECIMAL;
    net DECIMAL;
BEGIN
    -- Get job payment
    SELECT payment_amount INTO job_payment 
    FROM oil_collection_jobs 
    WHERE id = job_id_param;
    
    -- Calculate volume bonus (R2 per litre over 50L)
    IF collected_volume > 50 THEN
        vol_bonus := (collected_volume - 50) * 2.00;
    END IF;
    
    -- Calculate efficiency bonus (based on completion time)
    IF collection_time_minutes IS NOT NULL AND collection_time_minutes < 60 THEN
        eff_bonus := job_payment * 0.15; -- 15% bonus for under 1 hour
    ELSIF collection_time_minutes IS NOT NULL AND collection_time_minutes < 90 THEN
        eff_bonus := job_payment * 0.10; -- 10% bonus for under 1.5 hours
    END IF;
    
    -- Calculate totals
    total_gross := COALESCE(job_payment, 0) + vol_bonus + eff_bonus;
    commission := total_gross * commission_rate;
    net := total_gross - commission;
    
    RETURN QUERY
    SELECT 
        COALESCE(job_payment, 0)::DECIMAL as base_payment,
        vol_bonus::DECIMAL as volume_bonus,
        eff_bonus::DECIMAL as efficiency_bonus,
        total_gross::DECIMAL as total_gross,
        commission::DECIMAL as commission_amount,
        net::DECIMAL as net_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to get driver oil collection statistics
CREATE OR REPLACE FUNCTION get_driver_oil_collection_stats(driver_id_param UUID)
RETURNS TABLE(
    total_collections INTEGER,
    total_volume DECIMAL,
    total_earnings DECIMAL,
    average_volume DECIMAL,
    average_earnings DECIMAL,
    this_month_collections INTEGER,
    this_month_volume DECIMAL,
    this_month_earnings DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.id)::INTEGER as total_collections,
        COALESCE(SUM(c.collected_volume), 0)::DECIMAL as total_volume,
        COALESCE(SUM(e.net_amount), 0)::DECIMAL as total_earnings,
        COALESCE(AVG(c.collected_volume), 0)::DECIMAL as average_volume,
        COALESCE(AVG(e.net_amount), 0)::DECIMAL as average_earnings,
        COUNT(CASE WHEN c.collection_date >= date_trunc('month', NOW()) THEN 1 END)::INTEGER as this_month_collections,
        COALESCE(SUM(CASE WHEN c.collection_date >= date_trunc('month', NOW()) THEN c.collected_volume ELSE 0 END), 0)::DECIMAL as this_month_volume,
        COALESCE(SUM(CASE WHEN c.collection_date >= date_trunc('month', NOW()) THEN e.net_amount ELSE 0 END), 0)::DECIMAL as this_month_earnings
    FROM oil_collections c
    LEFT JOIN oil_collection_earnings e ON c.id = e.collection_id
    WHERE c.driver_id = driver_id_param;
END;
$$ LANGUAGE plpgsql;

-- Sample oil collection data
INSERT INTO oil_collection_jobs (customer_name, customer_phone, customer_email, pickup_address, pickup_location, description, estimated_oil_volume, payment_amount, priority, special_instructions) VALUES
('Green Restaurant', '+27123456793', 'manager@greenrestaurant.co.za', '45 Beach Road, Durban', ST_GeomFromText('POINT(30.8595 -29.8824)', 4326), 'Weekly cooking oil collection from restaurant', 80.0, 200.00, 'normal', 'Collection from back entrance only'),
('City Auto Workshop', '+27123456794', 'info@cityauto.co.za', '123 Workshop Street, Durban', ST_GeomFromText('POINT(30.8695 -29.8924)', 4326), 'Used motor oil collection', 150.0, 350.00, 'high', 'Heavy containers, bring lifting equipment'),
('Home Collection - Smith', '+27123456795', 'john.smith@email.com', '67 Suburb Lane, Durban', ST_GeomFromText('POINT(30.8495 -29.8724)', 4326), 'Household cooking oil disposal', 25.0, 80.00, 'low', 'Residential area, ring doorbell');

-- Print oil collection schema success message
DO $$
BEGIN
    RAISE NOTICE '=== OIL COLLECTION SYSTEM SCHEMA ADDED ===';
    RAISE NOTICE 'Oil collection tables created: oil_collection_jobs, oil_collections, oil_collection_photos, oil_collection_tracking, oil_collection_earnings, oil_inventory';
    RAISE NOTICE 'Oil collection functions created: nearby_oil_collection_jobs, calculate_oil_collection_earnings, get_driver_oil_collection_stats';
    RAISE NOTICE 'Sample oil collection jobs inserted for testing';
    RAISE NOTICE 'Oil collection system ready for use!';
END $$;