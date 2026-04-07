-- =====================================================
-- ADMIN DASHBOARD - DATABASE SCHEMA
-- =====================================================
-- This file contains all table definitions needed for
-- the admin dashboard to function properly.
-- =====================================================

-- ================== ADMINS TABLE ==================
-- Stores admin users who can access the dashboard
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'moderator', -- 'super_admin', 'moderator', 'viewer'
    permissions TEXT[] DEFAULT ARRAY['verify_users'], -- Array of permission strings
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

-- ================== DRIVERS TABLE ==================
-- Stores driver information for verification
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    vehicle_type TEXT, -- 'truck', 'van', 'car', etc.
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year TEXT,
    vehicle_plate TEXT,
    license_number TEXT,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
    verification_notes TEXT,
    verified_by TEXT, -- Admin email who verified
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at DESC);

-- ================== CUSTOMERS TABLE ==================
-- Stores customer information for verification
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
    verification_notes TEXT,
    verified_by TEXT, -- Admin email who verified
    verified_at TIMESTAMPTZ,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_verification_status ON customers(verification_status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- ================== BINS TABLE ==================
-- Stores bin assignments and tracking information
CREATE TABLE IF NOT EXISTS bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bin_serial_number TEXT UNIQUE NOT NULL,
    bin_type TEXT DEFAULT 'standard', -- 'standard', 'large', 'small', 'commercial'
    bin_size_liters INTEGER DEFAULT 120,
    bin_status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'damaged'
    assigned_by TEXT NOT NULL, -- Admin email who assigned
    assigned_date TIMESTAMPTZ DEFAULT now(),
    collection_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'bi-weekly', 'monthly'
    next_scheduled_collection TIMESTAMPTZ,
    last_collection_date TIMESTAMPTZ,
    location_notes TEXT, -- e.g., "Front gate", "Behind garage"
    special_instructions TEXT, -- e.g., "Ring buzzer for access"
    qr_code_url TEXT, -- Optional: if storing QR images
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bins_customer_id ON bins(customer_id);
CREATE INDEX IF NOT EXISTS idx_bins_serial_number ON bins(bin_serial_number);
CREATE INDEX IF NOT EXISTS idx_bins_status ON bins(bin_status);
CREATE INDEX IF NOT EXISTS idx_bins_next_collection ON bins(next_scheduled_collection);

-- ================== VERIFICATION HISTORY TABLE ==================
-- Tracks all verification actions for audit purposes
CREATE TABLE IF NOT EXISTS verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL, -- 'driver' or 'customer'
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'approved', 'rejected', 'status_changed'
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_verification_history_user_id ON verification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_admin_email ON verification_history(admin_email);
CREATE INDEX IF NOT EXISTS idx_verification_history_created_at ON verification_history(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables for security

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

-- ================== ADMINS POLICIES ==================
-- Allow authenticated users to read admin records (for admin check)
CREATE POLICY "Allow authenticated users to read admins"
ON admins FOR SELECT
TO authenticated
USING (true);

-- Only super admins can modify admin records
CREATE POLICY "Only super admins can modify admins"
ON admins FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND role = 'super_admin'
        AND status = 'active'
    )
);

-- ================== DRIVERS POLICIES ==================
-- Admins can view all drivers
CREATE POLICY "Admins can view all drivers"
ON drivers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- Admins can update driver records
CREATE POLICY "Admins can update drivers"
ON drivers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
        AND 'verify_users' = ANY(permissions)
    )
);

-- ================== CUSTOMERS POLICIES ==================
-- Admins can view all customers
CREATE POLICY "Admins can view all customers"
ON customers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- Admins can update customer records
CREATE POLICY "Admins can update customers"
ON customers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
        AND 'verify_users' = ANY(permissions)
    )
);

-- ================== BINS POLICIES ==================
-- Admins can view all bins
CREATE POLICY "Admins can view all bins"
ON bins FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- Admins can manage bins
CREATE POLICY "Admins can manage bins"
ON bins FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- ================== VERIFICATION HISTORY POLICIES ==================
-- Admins can view all verification history
CREATE POLICY "Admins can view verification history"
ON verification_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- Admins can insert verification history
CREATE POLICY "Admins can insert verification history"
ON verification_history FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.jwt()->>'email'
        AND status = 'active'
    )
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update timestamps
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bins_updated_at ON bins;
CREATE TRIGGER update_bins_updated_at
    BEFORE UPDATE ON bins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert a default super admin (CHANGE THIS EMAIL!)
-- INSERT INTO admins (email, full_name, role, permissions, status)
-- VALUES (
--     'your-admin-email@example.com',
--     'System Administrator',
--     'super_admin',
--     ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
--     'active'
-- );

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- Run this query to verify all tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('admins', 'drivers', 'customers', 'bins', 'verification_history');
