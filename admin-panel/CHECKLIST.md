# ✅ Integration Checklist

Use this checklist when integrating the admin module into a new project.

## Pre-Integration
- [ ] Have Supabase project ready
- [ ] Have admin email ready to use
- [ ] Project folder created

## File Copy
- [ ] Copy all 9 files from `admin-new` folder to your project
- [ ] Verify all files copied successfully

## Configuration

### Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run `database-schema.sql` completely
- [ ] Verify tables created (admins, drivers, customers, bins, verification_history)
- [ ] Check RLS policies are enabled

### Supabase Connection
- [ ] Open `supabase-config.js`
- [ ] Replace `url` with your Supabase project URL
- [ ] Replace `anonKey` with your Supabase anon key
- [ ] Save file

### Admin Account
- [ ] Run SQL INSERT for your admin email
- [ ] Verify record created in `admins` table
- [ ] Check `status = 'active'` and `role = 'super_admin'`

## Testing
- [ ] Open `admin.html` in browser
- [ ] Check console for "Supabase client initialized successfully"
- [ ] Login with admin email
- [ ] Verify dashboard loads without errors
- [ ] Check statistics display correctly
- [ ] Test "Pending Verifications" section
- [ ] Test "Search Users" functionality
- [ ] Test "Bins Management" section
- [ ] Test QR code generation
- [ ] Test QR code download

## Customization (Optional)
- [ ] Update navigation links in `admin.html`
- [ ] Change brand color in `global.css`
- [ ] Update page title if needed
- [ ] Modify navigation menu or remove if not needed
- [ ] Add your logo or branding

## Production Checklist
- [ ] Environment variable for Supabase credentials (recommended)
- [ ] HTTPS enabled
- [ ] Error tracking setup
- [ ] Backup admin account created
- [ ] RLS policies reviewed and tested
- [ ] Performance testing done
- [ ] Mobile responsiveness verified

## Verification Tests

### Authentication
- [ ] Can login as admin
- [ ] Non-admin users are blocked
- [ ] Logout works correctly

### User Management
- [ ] Can view pending drivers
- [ ] Can approve/reject drivers
- [ ] Can view pending customers
- [ ] Can approve/reject customers
- [ ] Search and filters work

### Bin Management
- [ ] Can add bin to customer (valid UUID)
- [ ] QR code generates correctly
- [ ] Can download QR code as PNG
- [ ] QR code contains correct bin data
- [ ] Can view bin details
- [ ] Can remove bin

### Dashboard
- [ ] Statistics load correctly
- [ ] Numbers match database counts
- [ ] Real-time updates work
- [ ] All navigation buttons work

## Common Issues

| Issue | Solution |
|-------|----------|
| "Admin access denied" | Check admin email in `admins` table with status='active' |
| Stats show errors | Verify all database tables exist |
| QR blank/white | Check browser console for CDN errors |
| Can't login | Verify Supabase credentials in `supabase-config.js` |
| 404 errors on nav | Update links in `admin.html` to match your project |

## Need Help?

1. Check browser console for errors
2. Review `README.md` for detailed docs
3. Check `QUICK-START.md` for setup guide
4. Verify database schema is complete

---

**Integration Date:** _____________  
**Tested By:** _____________  
**Production Ready:** ☐ Yes  ☐ No  
**Notes:**
