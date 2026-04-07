// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://ishhgfitddfeqaatimwl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaGhnZml0ZGRmZXFhYXRpbXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Nzk1MDAsImV4cCI6MjA3MzE1NTUwMH0.VcBhmUFJu6Yi8Kkn8ihn3rNJsgyKsyVD7qpWh_XjRQ8'
};

// Initialize Supabase client (will be available after loading the CDN)
let supabase = null;

// Initialize Supabase when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if supabase is loaded from CDN
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase client initialized successfully');
        
        // Trigger custom event to notify other scripts that Supabase is ready
        document.dispatchEvent(new CustomEvent('supabaseReady', { detail: { client: supabase } }));
    } else {
        console.error('Supabase CDN not loaded. Make sure to include the Supabase script tag.');
    }
});

// Utility functions for common Supabase operations
const SupabaseUtils = {
    // Authentication
    async signUp(email, password, additionalData = {}) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: additionalData
            }
        });
        
        return { data, error };
    },

    async signIn(email, password) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        return { data, error };
    },

    async signOut() {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Database operations
    async insertRecord(table, data) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();
        
        return { data: result, error };
    },

    async selectRecords(table, filters = {}, options = {}) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        let query = supabase.from(table).select(options.select || '*');
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            // Skip undefined or null keys/values
            if (key === undefined || key === null || key === 'undefined') {
                console.warn('Skipping undefined filter key:', key, value);
                return;
            }
            if (value === undefined) {
                console.warn('Skipping undefined filter value for key:', key);
                return;
            }
            
            if (Array.isArray(value)) {
                query = query.in(key, value);
            } else if (typeof value === 'object' && value !== null && value.operation) {
                // For complex filters like { operation: 'gte', value: 10 }
                query = query[value.operation](key, value.value);
            } else {
                query = query.eq(key, value);
            }
        });
        
        // Apply options
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        return { data, error };
    },

    async updateRecord(table, id, updates) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        
        return { data, error };
    },

    async deleteRecord(table, id) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        
        return { data, error };
    },

    // Real-time subscriptions
    subscribeToTable(table, callback, filter = '*') {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const subscription = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', {
                event: filter,
                schema: 'public',
                table: table
            }, callback)
            .subscribe();
        
        return subscription;
    },

    // Storage operations
    async uploadFile(bucket, path, file) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file);
        
        return { data, error };
    },

    async downloadFile(bucket, path) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);
        
        return { data, error };
    },

    getPublicUrl(bucket, path) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};

// Export for use in other files
window.SupabaseUtils = SupabaseUtils;
window.getSupabaseClient = () => supabase;