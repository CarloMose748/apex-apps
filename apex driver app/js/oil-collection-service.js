// Oil Collection Database Service
// Handles all database operations for oil collection dashboard

class OilCollectionService {
    constructor() {
        // Initialize with Supabase client (if available)
        this.supabase = null;
        this.initializeSupabase();
    }

    /**
     * Validate if a string is a valid UUID
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuid && uuidRegex.test(uuid);
    }

    /**
     * Validate if a job exists in the oil_collection_jobs table
     */
    async validateJobExists(jobId) {
        try {
            // Check oil_collection_jobs table first
            const { data: oilJob, error: oilError } = await this.supabase
                .from('oil_collection_jobs')
                .select('id')
                .eq('id', jobId)
                .single();

            if (oilJob) {
                console.log('✅ Job found in oil_collection_jobs table:', jobId);
                return true;
            }

            // If not found, check regular jobs table as fallback
            const { data: regularJob, error: regularError } = await this.supabase
                .from('jobs')
                .select('id')
                .eq('id', jobId)
                .single();

            if (regularJob) {
                console.log('✅ Job found in jobs table:', jobId);
                return true;
            }

            console.log('❌ Job not found in either jobs or oil_collection_jobs table:', jobId);
            return false;
        } catch (error) {
            console.error('Error validating job existence:', error);
            return false;
        }
    }

    /**
     * Validate if a driver exists in the drivers table
     */
    async validateDriverExists(driverId) {
        try {
            // First try to find by UUID
            const { data: driver, error } = await this.supabase
                .from('drivers')
                .select('id, email')
                .eq('id', driverId)
                .single();

            if (driver) {
                console.log('✅ Driver found in drivers table by ID:', driverId);
                return true;
            }

            // If not found by ID, log what drivers exist for debugging
            const { data: allDrivers, error: allError } = await this.supabase
                .from('drivers')
                .select('id, email, full_name')
                .limit(10);

            console.log('❌ Driver not found by ID:', driverId);
            console.log('🔍 Available drivers in table:', allDrivers);
            return false;
        } catch (error) {
            console.error('Error validating driver existence:', error);
            return false;
        }
    }

    /**
     * Find driver by email if UUID lookup fails
     */
    async findDriverByEmail(email) {
        try {
            const { data: driver, error } = await this.supabase
                .from('drivers')
                .select('id, email, full_name')
                .eq('email', email)
                .single();

            if (driver) {
                console.log('✅ Driver found by email:', email, '-> ID:', driver.id);
                return driver.id;
            }

            console.log('❌ Driver not found by email:', email);
            return null;
        } catch (error) {
            console.error('Error finding driver by email:', error);
            return null;
        }
    }

    /**
     * Complete the save process with photos and earnings calculation
     */
    async completeSaveProcess(collectionId, collectionData, savedCollection) {
        try {
            // Save photos
            if (collectionData.oilPhotos?.length > 0) {
                console.log('Saving oil photos...');
                await this.savePhotos(collectionId, collectionData.oilPhotos, 'oil');
            }

            if (collectionData.paymentPhotos?.length > 0) {
                console.log('Saving payment photos...');
                await this.savePhotos(collectionId, collectionData.paymentPhotos, 'payment');
            }

            // Calculate earnings if we have job_id
            if (savedCollection.job_id) {
                try {
                    console.log('Calculating earnings for job:', savedCollection.job_id);
                    await this.calculateAndSaveEarnings(savedCollection.job_id, collectionId, collectionData.quantity);
                } catch (earningsError) {
                    console.warn('Failed to calculate earnings:', earningsError);
                    // Don't fail the whole operation for earnings calculation
                }
            }

            console.log('✅ Collection saved successfully with job_id:', savedCollection.job_id, 'and driver_id:', savedCollection.driver_id);
            return savedCollection;

        } catch (error) {
            console.error('Error in completeSaveProcess:', error);
            // Return the saved collection even if secondary operations fail
            return savedCollection;
        }
    }

    initializeSupabase() {
        // Try to get Supabase client
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            console.log('OilCollectionService: Supabase client connected');
            return;
        }

        // Wait for Supabase to be ready
        const checkSupabase = setInterval(() => {
            if (window.supabaseClient) {
                this.supabase = window.supabaseClient;
                console.log('OilCollectionService: Supabase client connected (delayed)');
                clearInterval(checkSupabase);
            }
        }, 100);

        // Stop checking after 5 seconds
        setTimeout(() => {
            clearInterval(checkSupabase);
            if (!this.supabase) {
                console.warn('OilCollectionService: Supabase client not available, using mock data');
            }
        }, 5000);
    }

    // ============================================
    // JOBS MANAGEMENT
    // ============================================

    /**
     * Get all available oil collection jobs
     */
    async getAvailableJobs(filters = {}) {
        try {
            if (this.supabase) {
                let query = this.supabase
                    .from('oil_collection_jobs')
                    .select('*')
                    .eq('status', 'available');

                if (filters.priority) {
                    query = query.eq('priority', filters.priority);
                }

                if (filters.search) {
                    query = query.or(`customer_name.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%`);
                }

                const { data, error } = await query.order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } else {
                // Fallback to localStorage
                return this.getMockAvailableJobs(filters);
            }
        } catch (error) {
            console.error('Error fetching available jobs:', error);
            return this.getMockAvailableJobs(filters);
        }
    }

    /**
     * Get jobs assigned to current driver
     */
    async getMyJobs(driverId, filters = {}) {
        try {
            if (this.supabase) {
                let query = this.supabase
                    .from('oil_collection_jobs')
                    .select('*')
                    .eq('driver_id', driverId)
                    .neq('status', 'available');

                if (filters.status) {
                    query = query.eq('status', filters.status);
                }

                if (filters.search) {
                    query = query.or(`customer_name.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%`);
                }

                const { data, error } = await query.order('assigned_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } else {
                // Fallback to localStorage
                return this.getMockMyJobs(filters);
            }
        } catch (error) {
            console.error('Error fetching my jobs:', error);
            return this.getMockMyJobs(filters);
        }
    }

    /**
     * Accept a job
     */
    async acceptJob(jobId, driverId) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('oil_collection_jobs')
                    .update({
                        status: 'assigned',
                        driver_id: driverId,
                        assigned_at: new Date().toISOString()
                    })
                    .eq('id', jobId)
                    .eq('status', 'available')
                    .select();

                if (error) throw error;
                return data?.[0] || null;
            } else {
                // Fallback to localStorage
                return this.mockAcceptJob(jobId, driverId);
            }
        } catch (error) {
            console.error('Error accepting job:', error);
            throw error;
        }
    }

    // ============================================
    // COLLECTION HISTORY
    // ============================================

    /**
     * Get collection history for driver
     */
    async getCollectionHistory(driverId, filters = {}) {
        try {
            if (this.supabase) {
                let query = this.supabase
                    .from('oil_collections')
                    .select(`
                        *,
                        oil_collection_jobs(customer_name, pickup_address),
                        oil_collection_photos(count),
                        oil_collection_earnings(net_amount)
                    `)
                    .eq('driver_id', driverId);

                if (filters.status) {
                    query = query.eq('status', filters.status);
                }

                if (filters.dateFrom) {
                    query = query.gte('collection_date', filters.dateFrom);
                }

                if (filters.dateTo) {
                    query = query.lte('collection_date', filters.dateTo + 'T23:59:59');
                }

                const { data, error } = await query.order('collection_date', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } else {
                // Fallback to localStorage
                return this.getMockCollectionHistory(filters);
            }
        } catch (error) {
            console.error('Error fetching collection history:', error);
            return this.getMockCollectionHistory(filters);
        }
    }

    /**
     * Save collection data
     */
    async saveCollection(collectionData) {
        try {
            if (this.supabase) {
                console.log('Saving collection with data:', collectionData);
                
                // Prepare the collection record with proper job_id and driver_id
                const collectionRecord = {
                    collected_volume: collectionData.quantity,
                    unit: collectionData.unit,
                    notes: collectionData.notes || '',
                    collection_date: collectionData.timestamp,
                    collection_address: collectionData.jobAddress,
                    status: 'completed',
                    oil_type: collectionData.oilType || 'Used Cooking Oil',
                    oil_condition: collectionData.oilCondition || 'Good',
                    collection_method: collectionData.collectionMethod || 'Manual Collection',
                    payment_method: collectionData.paymentMethod || 'Cash'
                };

                // Validate and add job_id if it exists in the database
                if (collectionData.jobId && this.isValidUUID(collectionData.jobId)) {
                    const jobExists = await this.validateJobExists(collectionData.jobId);
                    if (jobExists) {
                        collectionRecord.job_id = collectionData.jobId;
                        console.log('✅ Including valid job_id:', collectionData.jobId);
                    } else {
                        console.warn('❌ Job ID does not exist in database:', collectionData.jobId);
                        collectionRecord.notes += `\n[Job ID not found in DB: ${collectionData.jobId}]`;
                    }
                } else {
                    console.warn('❌ Invalid or missing job_id:', collectionData.jobId);
                }

                // Validate and add driver_id if it exists in the database
                if (collectionData.driverId && this.isValidUUID(collectionData.driverId)) {
                    const driverExists = await this.validateDriverExists(collectionData.driverId);
                    if (driverExists) {
                        collectionRecord.driver_id = collectionData.driverId;
                        console.log('✅ Including valid driver_id:', collectionData.driverId);
                    } else {
                        // Try to find driver by email as fallback
                        if (collectionData.driverEmail) {
                            const foundDriverId = await this.findDriverByEmail(collectionData.driverEmail);
                            if (foundDriverId) {
                                collectionRecord.driver_id = foundDriverId;
                                console.log('✅ Including driver_id found by email:', foundDriverId);
                            } else {
                                console.warn('❌ Driver not found by email either:', collectionData.driverEmail);
                                collectionRecord.notes += `\n[Driver not found - ID: ${collectionData.driverId}, Email: ${collectionData.driverEmail}]`;
                            }
                        } else {
                            console.warn('❌ Driver ID does not exist and no email provided:', collectionData.driverId);
                            collectionRecord.notes += `\n[Driver ID not found in DB: ${collectionData.driverId}]`;
                        }
                    }
                } else {
                    console.warn('❌ Invalid or missing driver_id:', collectionData.driverId);
                }

                // Add bin information if available
                if (collectionData.binSerialNumbers) {
                    collectionRecord.bin_serial_number = collectionData.binSerialNumbers;
                }
                
                const { data: collection, error: collectionError } = await this.supabase
                    .from('oil_collections')
                    .insert([collectionRecord])
                    .select();

                if (collectionError) {
                    console.error('Error saving collection:', collectionError);
                    
                    // If foreign key constraint error, try saving without the foreign keys
                    if (collectionError.message && collectionError.message.includes('violates foreign key constraint')) {
                        console.warn('Foreign key constraint violation, retrying without job_id and driver_id');
                        
                        // Remove foreign keys and add info to notes
                        const fallbackRecord = { ...collectionRecord };
                        const originalJobId = fallbackRecord.job_id;
                        const originalDriverId = fallbackRecord.driver_id;
                        
                        delete fallbackRecord.job_id;
                        delete fallbackRecord.driver_id;
                        
                        fallbackRecord.notes = `${fallbackRecord.notes || ''}\n\n[FALLBACK] Original Job ID: ${originalJobId}\nOriginal Driver ID: ${originalDriverId}`.trim();
                        
                        const { data: fallbackCollection, error: fallbackError } = await this.supabase
                            .from('oil_collections')
                            .insert([fallbackRecord])
                            .select();
                        
                        if (fallbackError) {
                            console.error('Fallback save also failed:', fallbackError);
                            throw fallbackError;
                        }
                        
                        console.log('Collection saved with fallback method (foreign keys in notes)');
                        const collectionId = fallbackCollection[0].id;
                        console.log('Saved collection (fallback):', fallbackCollection[0]);
                        return this.completeSaveProcess(collectionId, collectionData, fallbackCollection[0]);
                    } else {
                        throw collectionError;
                    }
                }

                const collectionId = collection[0].id;
                console.log('Saved collection:', collection[0]);
                return this.completeSaveProcess(collectionId, collectionData, collection[0]);
            } else {
                // Fallback to localStorage
                return this.mockSaveCollection(collectionData);
            }
        } catch (error) {
            console.error('Error saving collection:', error);
            throw error;
        }
    }

    /**
     * Save photos to database
     */
    async savePhotos(collectionId, photos, type) {
        const photoRecords = photos.map((photo, index) => ({
            collection_id: collectionId,
            photo_type: type,
            file_name: photo.name,
            photo_data: photo.dataUrl,
            sequence_number: index,
            is_primary: index === 0
        }));

        const { error } = await this.supabase
            .from('oil_collection_photos')
            .insert(photoRecords);

        if (error) throw error;
    }

    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================

    /**
     * Get driver statistics
     */
    async getDriverStats(driverId) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .rpc('get_driver_oil_collection_stats', { driver_id_param: driverId });

                if (error) throw error;
                return data?.[0] || this.getDefaultStats();
            } else {
                // Fallback to localStorage calculation
                return this.calculateMockStats();
            }
        } catch (error) {
            console.error('Error fetching driver stats:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Calculate earnings for a collection
     */
    async calculateAndSaveEarnings(jobId, collectionId, volume) {
        try {
            if (this.supabase) {
                // Get job details
                const { data: job } = await this.supabase
                    .from('oil_collection_jobs')
                    .select('payment_amount')
                    .eq('id', jobId)
                    .single();

                // Calculate earnings using database function
                const { data: earnings } = await this.supabase
                    .rpc('calculate_oil_collection_earnings', {
                        job_id_param: jobId,
                        collected_volume: volume
                    });

                if (earnings?.[0]) {
                    // Save earnings record
                    const { error } = await this.supabase
                        .from('oil_collection_earnings')
                        .insert([{
                            driver_id: 'current-driver', // Should get from auth
                            job_id: jobId,
                            collection_id: collectionId,
                            base_payment: earnings[0].base_payment,
                            volume_bonus: earnings[0].volume_bonus,
                            efficiency_bonus: earnings[0].efficiency_bonus,
                            gross_amount: earnings[0].total_gross,
                            commission_amount: earnings[0].commission_amount,
                            net_amount: earnings[0].net_amount
                        }]);

                    if (error) throw error;
                }
            }
        } catch (error) {
            console.error('Error calculating earnings:', error);
        }
    }

    // ============================================
    // MOCK DATA METHODS (for localStorage fallback)
    // ============================================

    getMockAvailableJobs(filters = {}) {
        const mockJobs = [
            {
                id: '1',
                customer_name: 'Green Restaurant',
                customer_phone: '+27123456793',
                pickup_address: '45 Beach Road, Durban',
                estimated_oil_volume: 80.0,
                payment_amount: 200.00,
                priority: 'normal',
                created_at: new Date('2025-10-01T08:00:00'),
                status: 'available',
                special_instructions: 'Collection from back entrance only'
            },
            {
                id: '2',
                customer_name: 'City Auto Workshop',
                customer_phone: '+27123456794',
                pickup_address: '123 Workshop Street, Durban',
                estimated_oil_volume: 150.0,
                payment_amount: 350.00,
                priority: 'high',
                created_at: new Date('2025-10-01T09:30:00'),
                status: 'available',
                special_instructions: 'Heavy containers, bring lifting equipment'
            },
            {
                id: '3',
                customer_name: 'Home Collection - Smith',
                customer_phone: '+27123456795',
                pickup_address: '67 Suburb Lane, Durban',
                estimated_oil_volume: 25.0,
                payment_amount: 80.00,
                priority: 'low',
                created_at: new Date('2025-10-01T10:15:00'),
                status: 'available',
                special_instructions: 'Residential area, ring doorbell'
            }
        ];

        return mockJobs.filter(job => {
            if (filters.priority && job.priority !== filters.priority) return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return job.customer_name.toLowerCase().includes(searchLower) ||
                       job.pickup_address.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }

    getMockMyJobs(filters = {}) {
        const savedJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        return savedJobs.filter(job => {
            if (filters.status && job.status !== filters.status) return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (job.name || '').toLowerCase().includes(searchLower) ||
                       (job.address || '').toLowerCase().includes(searchLower);
            }
            return true;
        });
    }

    getMockCollectionHistory(filters = {}) {
        const collections = JSON.parse(localStorage.getItem('oilCollections') || '[]');
        return collections.filter(collection => {
            if (filters.status && (collection.status || 'completed') !== filters.status) return false;
            if (filters.dateFrom && new Date(collection.timestamp) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(collection.timestamp) > new Date(filters.dateTo + 'T23:59:59')) return false;
            return true;
        });
    }

    mockAcceptJob(jobId, driverId) {
        const jobs = this.getMockAvailableJobs();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            job.status = 'assigned';
            job.driver_id = driverId;
            job.assigned_at = new Date().toISOString();
            
            // Save to localStorage
            const savedJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
            savedJobs.push(job);
            localStorage.setItem('jobs', JSON.stringify(savedJobs));
            
            return job;
        }
        return null;
    }

    mockSaveCollection(collectionData) {
        const collections = JSON.parse(localStorage.getItem('oilCollections') || '[]');
        collections.push(collectionData);
        localStorage.setItem('oilCollections', JSON.stringify(collections));
        return collectionData;
    }

    calculateMockStats() {
        const collections = JSON.parse(localStorage.getItem('oilCollections') || '[]');
        const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        
        const thisMonthCollections = collections.filter(c => 
            new Date(c.timestamp) >= thisMonth
        );
        
        return {
            total_collections: collections.length,
            total_volume: collections.reduce((sum, c) => sum + (c.quantity || 0), 0),
            total_earnings: collections.reduce((sum, c) => sum + (c.payment || 0), 0),
            average_volume: collections.length > 0 ? collections.reduce((sum, c) => sum + (c.quantity || 0), 0) / collections.length : 0,
            average_earnings: collections.length > 0 ? collections.reduce((sum, c) => sum + (c.payment || 0), 0) / collections.length : 0,
            this_month_collections: thisMonthCollections.length,
            this_month_volume: thisMonthCollections.reduce((sum, c) => sum + (c.quantity || 0), 0),
            this_month_earnings: thisMonthCollections.reduce((sum, c) => sum + (c.payment || 0), 0)
        };
    }

    getDefaultStats() {
        return {
            total_collections: 0,
            total_volume: 0,
            total_earnings: 0,
            average_volume: 0,
            average_earnings: 0,
            this_month_collections: 0,
            this_month_volume: 0,
            this_month_earnings: 0
        };
    }
}

// Create global instance
window.OilCollectionService = new OilCollectionService();