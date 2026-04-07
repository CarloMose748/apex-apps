// Apex Driver Database Service
// This module provides database operations specific to the Apex Driver app

class ApexDriverService {
    constructor() {
        this.supabase = null;
        this.isReady = false;
        
        // Listen for Supabase to be ready
        document.addEventListener('supabaseReady', (event) => {
            this.supabase = event.detail.client;
            this.isReady = true;
            console.log('ApexDriverService: Supabase client ready');
        });
    }

    // Ensure Supabase is ready before operations
    _ensureReady() {
        if (!this.isReady || !this.supabase) {
            throw new Error('ApexDriverService: Supabase not ready. Make sure supabase-config.js is loaded first.');
        }
    }

    // ==================== DRIVER OPERATIONS ====================
    
    async registerDriver(driverData) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('drivers')
            .insert({
                email: driverData.email,
                full_name: driverData.fullName,
                phone_number: driverData.phoneNumber,
                vehicle_type: driverData.vehicleType,
                license_number: driverData.licenseNumber,
                vehicle_make: driverData.vehicleMake,
                vehicle_model: driverData.vehicleModel,
                vehicle_year: driverData.vehicleYear,
                vehicle_plate: driverData.vehiclePlate,
                status: 'active',
                location: driverData.location || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        return { data, error };
    }

    async updateDriverLocation(driverId, latitude, longitude) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('drivers')
            .update({
                location: `POINT(${longitude} ${latitude})`,
                last_location_update: new Date().toISOString()
            })
            .eq('id', driverId)
            .select()
            .single();

        return { data, error };
    }

    async updateDriverStatus(driverId, status) {
        this._ensureReady();
        
        const validStatuses = ['active', 'busy', 'offline', 'suspended'];
        if (!validStatuses.includes(status)) {
            return { data: null, error: { message: 'Invalid status' } };
        }

        const { data, error } = await this.supabase
            .from('drivers')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', driverId)
            .select()
            .single();

        return { data, error };
    }

    // ==================== JOB OPERATIONS ====================
    
    async createJob(jobData) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('jobs')
            .insert({
                customer_name: jobData.customerName,
                customer_phone: jobData.customerPhone,
                pickup_address: jobData.pickupAddress,
                pickup_location: jobData.pickupLocation ? `POINT(${jobData.pickupLocation.lng} ${jobData.pickupLocation.lat})` : null,
                dropoff_address: jobData.dropoffAddress,
                dropoff_location: jobData.dropoffLocation ? `POINT(${jobData.dropoffLocation.lng} ${jobData.dropoffLocation.lat})` : null,
                job_type: jobData.jobType || 'delivery',
                description: jobData.description,
                price: jobData.price,
                estimated_duration: jobData.estimatedDuration,
                status: 'available',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        return { data, error };
    }

    async getAvailableJobs(latitude = null, longitude = null, radius = 10) {
        this._ensureReady();
        
        let query = this.supabase
            .from('jobs')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        // If location provided, filter by distance
        if (latitude && longitude) {
            // Using PostGIS distance calculation (in kilometers)
            query = query.rpc('nearby_jobs', {
                lat: latitude,
                lng: longitude,
                radius_km: radius
            });
        }

        const { data, error } = await query;
        return { data, error };
    }

    async getAvailableJobsFromTable(latitude = null, longitude = null, radius = 10) {
        this._ensureReady();
        
        // For now, just get all available jobs without location filtering
        // We'll do distance calculation in the frontend
        const { data, error } = await this.supabase
            .from('available_jobs')
            .select('*')
            .order('created_at', { ascending: false });

        return { data, error };
    }

    async assignJobToDriver(jobId, driverId) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('jobs')
            .update({
                driver_id: driverId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .eq('status', 'available') // Only assign if still available
            .select()
            .single();

        if (data) {
            // Update driver status to busy
            await this.updateDriverStatus(driverId, 'busy');
        }

        return { data, error };
    }

    async updateJobStatus(jobId, status, driverId = null) {
        this._ensureReady();
        
        const validStatuses = ['available', 'assigned', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return { data: null, error: { message: 'Invalid job status' } };
        }

        let updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };

        // Set timestamps based on status
        switch (status) {
            case 'in_progress':
                updateData.started_at = new Date().toISOString();
                break;
            case 'completed':
                updateData.completed_at = new Date().toISOString();
                // Update driver status back to active
                if (driverId) {
                    await this.updateDriverStatus(driverId, 'active');
                }
                break;
            case 'cancelled':
                updateData.cancelled_at = new Date().toISOString();
                // Update driver status back to active if was assigned
                if (driverId) {
                    await this.updateDriverStatus(driverId, 'active');
                }
                break;
        }

        const { data, error } = await this.supabase
            .from('jobs')
            .update(updateData)
            .eq('id', jobId)
            .select()
            .single();

        return { data, error };
    }

    async getDriverJobs(driverId, status = null) {
        this._ensureReady();
        
        let query = this.supabase
            .from('jobs')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        return { data, error };
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================
    
    subscribeToAvailableJobs(callback) {
        this._ensureReady();
        
        return this.supabase
            .channel('available-jobs')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'jobs',
                filter: 'status=eq.available'
            }, callback)
            .subscribe();
    }

    subscribeToDriverJobs(driverId, callback) {
        this._ensureReady();
        
        return this.supabase
            .channel(`driver-jobs-${driverId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'jobs',
                filter: `driver_id=eq.${driverId}`
            }, callback)
            .subscribe();
    }

    subscribeToJobStatus(jobId, callback) {
        this._ensureReady();
        
        return this.supabase
            .channel(`job-${jobId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'jobs',
                filter: `id=eq.${jobId}`
            }, callback)
            .subscribe();
    }

    // ==================== ANALYTICS & REPORTING ====================
    
    async getDriverStats(driverId, startDate = null, endDate = null) {
        this._ensureReady();
        
        let query = this.supabase
            .from('jobs')
            .select('*')
            .eq('driver_id', driverId)
            .eq('status', 'completed');

        if (startDate) {
            query = query.gte('completed_at', startDate);
        }
        if (endDate) {
            query = query.lte('completed_at', endDate);
        }

        const { data, error } = await query;
        
        if (error) return { data: null, error };

        const stats = {
            totalJobs: data.length,
            totalEarnings: data.reduce((sum, job) => sum + (job.price || 0), 0),
            averageJobValue: data.length > 0 ? data.reduce((sum, job) => sum + (job.price || 0), 0) / data.length : 0,
            completedJobs: data.length
        };

        return { data: stats, error: null };
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    async searchJobs(searchTerm, filters = {}) {
        this._ensureReady();
        
        let query = this.supabase
            .from('jobs')
            .select('*');

        // Text search in customer name, pickup address, or dropoff address
        if (searchTerm) {
            query = query.or(`customer_name.ilike.%${searchTerm}%,pickup_address.ilike.%${searchTerm}%,dropoff_address.ilike.%${searchTerm}%`);
        }

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data, error } = await query.order('created_at', { ascending: false });
        return { data, error };
    }

    // Clean up subscriptions
    unsubscribe(subscription) {
        if (subscription) {
            subscription.unsubscribe();
        }
    }
}

// Create and export a singleton instance
const apexDriverService = new ApexDriverService();
window.ApexDriverService = apexDriverService;