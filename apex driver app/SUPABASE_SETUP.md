# Supabase Database Setup Guide

This guide will help you set up your Apex Driver App database with live data on Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Upload the Database Schema

### Option A: Using the Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Upload the main schema**
   - Copy the entire contents of `database/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the schema

4. **Upload the sample data**
   - Create another new query
   - Copy the entire contents of `database/sample_jobs_data.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute and populate with sample data

### Option B: Using the Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Run the migrations**
   ```bash
   supabase db push
   ```

## Step 2: Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but you may want to customize them:

1. **For Development/Testing** (Current setup)
   - All authenticated users have full access
   - Anonymous users can read available jobs
   - Anonymous users can create driver/customer accounts

2. **For Production** (Recommended changes)
   - Drivers can only update their own records
   - Customers can only see their own jobs
   - Only admins can verify users

## Step 3: Verify the Setup

1. **Check Tables**
   - Go to "Table Editor" in your Supabase dashboard
   - You should see these tables:
     - `drivers`
     - `customers` 
     - `admins`
     - `jobs`
     - `oil_collection_jobs`
     - `job_tracking`
     - `driver_earnings`
     - `verification_history`

2. **Check Sample Data**
   - Click on the `jobs` table
   - You should see 7 available jobs with different types
   - Click on `oil_collection_jobs` to see 3 oil collection jobs

3. **Test the Functions**
   - Go to SQL Editor
   - Run this test query:
   ```sql
   SELECT * FROM nearby_jobs(-29.8587, 31.0218, 10.0);
   ```
   - You should see jobs sorted by distance

## Step 4: Update Your Frontend Configuration

1. **Update Supabase Config**
   - Make sure your `js/supabase-config.js` has the correct:
     - Project URL
     - Anonymous public key

2. **Test the Connection**
   - Open your `jobs.html` page
   - Check the browser console for any errors
   - Jobs should now load from your database instead of mock data

## Step 5: Create Your Admin Account

1. **Sign up through your app**
   - Go to `auth.html`
   - Create an account with your email

2. **Make yourself an admin**
   - Go to SQL Editor in Supabase
   - Run this query (replace with your email):
   ```sql
   INSERT INTO admins (email, full_name, role, permissions) 
   VALUES ('your-email@example.com', 'Your Name', 'super_admin', 
           ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins']);
   ```

3. **Update verification status**
   - If you created a driver account:
   ```sql
   UPDATE drivers SET verification_status = 'approved' 
   WHERE email = 'your-email@example.com';
   ```

## Database Schema Overview

### Core Tables

- **drivers**: Driver profiles, vehicle info, verification status
- **customers**: Customer profiles and verification
- **admins**: Admin users with role-based permissions
- **jobs**: Regular delivery/ride jobs
- **oil_collection_jobs**: Specialized oil collection jobs

### Tracking Tables

- **job_tracking**: Real-time location tracking during jobs
- **driver_earnings**: Payment tracking and commission calculation
- **verification_history**: Audit trail for all verification actions

### Key Features

- **PostGIS Integration**: Accurate distance calculations and location-based queries
- **Real-time Subscriptions**: Live updates for job status changes
- **Comprehensive Analytics**: Driver stats, earnings tracking
- **Verification System**: Admin controls for user approval
- **Oil Collection System**: Specialized workflow for oil collection jobs

## Testing Your Setup

1. **Load the jobs page** (`jobs.html`)
2. **Check for live data** - You should see the sample jobs from the database
3. **Test location-based sorting** - Allow location access and verify jobs are sorted by distance
4. **Check job details** - Click on jobs to see they load properly

## Troubleshooting

### Common Issues

1. **"Supabase not ready" error**
   - Ensure `supabase-config.js` loads before other scripts
   - Check your Supabase URL and key are correct

2. **No jobs loading**
   - Check the browser console for errors
   - Verify the `jobs` table has data
   - Check RLS policies aren't blocking access

3. **Location errors**
   - PostGIS requires coordinates in `POINT(lng lat)` format
   - Ensure coordinates are valid numbers

4. **Function errors**
   - Make sure PostGIS extension is enabled
   - Check function syntax in SQL Editor

### Need Help?

1. Check Supabase logs in the dashboard
2. Use browser developer tools to debug
3. Test SQL queries directly in Supabase SQL Editor

## Next Steps

1. **Customize the data** - Add your own jobs and locations
2. **Set up authentication** - Configure proper user roles
3. **Add real-time features** - Use the subscription methods
4. **Implement analytics** - Use the built-in stats functions
5. **Production setup** - Tighten RLS policies for security

Your database is now ready for live data! The jobs page will automatically use the database instead of mock data.