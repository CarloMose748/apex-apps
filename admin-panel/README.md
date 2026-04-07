# Admin Dashboard Module - Portable Package

This folder contains a complete, self-contained admin dashboard module that can be integrated into any project.

## 📦 Contents

- `admin.html` - Main admin dashboard page with all UI components
- `admin-service.js` - Core admin functionality (user verification, bin management)
- `auth-service.js` - Authentication and session management
- `supabase-config.js` - Supabase client configuration
- `hamburger-menu.js` - Navigation menu component
- `global.css` - Styling for the entire admin interface

## 🚀 Quick Setup

### 1. Copy Files to Your Project

Copy all files from this folder into your target project directory.

### 2. Update Supabase Configuration

Edit `supabase-config.js` and replace with your Supabase credentials:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_PROJECT_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

### 3. Database Setup

Your Supabase database needs these tables:

#### Required Tables:

**admins**
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- role (text) - e.g., 'super_admin', 'moderator'
- permissions (text array)
- status (text) - 'active' or 'inactive'
- last_login (timestamp)
- created_at (timestamp)

**drivers**
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- phone_number (text)
- vehicle_type (text)
- vehicle_make (text)
- vehicle_model (text)
- vehicle_year (text)
- vehicle_plate (text)
- verification_status (text) - 'pending', 'approved', 'rejected', 'under_review'
- verification_notes (text)
- verified_by (text)
- verified_at (timestamp)
- created_at (timestamp)

**customers**
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- phone_number (text)
- address (text)
- verification_status (text) - 'pending', 'approved', 'rejected', 'under_review'
- verification_notes (text)
- verified_by (text)
- verified_at (timestamp)
- created_at (timestamp)

**bins**
- id (uuid, primary key)
- customer_id (uuid, foreign key → customers.id)
- bin_serial_number (text, unique)
- bin_type (text) - 'standard', 'large', 'small', 'commercial'
- bin_size_liters (integer)
- bin_status (text) - 'active', 'inactive', 'maintenance'
- assigned_by (text)
- assigned_date (timestamp)
- collection_frequency (text) - 'daily', 'weekly', 'bi-weekly', 'monthly'
- next_scheduled_collection (timestamp)
- last_collection_date (timestamp)
- location_notes (text)
- special_instructions (text)
- created_at (timestamp)

**verification_history** (optional but recommended)
- id (uuid, primary key)
- user_id (uuid)
- user_type (text) - 'driver' or 'customer'
- admin_email (text)
- action (text)
- old_status (text)
- new_status (text)
- notes (text)
- created_at (timestamp)

### 4. Configure Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Example policy for admins table
CREATE POLICY "Admins can view all admin records"
ON admins FOR SELECT
USING (auth.role() = 'authenticated');

-- Create similar policies for other tables based on your security requirements
```

### 5. Add Your First Admin

Insert a record in the `admins` table with your email:

```sql
INSERT INTO admins (email, full_name, role, permissions, status)
VALUES (
    'your-email@example.com',
    'Your Name',
    'super_admin',
    ARRAY['verify_users', 'manage_jobs', 'view_analytics', 'manage_admins'],
    'active'
);
```

## 🎯 Features

### User Management
- ✅ View pending driver and customer verifications
- ✅ Approve or reject user registrations
- ✅ Search and filter users by status
- ✅ View detailed user profiles
- ✅ Track verification history

### Bin Management
- ✅ Assign bins to customers with QR code generation
- ✅ View all bins with customer information
- ✅ Download QR codes as PNG for printing
- ✅ Set collection frequency and schedule
- ✅ Add location notes and special instructions
- ✅ Remove bin assignments

### Dashboard
- ✅ Real-time statistics
- ✅ Pending verifications count
- ✅ Driver and customer breakdowns
- ✅ Quick action buttons

## 🔧 Integration Notes

### Navigation Links

The admin dashboard references these pages in the navigation:
- `main.html` - Your main application page
- `test.html` - Test suite page (optional)

Update these in `admin.html` if your project uses different filenames:

```javascript
// Find and update these lines in admin.html:
onclick="window.location.href='main.html'"  // Change to your main page
onclick="window.location.href='test.html'"  // Change or remove
```

### Hamburger Menu

If you don't need the hamburger menu component, you can remove:
1. The `<div id="hamburger-menu"></div>` from `admin.html`
2. The `<script src="hamburger-menu.js"></script>` line
3. Delete `hamburger-menu.js` file

### Customization

**Colors and Branding:**
Edit `global.css` to match your brand:
```css
:root {
    --primary-color: #00d174;  /* Your brand color */
    --primary-dark: #00a85d;
    --text-primary: #2c3e50;
    /* ... other variables ... */
}
```

**Icons:**
The dashboard uses Font Awesome 6.5.0 via CDN. Icons can be changed by editing the class names in `admin.html`.

## 📱 Responsive Design

The admin dashboard is fully responsive and works on:
- Desktop (optimized for 1200px+ screens)
- Tablet (768px - 1200px)
- Mobile (320px+)

## 🔒 Security Considerations

1. **Admin Authentication:** The page checks for admin status on load
2. **Row Level Security:** Ensure RLS policies are enabled in Supabase
3. **API Keys:** The `anonKey` in `supabase-config.js` is safe for client-side use
4. **HTTPS:** Always serve admin pages over HTTPS in production

## 🐛 Troubleshooting

### "Admin access denied" error
- Verify your email exists in the `admins` table with `status = 'active'`
- Check browser console for specific error messages

### QR codes not generating
- Check browser console for CDN loading errors
- Verify network allows loading from jsdelivr.net, unpkg.com, or cdnjs.com

### Stats showing "Cannot read properties of undefined"
- Ensure all database tables exist
- Check Supabase client is initialized (look for "Supabase client ready" in console)

## 📞 Support

For integration issues:
1. Check browser console for errors
2. Verify Supabase configuration
3. Ensure all database tables are created
4. Check RLS policies allow appropriate access

## 📄 License

This module is part of the Apex Driver App project.

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Dependencies:** Supabase JS v2, Font Awesome 6.5.0, QRCode.js 1.5.3
