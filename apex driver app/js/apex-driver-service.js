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
            console.log('ApexDriverService: Supabase client ready via event');
        });

        // Also try to get supabase client directly (fallback)
        setTimeout(() => {
            if (!this.isReady && (window.supabaseClient || window.supabase)) {
                this.supabase = window.supabaseClient || window.supabase;
                this.isReady = true;
                console.log('ApexDriverService: Supabase client ready via fallback');
            }
        }, 2000);
    }

    // Ensure Supabase is ready before operations
    _ensureReady() {
        if (!this.isReady || !this.supabase) {
            // Try one more time to get the client
            if (window.supabaseClient || window.supabase) {
                this.supabase = window.supabaseClient || window.supabase;
                this.isReady = true;
                console.log('ApexDriverService: Supabase client found during _ensureReady');
            } else {
                throw new Error('ApexDriverService: Supabase not ready. Make sure supabase-config.js is loaded first.');
            }
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

    async getDriverByEmail(email) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('drivers')
            .select('*')
            .eq('email', email)
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
        
        try {
            // Always get all available jobs directly from the table
            const { data, error } = await this.supabase
                .from('jobs')
                .select(`
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    pickup_address,
                    dropoff_address,
                    pickup_location,
                    dropoff_location,
                    job_type,
                    description,
                    price,
                    estimated_duration,
                    status,
                    created_at
                `)
                .in('status', ['available', 'pending'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching jobs:', error);
                return { data: null, error };
            }

            console.log('Raw database jobs:', data);

            // Transform the data to match the expected frontend format
            const transformedJobs = data?.map(job => {
                // Extract coordinates from PostGIS POINT format
                let lat = null, lng = null;
                if (job.pickup_location) {
                    try {
                        // Handle different PostGIS formats
                        let locationStr = job.pickup_location;
                        
                        // If it's already a string, use it directly
                        if (typeof locationStr === 'string') {
                            const locationMatch = locationStr.match(/POINT\(([^)]+)\)/);
                            if (locationMatch) {
                                const coords = locationMatch[1].split(' ');
                                lng = parseFloat(coords[0]);
                                lat = parseFloat(coords[1]);
                            }
                        }
                        // If it's a PostGIS object, try to extract coordinates
                        else if (typeof locationStr === 'object' && locationStr.coordinates) {
                            lng = locationStr.coordinates[0];
                            lat = locationStr.coordinates[1];
                        }
                    } catch (e) {
                        console.warn('Error parsing pickup_location:', e);
                    }
                }

                // Determine priority based on job characteristics (since there's no priority field)
                const isPriority = job.price && parseFloat(job.price) > 150; // High value jobs
                
                return {
                    id: job.id,
                    name: job.customer_name || 'Delivery Job',
                    customer_name: job.customer_name,
                    customer_phone: job.customer_phone,
                    address: job.pickup_address,
                    lat: lat || -29.8587, // Default to Durban center if no location
                    lng: lng || 31.0218,
                    jobType: this._formatJobType(job.job_type),
                    payment: `R${job.price || 0}`,
                    estimatedTime: `${job.estimated_duration || 30} min`,
                    priority: isPriority,
                    iconUrl: null,
                    description: job.description,
                    dropoffAddress: job.dropoff_address,
                    specialInstructions: job.notes || null // Use notes field if available
                };
            }) || [];

            console.log('Transformed jobs:', transformedJobs);

            return { data: transformedJobs, error: null };
            
        } catch (error) {
            console.error('Error in getAvailableJobs:', error);
            return { data: null, error };
        }
    }

    // Helper function to format job types for display
    _formatJobType(jobType) {
        const typeMap = {
            'food_delivery': 'Food Delivery',
            'grocery_delivery': 'Grocery Delivery',
            'pharmacy_delivery': 'Pharmacy Delivery',
            'document_delivery': 'Document Delivery',
            'package_delivery': 'Package Delivery',
            'oil_collection': 'Oil Collection',
            'delivery': 'Delivery',
            'ride': 'Ride',
            'pickup': 'Pickup'
        };
        return typeMap[jobType] || 'Delivery';
    }

    // ==================== OIL COLLECTION OPERATIONS ====================
    
    async getAvailableOilCollectionJobs(latitude = null, longitude = null, radius = 20) {
        this._ensureReady();
        
        try {
            let data, error;
            
            // If location provided, use the nearby_oil_collection_jobs function
            if (latitude && longitude) {
                const { data: nearbyData, error: nearbyError } = await this.supabase
                    .rpc('nearby_oil_collection_jobs', {
                        lat: latitude,
                        lng: longitude,
                        radius_km: radius
                    });
                data = nearbyData;
                error = nearbyError;
            } else {
                // Otherwise get all available oil collection jobs
                const { data: allData, error: allError } = await this.supabase
                    .from('oil_collection_jobs')
                    .select('*')
                    .eq('status', 'available')
                    .order('priority', { ascending: false })
                    .order('created_at', { ascending: false });
                data = allData;
                error = allError;
            }

            if (error) {
                console.error('Error fetching oil collection jobs:', error);
                return { data: null, error };
            }

            // Transform the data to match the expected frontend format
            const transformedJobs = data?.map(job => {
                // Extract coordinates from PostGIS POINT format
                let lat = null, lng = null;
                if (job.pickup_location) {
                    try {
                        const locationMatch = job.pickup_location.match(/POINT\(([^)]+)\)/);
                        if (locationMatch) {
                            const coords = locationMatch[1].split(' ');
                            lng = parseFloat(coords[0]);
                            lat = parseFloat(coords[1]);
                        }
                    } catch (e) {
                        console.warn('Error parsing location:', e);
                    }
                }

                return {
                    id: job.id,
                    name: job.customer_name || 'Oil Collection',
                    customer_name: job.customer_name,
                    customer_phone: job.customer_phone,
                    address: job.pickup_address,
                    lat: lat || -29.8587,
                    lng: lng || 31.0218,
                    jobType: 'Oil Collection',
                    payment: `R${job.payment_amount || 0}`,
                    estimatedTime: `30 min`, // Default for oil collection
                    priority: job.priority === 'high' || job.priority === 'urgent',
                    iconUrl: null,
                    description: job.description,
                    dropoffAddress: 'Collection Point', // Oil collection doesn't have dropoff
                    specialInstructions: job.special_instructions,
                    estimatedOilVolume: job.estimated_oil_volume,
                    priorityLevel: job.priority
                };
            }) || [];

            return { data: transformedJobs, error: null };
            
        } catch (error) {
            console.error('Error in getAvailableOilCollectionJobs:', error);
            return { data: null, error };
        }
    }

    async createOilCollectionJob(jobData) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('oil_collection_jobs')
            .insert({
                customer_name: jobData.customerName,
                customer_phone: jobData.customerPhone,
                customer_email: jobData.customerEmail,
                pickup_address: jobData.pickupAddress,
                pickup_location: jobData.pickupLocation ? `POINT(${jobData.pickupLocation.lng} ${jobData.pickupLocation.lat})` : null,
                description: jobData.description,
                estimated_oil_volume: jobData.estimatedOilVolume,
                payment_amount: jobData.paymentAmount,
                priority: jobData.priority || 'normal',
                special_instructions: jobData.specialInstructions,
                equipment_requirements: jobData.equipmentRequirements || [],
                status: 'available',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

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
            .in('status', ['available', 'pending']) // Assign if available or pending
            .select()
            .single();

        if (data) {
            // Update driver status to busy
            await this.updateDriverStatus(driverId, 'busy');
        }

        return { data, error };
    }

    async acceptJob(jobId, driverId) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('jobs')
            .update({
                driver_id: driverId,
                status: 'in_progress',
                assigned_at: new Date().toISOString(),
                started_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .in('status', ['available', 'pending']) // Accept if available or pending
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
        
        const validStatuses = ['available', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
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

    // ==================== OIL COLLECTION OPERATIONS ====================
    
    /**
     * Create a new oil collection record
     * @param {Object} collectionData - Collection data
     * @returns {Object} Result with data or error
     */
    async createOilCollection(collectionData) {
        this._ensureReady();
        
        try {
            console.log('Creating oil collection:', collectionData);
            
            const { data, error } = await this.supabase
                .from('oil_collections')
                .insert({
                    driver_id: collectionData.driverId,
                    customer_id: collectionData.customerId, // Now includes customer_id
                    collection_date: collectionData.collectionDate || new Date().toISOString(),
                    collected_volume: collectionData.collectedVolume,
                    oil_type: collectionData.oilType,
                    oil_condition: collectionData.oilCondition,
                    collection_method: collectionData.collectionMethod,
                    status: collectionData.status || 'completed',
                    payment_amount: collectionData.paymentAmount,
                    notes: collectionData.notes,
                    quality_assessment: collectionData.qualityAssessment,
                    equipment_used: collectionData.equipmentUsed,
                    disposal_method: collectionData.disposalMethod
                })
                .select()
                .single();
                
            if (error) {
                console.error('Error creating oil collection:', error);
                throw error;
            }
            
            console.log('Oil collection created successfully:', data);
            return { data, error: null };
            
        } catch (error) {
            console.error('Error in createOilCollection:', error);
            return { data: null, error };
        }
    }

    /**
     * Get oil collections for a specific driver
     * @param {string} driverId - Driver UUID
     * @returns {Object} Result with data or error
     */
    async getDriverCollections(driverId) {
        this._ensureReady();
        
        try {
            const { data, error } = await this.supabase
                .from('oil_collections')
                .select(`
                    *,
                    customers:customer_id (
                        full_name,
                        email,
                        phone_number,
                        address
                    )
                `)
                .eq('driver_id', driverId)
                .order('collection_date', { ascending: false });
                
            return { data, error };
            
        } catch (error) {
            console.error('Error fetching driver collections:', error);
            return { data: null, error };
        }
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