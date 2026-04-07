-- Fix Super Admin Access for sheldenr3@gmail.com
-- This script ensures the user has both admins and user_roles records

-- First, let's check if the user exists in Supabase Auth and get their ID
-- You need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find sheldenr3@gmail.com and copy the UUID
-- 3. Replace 'YOUR-USER-UUID-HERE' below with that actual UUID

-- Replace this with the actual UUID from Supabase Auth
-- Example: '12345678-1234-1234-1234-123456789abc'
DO $$
DECLARE
    user_uuid UUID := 'YOUR-USER-UUID-HERE'; -- REPLACE THIS!
    user_email TEXT := 'sheldenr3@gmail.com';
    user_name TEXT := 'Super Admin';
BEGIN
    -- Insert or update admins record
    INSERT INTO admins (id, email, full_name, role, permissions, status, created_at, updated_at)
    VALUES (
        user_uuid,
        user_email,
        user_name,
        'super_admin',
        ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        role = 'super_admin',
        permissions = ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
        status = 'active',
        updated_at = NOW();

    -- Insert or update user_roles record for admin platform
    INSERT INTO user_roles (user_id, email, platform, platform_role, status, created_at, updated_at)
    VALUES (
        user_uuid,
        LOWER(user_email),
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

    RAISE NOTICE 'Successfully configured super admin access for %', user_email;
END $$;

-- Verify the records were created
SELECT 'admins table:' as table_name, id, email, role, status FROM admins WHERE email = 'sheldenr3@gmail.com'
UNION ALL
SELECT 'user_roles table:' as table_name, user_id, email, platform || ' - ' || platform_role, status FROM user_roles WHERE email = 'sheldenr3@gmail.com' AND platform = 'admin';
