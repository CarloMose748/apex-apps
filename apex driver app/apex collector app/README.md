# Apex Collector App

A comprehensive delivery and logistics platform connecting drivers with customers for efficient package delivery and collection services. Built with Supabase for real-time data management and authentication.

## 🚀 Features

- **User Authentication**: Secure signup/login with email verification and OAuth (Google)
- **Admin Verification System**: Admin dashboard for verifying user accounts before platform access
- **Role-Based Access**: Separate interfaces for drivers and customers
- **Real-Time Job Management**: Live job updates and status tracking
- **Location Services**: GPS-based job matching and navigation
- **Driver Dashboard**: Complete driver management with earnings tracking
- **Customer Platform**: Job posting and tracking capabilities
- **Admin Dashboard**: Comprehensive admin panel for user verification and management
- **Verification Pending Page**: User-friendly interface for pending account status
- **Test Suite**: Comprehensive testing interface for development
- **Responsive Design**: Mobile-first design that works on all devices

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with JWT
- **Database**: PostgreSQL with PostGIS extension
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file uploads

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Run the contents of `database/schema.sql` to create all necessary tables and functions
4. The schema includes:
   - `drivers` - Driver profiles and information
   - `jobs` - Available and assigned jobs
   - `job_tracking` - Real-time location tracking during jobs
   - `driver_earnings` - Payment and earnings tracking
   - `driver_reviews` - Customer reviews and ratings

### 2. Project Structure

```
apex-driver-app/
├── .env                          # Environment variables (DO NOT commit to git)
├── js/
│   ├── supabase-config.js       # Supabase client configuration
│   ├── apex-driver-service.js   # Business logic for Apex Driver app
│   └── app.js                   # Sample implementation and utilities
├── database/
│   └── schema.sql               # Database schema and sample data
├── index.html                   # Landing page (redirects to main.html)
├── main.html                    # Main welcome page
├── jobs.html                    # Available jobs listing
├── job-detail.html              # Individual job details
├── map.html                     # Map view for jobs
└── styles/
    └── global.css               # Existing styles
```

### 3. Configuration

The Supabase configuration is already set up with your credentials:

- **Supabase URL**: `https://ishhgfitddfeqaatimwl.supabase.co`
- **Anon Key**: Used for client-side operations
- **Service Role Key**: For admin operations (keep secure)

### 4. Features Available

#### Database Operations
- **Driver Management**: Register drivers, update locations, manage status
- **Job Management**: Create, assign, update job status
- **Real-time Updates**: Live job notifications and status changes
- **Location-based Queries**: Find nearby jobs and drivers
- **Analytics**: Driver stats and earnings tracking

#### Authentication
- User signup and login
- Session management
- Row-level security policies

#### Real-time Features
- Live job updates
- Driver location tracking
- Job status notifications

### 5. Usage Examples

#### Load Available Jobs
```javascript
// Wait for Supabase to be ready
document.addEventListener('supabaseReady', async function() {
    const { data, error } = await ApexDriverService.getAvailableJobs();
    if (!error) {
        console.log('Available jobs:', data);
        // Display jobs in your UI
    }
});
```

#### Register a New Driver
```javascript
const driverData = {
    email: 'driver@example.com',
    fullName: 'John Doe',
    phoneNumber: '+27123456789',
    vehicleType: 'car',
    licenseNumber: 'ABC123456',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleYear: 2020,
    vehiclePlate: 'CA123GP'
};

const { data, error } = await ApexDriverService.registerDriver(driverData);
```

#### Assign a Job to Driver
```javascript
const jobId = 'job-uuid';
const driverId = 'driver-uuid';

const { data, error } = await ApexDriverService.assignJobToDriver(jobId, driverId);
```

#### Subscribe to Real-time Job Updates
```javascript
const subscription = ApexDriverService.subscribeToAvailableJobs((payload) => {
    console.log('New job:', payload.new);
    // Update UI with new job
});
```

### 6. Security Notes

1. **Environment Variables**: The `.env` file contains sensitive credentials. Never commit it to version control.

2. **Row Level Security**: The database has RLS policies enabled. Customize them based on your authentication needs.

3. **API Keys**: 
   - Use the **anon key** for client-side operations
   - Keep the **service role key** secure and use only for admin operations

### 7. Development Workflow

1. **Testing**: Use the sample data created by the schema to test functionality
2. **Location Testing**: The sample jobs are located in Durban area for testing location-based features
3. **Real-time Testing**: Open multiple browser tabs to test real-time updates

### 8. Next Steps

1. **Authentication**: Implement user login/signup in your UI
2. **Driver Registration**: Create a driver registration form
3. **Job Creation**: Add functionality for customers to create new jobs
4. **Payment Integration**: Connect to payment providers for job payments
5. **Maps Integration**: Use the location data with mapping services
6. **Push Notifications**: Implement push notifications for better user experience

### 9. File Integration

All HTML files now include:
```html
<!-- Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Configuration -->
<script src="js/supabase-config.js"></script>
<script src="js/apex-driver-service.js"></script>
```

### 10. Troubleshooting

- **Console Errors**: Check browser console for Supabase connection issues
- **Network Issues**: Ensure Supabase URL is accessible
- **Database Issues**: Verify schema was created successfully in Supabase SQL Editor
- **Location Issues**: Test with HTTPS (required for geolocation API)

## 🔐 Admin Verification System

### Admin Setup
1. **Create Admin Account**: Add admin users to the `admins` table in your database:
   ```sql
   INSERT INTO admins (email, full_name, role, permissions) VALUES
   ('admin@yourcompany.com', 'Admin User', 'super_admin', ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins']);
   ```

2. **Access Admin Dashboard**: Navigate to `admin.html` after signing in with an admin account

### User Verification Flow
1. **User Registration**: New users sign up and are automatically set to `pending` verification status
2. **Verification Pending**: Users are redirected to `verification-pending.html` until verified
3. **Admin Review**: Admins can approve/reject users from the admin dashboard
4. **Platform Access**: Only verified users can access the main platform features

### Admin Features
- **Dashboard**: View verification statistics and pending users
- **User Management**: Search, filter, and manage users by verification status
- **Bulk Actions**: Approve or reject multiple users at once
- **Verification History**: Track all verification actions with audit trail
- **User Details**: View complete user profiles and registration information

### User States
- **Pending**: New users awaiting admin verification (default)
- **Under Review**: Users being actively reviewed by admins
- **Approved**: Verified users with full platform access
- **Rejected**: Users whose verification was declined

## 👥 User Roles

### Drivers
- Register with vehicle information
- **Must be verified by admin before platform access**
- View and accept available jobs
- Track earnings and performance
- Update availability status
- Navigate to pickup/delivery locations

### Customers
- Post delivery/collection jobs
- **Must be verified by admin before platform access**
- Track job status in real-time
- Rate and review drivers
- Manage payment methods
- View job history

### Admins
- **Full platform oversight and user management**
- Verify driver and customer accounts
- View platform statistics and analytics
- Manage user verification status
- Access comprehensive admin dashboard
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostGIS Documentation](https://postgis.net/docs/) for location queries