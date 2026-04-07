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

-- Available Jobs table for the driver app
CREATE TABLE IF NOT EXISTS available_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    pickup_address TEXT NOT NULL,
    pickup_location GEOMETRY(POINT, 4326),
    dropoff_address TEXT,
    dropoff_location GEOMETRY(POINT, 4326),
    job_type VARCHAR(50) DEFAULT 'Food Delivery', -- 'Food Delivery', 'Grocery Delivery', 'Pharmacy Delivery', 'Document Delivery', 'Package Delivery'
    description TEXT,
    payment VARCHAR(20) NOT NULL, -- e.g., 'R85', 'R120'
    estimated_time VARCHAR(20) DEFAULT '30 min', -- e.g., '25 min', '35 min'
    priority BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for available_jobs updated_at
CREATE TRIGGER update_available_jobs_updated_at
    BEFORE UPDATE ON available_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policy for available_jobs
ALTER TABLE available_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read available jobs
CREATE POLICY "Allow anonymous users to read available_jobs" ON available_jobs
    FOR SELECT TO anon USING (true);

-- Allow authenticated users full access to available_jobs
CREATE POLICY "Allow authenticated users full access to available_jobs" ON available_jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert sample available jobs
INSERT INTO available_jobs (customer_name, customer_phone, pickup_address, pickup_location, dropoff_address, dropoff_location, job_type, description, payment, estimated_time, priority) VALUES
('Restaurant Customer', '+27123456789', '380 Anton Lembede St, Durban Central, Durban', ST_GeomFromText('POINT(31.0218 -29.8587)', 4326), '123 Customer Street, Durban', ST_GeomFromText('POINT(31.0318 -29.8687)', 4326), 'Food Delivery', 'KFC Delivery', 'R85', '25 min', false),
('Mall Customer', '+27123456790', 'Gateway Theatre of Shopping, Umhlanga', ST_GeomFromText('POINT(31.0621 -29.7282)', 4326), '456 Home Ave, Umhlanga', ST_GeomFromText('POINT(31.0721 -29.7382)', 4326), 'Food Delivery', 'McDonald''s Pickup', 'R120', '35 min', true),
('Grocery Customer', '+27123456791', '115 Musgrave Rd, Berea, Durban', ST_GeomFromText('POINT(30.9967 -29.8386)', 4326), '789 House Rd, Berea', ST_GeomFromText('POINT(31.0067 -29.8486)', 4326), 'Grocery Delivery', 'Pick n Pay Grocery Delivery', 'R95', '20 min', false),
('Delivery Customer', '+27123456792', '1 Chartwell Dr, Umhlanga', ST_GeomFromText('POINT(31.0421 -29.7192)', 4326), '321 Destination St, Umhlanga', ST_GeomFromText('POINT(31.0521 -29.7292)', 4326), 'Food Delivery', 'Steers via Uber Eats', 'R110', '40 min', false),
('Pharmacy Customer', '+27123456793', 'Pavilion Shopping Centre, Westville', ST_GeomFromText('POINT(30.9285 -29.8276)', 4326), '654 Medicine Ave, Westville', ST_GeomFromText('POINT(30.9385 -29.8376)', 4326), 'Pharmacy Delivery', 'Clicks Pharmacy Run', 'R75', '30 min', false),
('Business Customer', '+27123456794', '45 Sydney Rd, Durban CBD', ST_GeomFromText('POINT(31.0219 -29.8642)', 4326), '987 Office Park, Durban', ST_GeomFromText('POINT(31.0319 -29.8742)', 4326), 'Document Delivery', 'Important Document Delivery', 'R60', '15 min', false);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Apex Driver database schema created successfully!';
    RAISE NOTICE 'Tables created: drivers, customers, admins, jobs, job_tracking, driver_earnings, driver_reviews, verification_history, available_jobs';
    RAISE NOTICE 'Functions created: calculate_distance, nearby_jobs, nearby_drivers';
    RAISE NOTICE 'Verification system enabled with admin controls';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Available jobs table created with sample delivery jobs';
END $$;