// =====================================================
// SUPABASE CONFIGURATION TEMPLATE
// =====================================================
// This is a template for your Supabase configuration.
// Copy this file and rename to 'supabase-config.js'
// Then fill in your actual Supabase credentials.
// =====================================================

// STEP 1: Get your Supabase credentials
// ---------------------------------------
// 1. Go to your Supabase project dashboard
// 2. Click "Settings" (gear icon in left sidebar)
// 3. Click "API" in the settings menu
// 4. Copy the values below:

const SUPABASE_CONFIG = {
    // Project URL - Found in Settings → API → Project URL
    // Example: 'https://xyzcompany.supabase.co'
    url: 'YOUR_SUPABASE_PROJECT_URL',
    
    // Anon/Public Key - Found in Settings → API → Project API keys → anon public
    // Example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    // ⚠️ This key is safe to use in client-side code
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// =====================================================
// DO NOT MODIFY BELOW THIS LINE
// =====================================================

let supabase = null;

function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        window.supabaseClient = supabase;
        window.supabase = supabase;
        
        console.log('Supabase client initialized successfully');
        console.log('Supabase URL:', SUPABASE_CONFIG.url);
        console.log('Client ready:', !!supabase);
        
        document.dispatchEvent(new CustomEvent('supabaseReady', { detail: { client: supabase } }));
        
        return true;
    } else {
        console.error('Supabase CDN not loaded. Make sure to include the Supabase script tag.');
        return false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}

setTimeout(() => {
    if (!window.supabaseClient) {
        console.log('Retry supabase initialization...');
        initializeSupabase();
    }
}, 1000);

const SupabaseUtils = {
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
        
        Object.entries(filters).forEach(([key, value]) => {
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
                query = query[value.operation](key, value.value);
            } else {
                query = query.eq(key, value);
            }
        });
        
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

window.SupabaseUtils = SupabaseUtils;
window.getSupabaseClient = () => supabase;

// =====================================================
// CONFIGURATION CHECKLIST
// =====================================================
// ✅ Replace YOUR_SUPABASE_PROJECT_URL with your URL
// ✅ Replace YOUR_SUPABASE_ANON_KEY with your anon key
// ✅ Save this file as 'supabase-config.js'
// ✅ Include in HTML: <script src="supabase-config.js"></script>
// ✅ Test by opening browser console and checking for
//    "Supabase client initialized successfully"
// =====================================================
