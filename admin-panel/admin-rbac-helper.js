/**
 * Admin Helper Functions for RBAC Integration
 * 
 * These functions should be integrated into your admin panel (admin-service.js)
 * to ensure the user_roles table is updated when admins approve/reject users.
 */

class AdminRBACHelper {
    
    /**
     * Approve a driver - Updates both drivers table and user_roles table
     * @param {string} driverId - Driver's user ID
     * @param {string} adminEmail - Email of admin performing the action
     * @param {string} notes - Optional approval notes
     */
    static async approveDriver(driverId, adminEmail, notes = '') {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // 1. Update driver record
            const { error: driverError } = await supabase
                .from('drivers')
                .update({ 
                    verification_status: 'approved',
                    verified_by: adminEmail,
                    verified_at: now,
                    verification_notes: notes,
                    updated_at: now
                })
                .eq('id', driverId);

            if (driverError) throw driverError;

            // 2. Update user_roles record to activate driver platform access
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'active',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', driverId)
                .eq('platform', 'driver');

            if (roleError) {
                console.error('Error updating user_roles:', roleError);
                // Log but don't throw - driver record is already updated
            }

            console.log('Driver approved successfully:', driverId);
            return { success: true };
        } catch (error) {
            console.error('Error approving driver:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject a driver - Updates both drivers table and user_roles table
     * @param {string} driverId - Driver's user ID
     * @param {string} adminEmail - Email of admin performing the action
     * @param {string} reason - Rejection reason
     */
    static async rejectDriver(driverId, adminEmail, reason) {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // 1. Update driver record
            const { error: driverError } = await supabase
                .from('drivers')
                .update({ 
                    verification_status: 'rejected',
                    verified_by: adminEmail,
                    verified_at: now,
                    verification_notes: reason,
                    updated_at: now
                })
                .eq('id', driverId);

            if (driverError) throw driverError;

            // 2. Update user_roles record
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'rejected',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', driverId)
                .eq('platform', 'driver');

            if (roleError) {
                console.error('Error updating user_roles:', roleError);
            }

            console.log('Driver rejected:', driverId);
            return { success: true };
        } catch (error) {
            console.error('Error rejecting driver:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Approve a customer - Updates both customers table and user_roles table
     * @param {string} customerId - Customer's user ID
     * @param {string} adminEmail - Email of admin performing the action
     * @param {string} notes - Optional approval notes
     */
    static async approveCustomer(customerId, adminEmail, notes = '') {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // 1. Update customer record
            const { error: customerError } = await supabase
                .from('customers')
                .update({ 
                    verification_status: 'approved',
                    status: 'active',
                    verified_by: adminEmail,
                    verified_at: now,
                    verification_notes: notes,
                    updated_at: now
                })
                .eq('id', customerId);

            if (customerError) throw customerError;

            // 2. Update user_roles record to activate customer platform access
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'active',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', customerId)
                .eq('platform', 'customer');

            if (roleError) {
                console.error('Error updating user_roles:', roleError);
            }

            console.log('Customer approved successfully:', customerId);
            return { success: true };
        } catch (error) {
            console.error('Error approving customer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject a customer - Updates both customers table and user_roles table
     * @param {string} customerId - Customer's user ID
     * @param {string} adminEmail - Email of admin performing the action
     * @param {string} reason - Rejection reason
     */
    static async rejectCustomer(customerId, adminEmail, reason) {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // 1. Update customer record
            const { error: customerError } = await supabase
                .from('customers')
                .update({ 
                    verification_status: 'rejected',
                    status: 'rejected',
                    verified_by: adminEmail,
                    verified_at: now,
                    verification_notes: reason,
                    updated_at: now
                })
                .eq('id', customerId);

            if (customerError) throw customerError;

            // 2. Update user_roles record
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'rejected',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', customerId)
                .eq('platform', 'customer');

            if (roleError) {
                console.error('Error updating user_roles:', roleError);
            }

            console.log('Customer rejected:', customerId);
            return { success: true };
        } catch (error) {
            console.error('Error rejecting customer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Suspend a user's access to a platform
     * @param {string} userId - User's ID
     * @param {string} platform - Platform to suspend ('driver', 'customer', etc.)
     * @param {string} adminEmail - Email of admin performing the action
     * @param {string} reason - Suspension reason
     */
    static async suspendUser(userId, platform, adminEmail, reason) {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // Update user_roles
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'suspended',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', userId)
                .eq('platform', platform);

            if (roleError) throw roleError;

            // Update platform-specific table
            const tableName = platform === 'customer' ? 'customers' : 
                            platform === 'driver' ? 'drivers' : 
                            platform === 'admin' ? 'admins' : null;

            if (tableName) {
                const { error: tableError } = await supabase
                    .from(tableName)
                    .update({ 
                        verification_status: 'suspended',
                        status: 'suspended',
                        verification_notes: reason,
                        updated_at: now
                    })
                    .eq('id', userId);

                if (tableError) {
                    console.error(`Error updating ${tableName}:`, tableError);
                }
            }

            console.log('User suspended:', userId, platform);
            return { success: true };
        } catch (error) {
            console.error('Error suspending user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reactivate a suspended user
     * @param {string} userId - User's ID
     * @param {string} platform - Platform to reactivate ('driver', 'customer', etc.)
     * @param {string} adminEmail - Email of admin performing the action
     */
    static async reactivateUser(userId, platform, adminEmail) {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // Update user_roles
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ 
                    status: 'active',
                    verified_by: adminEmail,
                    verified_at: now,
                    updated_at: now
                })
                .eq('user_id', userId)
                .eq('platform', platform);

            if (roleError) throw roleError;

            // Update platform-specific table
            const tableName = platform === 'customer' ? 'customers' : 
                            platform === 'driver' ? 'drivers' : 
                            platform === 'admin' ? 'admins' : null;

            if (tableName) {
                const { error: tableError } = await supabase
                    .from(tableName)
                    .update({ 
                        verification_status: 'approved',
                        status: 'active',
                        updated_at: now
                    })
                    .eq('id', userId);

                if (tableError) {
                    console.error(`Error updating ${tableName}:`, tableError);
                }
            }

            console.log('User reactivated:', userId, platform);
            return { success: true };
        } catch (error) {
            console.error('Error reactivating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user's platform access details
     * @param {string} userId - User's ID
     */
    static async getUserPlatformAccess(userId) {
        try {
            const supabase = window.getSupabaseClient();

            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting user platform access:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Grant a user access to an additional platform
     * @param {string} userId - User's ID
     * @param {string} email - User's email
     * @param {string} platform - Platform to grant access to
     * @param {string} platformRole - Role within the platform
     * @param {string} adminEmail - Email of admin performing the action
     */
    static async grantPlatformAccess(userId, email, platform, platformRole, adminEmail) {
        try {
            const supabase = window.getSupabaseClient();
            const now = new Date().toISOString();

            // Check if role already exists
            const { data: existing } = await supabase
                .from('user_roles')
                .select('id')
                .eq('user_id', userId)
                .eq('platform', platform)
                .maybeSingle();

            if (existing) {
                return { success: false, error: 'User already has access to this platform' };
            }

            // Create new role
            const { error } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    email: email.toLowerCase(),
                    platform: platform,
                    platform_role: platformRole,
                    status: 'active',
                    verified_by: adminEmail,
                    verified_at: now,
                    created_at: now,
                    updated_at: now
                });

            if (error) throw error;

            console.log('Platform access granted:', userId, platform);
            return { success: true };
        } catch (error) {
            console.error('Error granting platform access:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Revoke a user's access to a platform
     * @param {string} userId - User's ID
     * @param {string} platform - Platform to revoke access from
     * @param {string} adminEmail - Email of admin performing the action
     */
    static async revokePlatformAccess(userId, platform, adminEmail) {
        try {
            const supabase = window.getSupabaseClient();

            // Delete the role record
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId)
                .eq('platform', platform);

            if (error) throw error;

            console.log('Platform access revoked:', userId, platform);
            return { success: true };
        } catch (error) {
            console.error('Error revoking platform access:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make it globally available
window.AdminRBACHelper = AdminRBACHelper;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add this file to your admin panel:
 *    <script src="admin-rbac-helper.js"></script>
 * 
 * 2. Update your existing verification functions in admin-service.js:
 * 
 *    // OLD CODE:
 *    static async verifyDriver(driverId, status, notes) {
 *        await supabase.from('drivers').update({ 
 *            verification_status: status 
 *        }).eq('id', driverId);
 *    }
 * 
 *    // NEW CODE:
 *    static async verifyDriver(driverId, status, notes) {
 *        const adminEmail = this.currentAdmin.email;
 *        
 *        if (status === 'approved') {
 *            return await AdminRBACHelper.approveDriver(driverId, adminEmail, notes);
 *        } else if (status === 'rejected') {
 *            return await AdminRBACHelper.rejectDriver(driverId, adminEmail, notes);
 *        }
 *    }
 * 
 * 3. Similarly update verifyCustomer() function
 * 
 * 4. Add UI for suspending/reactivating users if needed
 */
