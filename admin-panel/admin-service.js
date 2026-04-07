/**
 * Admin Service for managing user verification and platform administration
 * Handles admin authentication, user verification, and administrative functions
 */

class AdminService {
    static currentAdmin = null;
    static isInitialized = false;

    /**
     * Initialize the admin service
     */
    static async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Wait for Supabase to be ready
            if (typeof SupabaseUtils === 'undefined') {
                console.log('AdminService: Waiting for Supabase...');
                return;
            }

            console.log('AdminService: Initializing...');
            this.isInitialized = true;
            
            // Check if current user is an admin
            await this.checkAdminStatus();
            
        } catch (error) {
            console.error('AdminService initialization error:', error);
        }
    }

    /**
     * Check if current user has admin privileges
     * @param {Object} user - Optional user object, if not provided will try to get current user
     */
    static async checkAdminStatus(user = null) {
        try {
            // Use provided user or try to get current user
            let currentUser = user;
            if (!currentUser) {
                currentUser = SupabaseUtils.getCurrentUser();
                if (!currentUser) {
                    console.log('AdminService: No current user found');
                    return false;
                }
            }

            console.log('AdminService: Checking admin status for:', currentUser.email);

            const { data, error } = await SupabaseUtils.selectRecords('admins', { 
                email: currentUser.email,
                status: 'active'
            }, { limit: 1 });

            if (error) {
                console.error('AdminService: Error checking admin status:', error);
                return false;
            }

            console.log('AdminService: Admin query result:', data);

            if (data && data.length > 0) {
                this.currentAdmin = data[0];
                console.log('AdminService: Admin authenticated:', this.currentAdmin.full_name);
                return true;
            } else {
                console.log('AdminService: No admin record found for email:', currentUser.email);
                return false;
            }
        } catch (error) {
            console.error('AdminService: Error in checkAdminStatus:', error);
            return false;
        }
    }

    /**
     * Get current admin info
     */
    static getCurrentAdmin() {
        return this.currentAdmin;
    }

    /**
     * Check if user has admin access
     */
    static isAdmin() {
        return this.currentAdmin !== null;
    }

    /**
     * Check if admin has specific permission
     */
    static hasPermission(permission) {
        if (!this.currentAdmin) return false;
        return this.currentAdmin.permissions && this.currentAdmin.permissions.includes(permission);
    }

    /**
     * Get all pending verifications (drivers and customers)
     */
    static async getPendingVerifications() {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            console.log('AdminService: Getting pending verifications...');

            // Get pending drivers
            console.log('AdminService: Querying drivers table...');
            const { data: pendingDrivers, error: driversError } = await SupabaseUtils.selectRecords('drivers', {
                verification_status: 'pending'
            }, { orderBy: { column: 'created_at', ascending: true } });

            if (driversError) {
                console.error('AdminService: Error querying drivers:', driversError);
                throw driversError;
            }

            console.log('AdminService: Found', pendingDrivers?.length || 0, 'pending drivers');

            // Get pending customers
            console.log('AdminService: Querying customers table...');
            const { data: pendingCustomers, error: customersError } = await SupabaseUtils.selectRecords('customers', {
                verification_status: 'pending'
            }, { orderBy: { column: 'created_at', ascending: true } });

            if (customersError) {
                console.error('AdminService: Error querying customers:', customersError);
                throw customersError;
            }

            console.log('AdminService: Found', pendingCustomers?.length || 0, 'pending customers');

            return {
                drivers: pendingDrivers || [],
                customers: pendingCustomers || []
            };
        } catch (error) {
            console.error('Error getting pending verifications:', error);
            throw error;
        }
    }

    /**
     * Get verification statistics
     */
    static async getVerificationStats() {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            // Driver stats
            const driverStats = await this.getTableStats('drivers');
            
            // Customer stats
            const customerStats = await this.getTableStats('customers');

            return {
                drivers: driverStats,
                customers: customerStats,
                total: {
                    pending: driverStats.pending + customerStats.pending,
                    approved: driverStats.approved + customerStats.approved,
                    rejected: driverStats.rejected + customerStats.rejected,
                    total: driverStats.total + customerStats.total
                }
            };
        } catch (error) {
            console.error('Error getting verification stats:', error);
            throw error;
        }
    }

    /**
     * Get stats for a specific table
     */
    static async getTableStats(tableName) {
        const supabase = this.getSupabaseClient();
        const { data, error } = await supabase
            .from(tableName)
            .select('verification_status');

        if (error) throw error;

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            under_review: 0,
            total: data.length
        };

        data.forEach(record => {
            const status = record.verification_status || 'pending';
            stats[status] = (stats[status] || 0) + 1;
        });

        return stats;
    }

    /**
     * Verify a user (approve or reject)
     */
    static async verifyUser(userId, userType, action, notes = '') {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            if (!this.hasPermission('verify_users')) {
                throw new Error('Insufficient permissions');
            }

            if (!['approved', 'rejected'].includes(action)) {
                throw new Error('Invalid action. Must be "approved" or "rejected"');
            }

            const tableName = userType === 'driver' ? 'drivers' : 'customers';
            const now = new Date().toISOString();

            // Get current status for history
            const { data: currentData, error: currentError } = await SupabaseUtils.selectRecords(tableName, { id: userId }, { limit: 1 });
            
            if (currentError) throw currentError;
            if (!currentData || currentData.length === 0) {
                throw new Error('User not found');
            }

            const oldStatus = currentData[0].verification_status;

            // Update user verification status
            const updateData = {
                verification_status: action,
                verification_notes: notes,
                verified_by: this.currentAdmin.email,
                verified_at: now
            };

            const { error: updateError } = await SupabaseUtils.updateRecord(tableName, userId, updateData);
            
            if (updateError) throw updateError;

            // Record verification history
            await this.recordVerificationHistory(userId, userType, action, oldStatus, notes);

            return { success: true, message: `User ${action} successfully` };
        } catch (error) {
            console.error('Error verifying user:', error);
            throw error;
        }
    }

    /**
     * Record verification action in history
     */
    static async recordVerificationHistory(userId, userType, action, oldStatus, notes) {
        try {
            const historyRecord = {
                user_id: userId,
                user_type: userType,
                admin_email: this.currentAdmin.email,
                action: action,
                old_status: oldStatus,
                new_status: action,
                notes: notes
            };

            const { error } = await SupabaseUtils.insertRecord('verification_history', historyRecord);
            if (error) throw error;
        } catch (error) {
            console.error('Error recording verification history:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Get verification history for a user
     */
    static async getVerificationHistory(userId, userType) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const { data, error } = await SupabaseUtils.selectRecords('verification_history', {
                user_id: userId,
                user_type: userType
            }, { orderBy: { column: 'created_at', ascending: false } });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting verification history:', error);
            throw error;
        }
    }

    /**
     * Bulk verify multiple users
     */
    static async bulkVerifyUsers(userIds, userType, action, notes = '') {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            if (!this.hasPermission('verify_users')) {
                throw new Error('Insufficient permissions');
            }

            const results = [];
            for (const userId of userIds) {
                try {
                    const result = await this.verifyUser(userId, userType, action, notes);
                    results.push({ userId, success: true, ...result });
                } catch (error) {
                    results.push({ userId, success: false, error: error.message });
                }
            }

            return results;
        } catch (error) {
            console.error('Error in bulk verify:', error);
            throw error;
        }
    }

    /**
     * Search users by verification status or other criteria
     */
    static async searchUsers(userType, filters = {}) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const tableName = userType === 'driver' ? 'drivers' : 'customers';
            // By default, only show non-rejected drivers unless filters.status is set
            if (userType === 'driver' && !filters.verification_status) {
                filters.verification_status = ['approved', 'under_review', 'pending', 'paused'];
            }
            const { data, error } = await SupabaseUtils.selectRecords(tableName, filters, {
                orderBy: { column: 'created_at', ascending: false }
            });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    /**
     * Pause or unpause a driver
     */
    static async setDriverPaused(driverId, paused = true) {
        try {
            if (!this.isAdmin()) throw new Error('Admin access required');
            const status = paused ? 'paused' : 'approved';
            const { error } = await SupabaseUtils.updateRecord('drivers', driverId, {
                verification_status: status,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            return { success: true, status };
        } catch (error) {
            console.error('Error pausing/unpausing driver:', error);
            throw error;
        }
    }

    /**
     * Get user details with verification info
     */
    static async getUserDetails(userId, userType) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const tableName = userType === 'driver' ? 'drivers' : 'customers';
            const { data, error } = await SupabaseUtils.selectRecords(tableName, { id: userId }, { limit: 1 });

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('User not found');
            }

            // Get verification history
            const history = await this.getVerificationHistory(userId, userType);

            return {
                user: data[0],
                history: history
            };
        } catch (error) {
            console.error('Error getting user details:', error);
            throw error;
        }
    }

    /**
     * Update admin last login time
     */
    static async updateLastLogin() {
        try {
            if (!this.currentAdmin) return;

            const { error } = await SupabaseUtils.updateRecord('admins', this.currentAdmin.id, {
                last_login: new Date().toISOString()
            });

            if (error) {
                console.error('Error updating last login:', error);
            }
        } catch (error) {
            console.error('Error in updateLastLogin:', error);
        }
    }

    /**
     * Get the Supabase client (with fallbacks)
     */
    static getSupabaseClient() {
        // Try different ways to get the Supabase client
        if (window.currentSupabaseClient) {
            return window.currentSupabaseClient;
        }
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        if (window.supabase) {
            return window.supabase;
        }
        if (SupabaseUtils && SupabaseUtils.supabase) {
            return SupabaseUtils.supabase;
        }
        throw new Error('Supabase client not available');
    }

    /**
     * Assign a bin to a customer
     * @param {string} customerId - Customer UUID
     * @param {Object} binData - Bin assignment data
     */
    static async assignBinToCustomer(customerId, binData) {
        try {
            // Validate admin privileges
            if (!this.currentAdmin) {
                throw new Error('Admin privileges required');
            }

            console.log('AdminService: Assigning bin to customer:', customerId, binData);

            const supabase = this.getSupabaseClient();

            // Check if bin serial number already exists
            const { data: existingBin, error: checkError } = await supabase
                .from('bins')
                .select('id, bin_serial_number')
                .eq('bin_serial_number', binData.binSerialNumber)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
                throw checkError;
            }

            if (existingBin) {
                throw new Error(`Bin serial number ${binData.binSerialNumber} is already assigned`);
            }

            // Calculate next scheduled collection date based on frequency
            let nextCollection = new Date();
            switch (binData.collectionFrequency) {
                case 'daily':
                    nextCollection.setDate(nextCollection.getDate() + 1);
                    break;
                case 'weekly':
                    nextCollection.setDate(nextCollection.getDate() + 7);
                    break;
                case 'bi-weekly':
                    nextCollection.setDate(nextCollection.getDate() + 14);
                    break;
                case 'monthly':
                    nextCollection.setMonth(nextCollection.getMonth() + 1);
                    break;
                default:
                    nextCollection.setDate(nextCollection.getDate() + 7); // default to weekly
            }

            // Insert new bin record
            const { data: newBin, error: insertError } = await supabase
                .from('bins')
                .insert({
                    customer_id: customerId,
                    bin_serial_number: binData.binSerialNumber,
                    bin_type: binData.binType || 'standard',
                    bin_size_liters: binData.binSizeLiters || 120,
                    assigned_by: this.currentAdmin.email,
                    collection_frequency: binData.collectionFrequency || 'weekly',
                    location_notes: binData.locationNotes || '',
                    special_instructions: binData.specialInstructions || '',
                    next_scheduled_collection: nextCollection.toISOString()
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            console.log('AdminService: Bin assigned successfully:', newBin);

            return {
                success: true,
                message: `Bin ${binData.binSerialNumber} assigned successfully`,
                bin: newBin
            };

        } catch (error) {
            console.error('AdminService: Error assigning bin:', error);
            throw new Error(error.message || 'Failed to assign bin');
        }
    }

    /**
     * Get customer's assigned bins
     * @param {string} customerId - Customer UUID
     */
    static async getCustomerBins(customerId) {
        try {
            console.log('AdminService: Getting bins for customer:', customerId);

            const supabase = this.getSupabaseClient();

            const { data: bins, error } = await supabase
                .from('bins')
                .select(`
                    *,
                    bin_collections!inner(
                        id,
                        collection_date,
                        collection_status
                    )
                `)
                .eq('customer_id', customerId)
                .order('assigned_date', { ascending: false });

            if (error) {
                throw error;
            }

            return bins || [];

        } catch (error) {
            console.error('AdminService: Error getting customer bins:', error);
            throw new Error(error.message || 'Failed to get customer bins');
        }
    }

    /**
     * Update bin details
     * @param {string} binId - Bin UUID
     * @param {Object} updates - Fields to update
     */
    static async updateBin(binId, updates) {
        try {
            if (!this.currentAdmin) {
                throw new Error('Admin privileges required');
            }

            console.log('AdminService: Updating bin:', binId, updates);

            const supabase = this.getSupabaseClient();

            const { data: updatedBin, error } = await supabase
                .from('bins')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', binId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: 'Bin updated successfully',
                bin: updatedBin
            };

        } catch (error) {
            console.error('AdminService: Error updating bin:', error);
            throw new Error(error.message || 'Failed to update bin');
        }
    }

    /**
     * Remove bin assignment
     * @param {string} binId - Bin UUID
     */
    static async removeBinAssignment(binId) {
        try {
            if (!this.currentAdmin) {
                throw new Error('Admin privileges required');
            }

            console.log('AdminService: Removing bin assignment:', binId);

            const supabase = this.getSupabaseClient();

            const { error } = await supabase
                .from('bins')
                .delete()
                .eq('id', binId);

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: 'Bin assignment removed successfully'
            };

        } catch (error) {
            console.error('AdminService: Error removing bin assignment:', error);
            throw new Error(error.message || 'Failed to remove bin assignment');
        }
    }

    /**
     * Get all customers (for admin overview and selection)
     */
    static async getAllCustomers() {
        try {
            console.log('AdminService: Getting all customers');

            const supabase = this.getSupabaseClient();

            const { data: customers, error } = await supabase
                .from('customers')
                .select(`
                    id,
                    full_name,
                    email,
                    phone_number,
                    address,
                    verification_status
                `)
                .order('full_name', { ascending: true });

            if (error) {
                throw error;
            }

            return customers || [];

        } catch (error) {
            console.error('AdminService: Error getting all customers:', error);
            throw new Error(error.message || 'Failed to get customers data');
        }
    }

    /**
     * Get all bins with customer info (for admin overview)
     */
    static async getAllBinsWithCustomers() {
        try {
            console.log('AdminService: Getting all bins with customer info');

            const supabase = this.getSupabaseClient();

            const { data: bins, error } = await supabase
                .from('bins')
                .select(`
                    *,
                    customers!inner(
                        id,
                        full_name,
                        email,
                        phone_number,
                        address,
                        verification_status
                    )
                `)
                .order('assigned_date', { ascending: false });

            if (error) {
                throw error;
            }

            return bins || [];

        } catch (error) {
            console.error('AdminService: Error getting all bins:', error);
            throw new Error(error.message || 'Failed to get bins data');
        }
    }

    /**
     * Format user info for display
     */
    static formatUserInfo(user, userType) {
        return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            type: userType,
            verificationStatus: user.verification_status || 'pending',
            verificationNotes: user.verification_notes || '',
            verifiedBy: user.verified_by || '',
            verifiedAt: user.verified_at || '',
            createdAt: user.created_at,
            // Driver specific
            vehicleType: user.vehicle_type || '',
            vehicleInfo: user.vehicle_make && user.vehicle_model ?
                `${user.vehicle_make} ${user.vehicle_model} (${user.vehicle_year})` : '',
            licensePlate: user.vehicle_plate || '',
            idFrontUrl: user.id_front_url || null,
            idBackUrl: user.id_back_url || null,
            // Customer specific
            address: user.address || '',
            totalOrders: user.total_orders || 0
        };
    }
}

// Auto-initialize when Supabase is ready
document.addEventListener('supabaseReady', function() {
    AdminService.initialize();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminService;
}