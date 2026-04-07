-- Create demo customer auth user in Supabase
-- Run this in your Supabase SQL Editor to create a test user

-- Insert auth user (Supabase will hash the password)
-- Password: Demo123!
-- This creates the user in the auth.users table

-- Note: You may need to create this user through the Supabase Dashboard instead:
-- 1. Go to Authentication > Users
-- 2. Click "Add User" or "Invite User"
-- 3. Email: demo@customer.com
-- 4. Password: Demo123!
-- 5. Confirm the user

-- Alternatively, use the SQL below if your Supabase allows direct auth.users inserts:

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'demo@customer.com',
    crypt('Demo123!', gen_salt('bf')),  -- Password: Demo123!
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
)
ON CONFLICT (email) DO NOTHING;
