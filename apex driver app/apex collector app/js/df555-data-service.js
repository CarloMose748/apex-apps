// DF555 Data Service
// This module provides operations specific to the df555_data table

class DF555DataService {
    constructor() {
        this.supabase = null;
        this.isReady = false;
        this.tableName = 'df555_data';
        
        // Listen for Supabase to be ready
        document.addEventListener('supabaseReady', (event) => {
            this.supabase = event.detail.client;
            this.isReady = true;
            console.log('DF555DataService: Supabase client ready');
        });
    }

    // Ensure Supabase is ready before operations
    _ensureReady() {
        if (!this.isReady || !this.supabase) {
            throw new Error('DF555DataService: Supabase not ready. Make sure supabase-config.js is loaded first.');
        }
    }

    // ==================== BASIC OPERATIONS ====================

    async getRecordCount() {
        this._ensureReady();
        
        const { count, error } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true });

        return { count, error };
    }

    async getAllRecords(limit = 100, offset = 0) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .range(offset, offset + limit - 1);

        return { data, error };
    }

    async getRecordById(id, idColumn = 'id') {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq(idColumn, id)
            .single();

        return { data, error };
    }

    async getRecordsByColumn(columnName, value, limit = 100) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq(columnName, value)
            .limit(limit);

        return { data, error };
    }

    // ==================== SEARCH OPERATIONS ====================

    async searchRecords(searchTerm, columns = null, limit = 100) {
        this._ensureReady();
        
        try {
            // If no columns specified, get text columns automatically
            if (!columns) {
                const { data: schema, error: schemaError } = await this._getTableSchema();
                if (schemaError) {
                    return { data: null, error: schemaError };
                }

                columns = schema
                    .filter(col => 
                        col.data_type.includes('text') || 
                        col.data_type.includes('varchar') || 
                        col.data_type.includes('character')
                    )
                    .map(col => col.column_name);
            }

            if (columns.length === 0) {
                return { data: null, error: { message: 'No searchable columns found' } };
            }

            // Build OR search conditions
            const searchConditions = columns.map(col => `${col}.ilike.%${searchTerm}%`).join(',');
            
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(searchConditions)
                .limit(limit);

            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    }

    async searchByDateRange(dateColumn, startDate, endDate, limit = 100) {
        this._ensureReady();
        
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .limit(limit);

        if (startDate) {
            query = query.gte(dateColumn, startDate);
        }
        if (endDate) {
            query = query.lte(dateColumn, endDate);
        }

        const { data, error } = await query;
        return { data, error };
    }

    async searchByNumericRange(numericColumn, minValue, maxValue, limit = 100) {
        this._ensureReady();
        
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .limit(limit);

        if (minValue !== null && minValue !== undefined) {
            query = query.gte(numericColumn, minValue);
        }
        if (maxValue !== null && maxValue !== undefined) {
            query = query.lte(numericColumn, maxValue);
        }

        const { data, error } = await query;
        return { data, error };
    }

    // ==================== FILTERING & SORTING ====================

    async getRecordsWithFilters(filters = {}, options = {}) {
        this._ensureReady();
        
        let query = this.supabase.from(this.tableName).select('*');
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                query = query.in(key, value);
            } else if (typeof value === 'object' && value.operation) {
                // For complex filters like { operation: 'gte', value: 10 }
                query = query[value.operation](key, value.value);
            } else {
                query = query.eq(key, value);
            }
        });
        
        // Apply sorting
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { 
                ascending: options.orderBy.ascending !== false 
            });
        }
        
        // Apply pagination
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
        }
        
        const { data, error } = await query;
        return { data, error };
    }

    async getDistinctValues(columnName, limit = 100) {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select(columnName)
            .limit(limit);

        if (error) {
            return { data: null, error };
        }

        // Extract unique values
        const uniqueValues = [...new Set(data.map(row => row[columnName]).filter(val => val !== null))];
        return { data: uniqueValues, error: null };
    }

    // ==================== SCHEMA & METADATA ====================

    async getTableSchema() {
        return await this._getTableSchema();
    }

    async _getTableSchema() {
        this._ensureReady();
        
        const { data, error } = await this.supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default, ordinal_position')
            .eq('table_name', this.tableName)
            .eq('table_schema', 'public')
            .order('ordinal_position');

        return { data, error };
    }

    async getColumnStatistics(columnName) {
        this._ensureReady();
        
        try {
            // Get basic stats using SQL functions
            const { data, error } = await this.supabase.rpc('get_column_stats', {
                table_name: this.tableName,
                column_name: columnName
            });

            if (error) {
                // Fallback to basic queries if custom function doesn't exist
                return await this._getBasicColumnStats(columnName);
            }

            return { data, error };
        } catch (error) {
            return await this._getBasicColumnStats(columnName);
        }
    }

    async _getBasicColumnStats(columnName) {
        const [countRes, distinctRes] = await Promise.all([
            this.getRecordCount(),
            this.getDistinctValues(columnName, 1000)
        ]);

        if (countRes.error || distinctRes.error) {
            return { data: null, error: countRes.error || distinctRes.error };
        }

        const stats = {
            total_count: countRes.count,
            distinct_count: distinctRes.data.length,
            null_count: null, // Would need special query
            sample_values: distinctRes.data.slice(0, 10)
        };

        return { data: stats, error: null };
    }

    // ==================== EXPORT & UTILITY ====================

    async exportToJSON(filters = {}, limit = 1000) {
        const { data, error } = await this.getRecordsWithFilters(filters, { limit });
        
        if (error) {
            return { data: null, error };
        }

        const jsonString = JSON.stringify(data, null, 2);
        return { data: jsonString, error: null };
    }

    async exportToCSV(filters = {}, limit = 1000) {
        const { data, error } = await this.getRecordsWithFilters(filters, { limit });
        
        if (error || !data || data.length === 0) {
            return { data: null, error: error || { message: 'No data to export' } };
        }

        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        return { data: csvContent, error: null };
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================

    subscribeToChanges(callback, eventType = '*') {
        this._ensureReady();
        
        const subscription = this.supabase
            .channel(`df555_data_changes`)
            .on('postgres_changes', {
                event: eventType,
                schema: 'public',
                table: this.tableName
            }, callback)
            .subscribe();
        
        return subscription;
    }

    unsubscribe(subscription) {
        if (subscription) {
            subscription.unsubscribe();
        }
    }

    // ==================== UTILITY METHODS ====================

    formatRecordForDisplay(record) {
        if (!record) return '';
        
        return Object.entries(record)
            .map(([key, value]) => {
                const displayValue = value !== null && value !== undefined ? 
                    (typeof value === 'object' ? JSON.stringify(value) : String(value)) : 'NULL';
                return `${key}: ${displayValue}`;
            })
            .join('\n');
    }

    downloadAsFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Create and export a singleton instance
const df555DataService = new DF555DataService();
window.DF555DataService = df555DataService;