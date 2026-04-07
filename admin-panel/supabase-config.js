// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://ishhgfitddfeqaatimwl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaGhnZml0ZGRmZXFhYXRpbXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Nzk1MDAsImV4cCI6MjA3MzE1NTUwMH0.VcBhmUFJu6Yi8Kkn8ihn3rNJsgyKsyVD7qpWh_XjRQ8'
};

// Initialize Supabase client (will be available after loading the CDN)
let supabaseClient = null;

// Initialize Supabase when the page loads
function initializeSupabase() {
    // Check if supabase CDN is loaded
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // Make supabase client globally available
        window.supabaseClient = supabaseClient;
        
        console.log('Supabase client initialized successfully');
        console.log('Supabase URL:', SUPABASE_CONFIG.url);
        console.log('Client ready:', !!supabaseClient);
        
        // Trigger custom event to notify other scripts that Supabase is ready
        document.dispatchEvent(new CustomEvent('supabaseReady', { detail: { client: supabaseClient } }));
        
        return true;
    } else {
        console.error('Supabase CDN not loaded. Make sure to include the Supabase script tag.');
        return false;
    }
}

// Try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // DOM is already loaded
    initializeSupabase();
}

// Also try after a short delay to catch any timing issues
setTimeout(() => {
    if (!window.supabaseClient) {
        console.log('Retry supabase initialization...');
        initializeSupabase();
    }
}, 1000);

// Utility functions for common Supabase operations
const SupabaseUtils = {
    // Wait for Supabase to be ready
    async _ensureReady() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait time
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
            attempts++;
        }
        
        if (!window.supabaseClient) {
            throw new Error('Supabase not initialized after waiting 5 seconds');
        }
        
        return window.supabaseClient;
    },

    // Authentication
    async signUp(email, password, additionalData = {}) {
        const client = await this._ensureReady();
        
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: additionalData
            }
        });
        
        return { data, error };
    },

    async signIn(email, password) {
        const client = await this._ensureReady();
        
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        return { data, error };
    },

    async signOut() {
        const client = await this._ensureReady();
        
        const { error } = await client.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        const client = await this._ensureReady();
        
        const { data: { user }, error } = await client.auth.getUser();
        return { user, error };
    },

    // Database operations
    async insertRecord(table, data) {
        const client = await this._ensureReady();
        
        const { data: result, error } = await client
            .from(table)
            .insert(data)
            .select();
        
        return { data: result, error };
    },

    async selectRecords(table, filters = {}, options = {}) {
        const client = await this._ensureReady();
        
        let query = client.from(table).select(options.select || '*');
        
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
        const client = await this._ensureReady();
        
        const { data, error } = await client
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        
        return { data, error };
    },

    async deleteRecord(table, id) {
        const client = await this._ensureReady();
        
        const { data, error } = await client
            .from(table)
            .delete()
            .eq('id', id);
        
        return { data, error };
    },

    // Real-time subscriptions
    async subscribeToTable(table, callback, filter = '*') {
        const client = await this._ensureReady();
        
        const subscription = client
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
        const client = await this._ensureReady();
        
        const { data, error } = await client.storage
            .from(bucket)
            .upload(path, file);
        
        return { data, error };
    },

    async downloadFile(bucket, path) {
        const client = await this._ensureReady();
        
        const { data, error } = await client.storage
            .from(bucket)
            .download(path);
        
        return { data, error };
    },

    async getPublicUrl(bucket, path) {
        const client = await this._ensureReady();
        
        const { data } = client.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};

// Export for use in other files
window.SupabaseUtils = SupabaseUtils;
window.getSupabaseClient = () => window.supabaseClient;