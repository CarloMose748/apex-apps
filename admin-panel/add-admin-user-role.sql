-- Add sheldenr3@gmail.com to user_roles table for admin platform access
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find sheldenr3@gmail.com and copy the UUID (Example: f49f2c22-b115-4e20-ad1f-b8af6fef87d2)
-- 3. Replace 'YOUR-USER-UUID-HERE' below with that UUID
-- 4. Run this script in Supabase SQL Editor

-- Insert admin platform role for sheldenr3@gmail.com
INSERT INTO user_roles (user_id, email, platform, platform_role, status, created_at, updated_at)
VALUES (
    'YOUR-USER-UUID-HERE',  -- ⚠️ REPLACE WITH ACTUAL UUID FROM SUPABASE AUTH
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

-- Also ensure the admins table record exists
INSERT INTO admins (id, email, full_name, role, permissions, status, created_at, updated_at)
VALUES (
    'YOUR-USER-UUID-HERE',  -- ⚠️ SAME UUID AS ABOVE
    'sheldenr3@gmail.com',
    'Super Admin',
    'super_admin',
    ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    permissions = ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
    updated_at = NOW();

-- Verify the records were created successfully
SELECT 'user_roles table' as source, user_id, email, platform, platform_role, status 
FROM user_roles 
WHERE email = 'sheldenr3@gmail.com' AND platform = 'admin'
UNION ALL
SELECT 'admins table' as source, id::text, email, role, role, status 
FROM admins 
WHERE email = 'sheldenr3@gmail.com';
