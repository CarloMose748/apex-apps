/**
 * Customer Collection History Service
 * Functions to fetch and display oil collection history for customers
 */

const KG_PER_LITRE = 0.92;

function litresToKilograms(litres) {
    return (Number(litres) || 0) * KG_PER_LITRE;
}

class CustomerCollectionService {
    
    /**
     * Get all oil collections for a specific customer
     * @param {string} customerId - Customer UUID
     * @returns {Array} Array of collection records
     */
    static async getCustomerCollections(customerId) {
        try {
            console.log('Fetching collections for customer:', customerId);
            
            const client = window.supabaseClient || window.supabase;
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await client
                .from('oil_collections')
                .select(`
                    id,
                    collection_date,
                    collected_volume,
                    oil_type,
                    oil_condition,
                    collection_method,
                    status,
                    verified_at,
                    verified_by,
                    payment_amount,
                    notes,
                    quality_assessment,
                    disposal_method,
                    created_at,
                    driver_id,
                    drivers:driver_id (
                        full_name,
                        phone_number,
                        vehicle_type
                    )
                `)
                .eq('customer_id', customerId)
                .order('collection_date', { ascending: false });
                
            if (error) {
                console.error('Error fetching customer collections:', error);
                throw error;
            }
            
            console.log('Found collections for customer:', data?.length || 0);
            return data || [];
            
        } catch (error) {
            console.error('Error in getCustomerCollections:', error);
            throw error;
        }
    }
    
    /**
     * Get collection statistics for a customer
     * @param {string} customerId - Customer UUID
     * @returns {Object} Statistics object
     */
    static async getCustomerCollectionStats(customerId) {
        try {
            const collections = await this.getCustomerCollections(customerId);
            
            const stats = {
                totalCollections: collections.length,
                totalVolume: collections.reduce((sum, c) => sum + (c.collected_volume || 0), 0),
                totalPayments: collections.reduce((sum, c) => sum + (c.payment_amount || 0), 0),
                verifiedCollections: collections.filter(c => c.verified_by).length,
                pendingVerification: collections.filter(c => c.status === 'pending_verification').length,
                lastCollection: collections.length > 0 ? collections[0].collection_date : null
            };
            
            return stats;
            
        } catch (error) {
            console.error('Error calculating customer stats:', error);
            throw error;
        }
    }
    
    /**
     * Format collection data for display in customer portal
     * @param {Object} collection - Raw collection data
     * @returns {Object} Formatted collection data
     */
    static formatCollectionForCustomer(collection) {
        return {
            id: collection.id,
            collectionDate: new Date(collection.collection_date).toLocaleDateString(),
            collectionTime: new Date(collection.collection_date).toLocaleTimeString(),
            volume: `${litresToKilograms(collection.collected_volume || 0).toFixed(1)}kg`,
            oilType: collection.oil_type || 'Unknown',
            condition: collection.oil_condition || 'N/A',
            method: collection.collection_method || 'N/A',
            status: collection.status || 'completed',
            verified: !!collection.verified_by,
            verifiedAt: collection.verified_at ? new Date(collection.verified_at).toLocaleDateString() : null,
            payment: `R${(collection.payment_amount || 0).toFixed(2)}`,
            driverName: collection.drivers?.full_name || 'Unknown Driver',
            driverPhone: collection.drivers?.phone_number || null,
            vehicle: collection.drivers?.vehicle_type || 'Unknown Vehicle',
            notes: collection.notes || '',
            qualityAssessment: collection.quality_assessment || '',
            disposalMethod: collection.disposal_method || 'N/A'
        };
    }
}

// Export for use in customer portal
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerCollectionService;
}