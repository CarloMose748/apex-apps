# Quick Integration Guide

## 5-Minute Setup

### Step 1: Copy Files (1 min)
Copy all files from this `admin-new` folder to your project.

### Step 2: Setup Database (2 min)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Click "Run" to create all tables and policies

### Step 3: Configure Supabase (1 min)
Edit `supabase-config.js`:
```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_PROJECT_URL',      // From Supabase Settings → API
    anonKey: 'YOUR_ANON_KEY'      // From Supabase Settings → API
};
```

### Step 4: Add Your Admin Account (1 min)
Run this SQL query (replace with your email):
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

### Step 5: Test
Open `admin.html` in your browser and login with the admin email you created.

## File Structure in Your Project

```
your-project/
├── admin.html              ← Main admin dashboard
├── admin-service.js        ← Admin functionality
├── auth-service.js         ← Authentication
├── supabase-config.js      ← ⚠️ Update this with your credentials
├── hamburger-menu.js       ← Navigation menu
├── global.css              ← Styling
├── database-schema.sql     ← Run this in Supabase
└── README.md               ← Full documentation
```

## Common Customizations

### Change Navigation Links
In `admin.html`, find these lines and update:
```javascript
// Line ~587
onclick="window.location.href='main.html'"    // Your main app
onclick="window.location.href='test.html'"    // Your test page
```

### Change Brand Color
In `global.css`, line 1-2:
```css
:root {
    --primary-color: #00d174;  /* Change to your brand color */
}
```

### Remove Hamburger Menu
If you don't need it:
1. Delete line in `admin.html`: `<div id="hamburger-menu"></div>`
2. Delete line in `admin.html`: `<script src="hamburger-menu.js"></script>`
3. Delete file: `hamburger-menu.js`

## Troubleshooting

**Can't login to admin dashboard?**
→ Check if your email exists in the `admins` table with `status = 'active'`

**Stats showing errors?**
→ Make sure all tables from `database-schema.sql` are created

**QR codes not generating?**
→ Check browser console for CDN loading errors

## What's Included

✅ User verification (drivers & customers)  
✅ Bin assignment with QR codes  
✅ Dashboard with real-time stats  
✅ Search and filter users  
✅ Responsive design (mobile-friendly)  
✅ Professional icons (Font Awesome)  
✅ Complete database schema  
✅ Row Level Security policies  

## Next Steps

1. Customize branding (colors, logo)
2. Add your navigation links
3. Test with sample data
4. Deploy to production

Need help? Check `README.md` for detailed documentation.
