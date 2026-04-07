-- =====================================================
-- CREATE USER_ROLES TABLE
-- =====================================================
-- This table is required for multi-platform RBAC (Role-Based Access Control)
-- It tracks which users have access to which platforms (admin, driver, customer, aggregator)

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users(id)
    email TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'admin', 'driver', 'customer', 'aggregator'
    platform_role TEXT NOT NULL, -- e.g., 'super_admin', 'driver', 'customer', 'depot_manager'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'suspended', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one role per user per platform
    CONSTRAINT unique_user_platform UNIQUE (user_id, platform),
    
    -- Valid platforms
    CONSTRAINT valid_platform CHECK (
        platform IN ('admin', 'driver', 'customer', 'aggregator')
    ),
    
    -- Valid statuses
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_platform ON user_roles(platform);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON user_roles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_platform ON user_roles(user_id, platform);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table

-- Allow authenticated users to read their own roles
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
CREATE POLICY "Users can read own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow super admins to manage all user roles
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON user_roles;
CREATE POLICY "Super admins can manage all user roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND status = 'active'
        )
    );

-- Allow users to insert their own roles during signup
DROP POLICY IF EXISTS "Users can insert own roles" ON user_roles;
CREATE POLICY "Users can insert own roles"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE user_roles IS 'Multi-platform role management for users across admin, driver, customer, and aggregator platforms';
COMMENT ON COLUMN user_roles.user_id IS 'UUID matches auth.users.id from Supabase Auth';
COMMENT ON COLUMN user_roles.platform IS 'Platform type: admin, driver, customer, aggregator';
COMMENT ON COLUMN user_roles.platform_role IS 'Role within the platform (e.g., super_admin, driver, customer)';
COMMENT ON COLUMN user_roles.status IS 'Account status: pending, active, inactive, suspended, rejected';

-- =====================================================
-- INSERT SUPER ADMIN ROLE
-- =====================================================
-- IMPORTANT: Replace 'YOUR-USER-UUID-HERE' with the actual UUID from Supabase Authentication > Users

INSERT INTO user_roles (user_id, email, platform, platform_role, status, created_at, updated_at)
VALUES (
    'YOUR-USER-UUID-HERE', -- REPLACE THIS!
    'sheldenr3@gmail.com',
    'admin',
    'super_admin',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (user_id, platform) 
DO UPDATE SET 
    platform_role = 'super_admin',
    status = 'active',
    updated_at = NOW();

-- =====================================================
-- VERIFY TABLE CREATION
-- =====================================================
-- Run this query to verify the table was created successfully:
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

-- Verify your admin role was inserted:
SELECT * FROM user_roles WHERE email = 'sheldenr3@gmail.com' AND platform = 'admin';
