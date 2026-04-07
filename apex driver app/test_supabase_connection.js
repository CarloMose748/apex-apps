// Supabase Database Connection Test
// Copy and paste this into your browser console on the jobs.html page to test your database connection

async function testSupabaseConnection() {
    console.log('🧪 Testing Supabase Connection...');
    console.log('================================');
    
    // Check if Supabase is loaded
    if (!window.supabase) {
        console.error('❌ Supabase client not found. Check if supabase-config.js is loaded.');
        return;
    }
    
    console.log('✅ Supabase client found');
    
    // Check if ApexDriverService is ready
    if (!window.ApexDriverService) {
        console.error('❌ ApexDriverService not found');
        return;
    }
    
    console.log('✅ ApexDriverService found');
    console.log('ApexDriverService ready:', window.ApexDriverService.isReady);
    
    // Test basic connection by checking tables
    try {
        console.log('\n🔍 Testing direct table access...');
        
        // Test 1: Check if we can access the jobs table directly
        const { data: jobsData, error: jobsError } = await window.supabase
            .from('jobs')
            .select(`
                id,
                customer_name,
                customer_phone,
                pickup_address,
                dropoff_address,
                job_type,
                description,
                price,
                estimated_duration,
                status,
                created_at
            `)
            .limit(5);
            
        console.log('📋 Jobs table test:');
        console.log('  Data:', jobsData);
        console.log('  Error:', jobsError);
        console.log('  Count:', jobsData?.length || 0);
        
        // Test 2: Check available jobs specifically
        const { data: availableJobsData, error: availableJobsError } = await window.supabase
            .from('jobs')
            .select(`
                id,
                customer_name,
                pickup_address,
                job_type,
                price,
                status
            `)
            .eq('status', 'available')
            .limit(10);
            
        console.log('\n📋 Available jobs test:');
        console.log('  Data:', availableJobsData);
        console.log('  Error:', availableJobsError);
        console.log('  Count:', availableJobsData?.length || 0);
        
        // Test 3: Check oil collection jobs
        const { data: oilJobsData, error: oilJobsError } = await window.supabase
            .from('oil_collection_jobs')
            .select('*')
            .eq('status', 'available')
            .limit(5);
            
        console.log('\n🛢️ Oil collection jobs test:');
        console.log('  Data:', oilJobsData);
        console.log('  Error:', oilJobsError);
        console.log('  Count:', oilJobsData?.length || 0);
        
        // Test 4: Check if the nearby_jobs function exists
        try {
            const { data: nearbyData, error: nearbyError } = await window.supabase
                .rpc('nearby_jobs', {
                    lat: -29.8587,
                    lng: 31.0218,
                    radius_km: 10.0
                });
                
            console.log('\n📍 Nearby jobs function test (Durban coordinates):');
            console.log('  Data:', nearbyData);
            console.log('  Error:', nearbyError);
            console.log('  Count:', nearbyData?.length || 0);
        } catch (rpcError) {
            console.error('❌ nearby_jobs function error:', rpcError);
        }
        
        // Test 5: Check authentication status
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();
        console.log('\n👤 Authentication test:');
        console.log('  User:', user);
        console.log('  Error:', authError);
        console.log('  Authenticated:', !!user);
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('================================');
        if (jobsData || availableJobsData || oilJobsData) {
            console.log('✅ Database connection working');
            console.log('📋 Total jobs found:', (jobsData?.length || 0));
            console.log('📋 Available jobs found:', (availableJobsData?.length || 0));
            console.log('🛢️ Oil collection jobs found:', (oilJobsData?.length || 0));
        } else {
            console.log('⚠️ No data found in tables');
            console.log('💡 This could mean:');
            console.log('  - Tables are empty (need to run sample_jobs_data.sql)');
            console.log('  - RLS (Row Level Security) is blocking access');
            console.log('  - Database schema not uploaded yet');
        }
        
    } catch (error) {
        console.error('💥 Database test failed:', error);
        console.log('💡 Common issues:');
        console.log('  - Wrong Supabase URL or key in supabase-config.js');
        console.log('  - Database schema not uploaded');
        console.log('  - RLS policies blocking access');
    }
}

// Auto-run the test
testSupabaseConnection();