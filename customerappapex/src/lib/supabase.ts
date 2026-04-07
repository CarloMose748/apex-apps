import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import type { AuthState } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton pattern - only create one client instance
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// Flag to suppress onAuthStateChange during role validation
let _suppressAuthEvents = false;
export const setSuppressAuthEvents = (val: boolean) => { _suppressAuthEvents = val; };
export const isSuppressingAuthEvents = () => _suppressAuthEvents;

// Auth helper functions
export const getSession = async () => {
  if (!supabase) return null;
  
  try {
    // Get the stored session without refreshing first
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const signInWithPassword = async (email: string, password: string) => {
  if (!supabase) {
    // Demo mode - accept any email/password
    if (email && password) {
      return { 
        data: { 
          user: { 
            id: 'demo-user', 
            email, 
            user_metadata: { name: 'Demo User', role: 'manager' } 
          } 
        }, 
        error: null 
      };
    }
    return { data: null, error: 'Invalid credentials' };
  }
  
  try {
    _suppressAuthEvents = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // ROLE-BASED ACCESS CONTROL: Check if user has customer platform access
    // Graceful: if tables don't exist or have no data, allow login
    if (data.user) {
      try {
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('platform, platform_role, status')
          .eq('user_id', data.user.id)
          .eq('platform', 'customer')
          .maybeSingle();

        // If table doesn't exist (code 42P01) or RLS blocks access, skip role check
        if (roleError) {
          console.warn('Role check skipped:', roleError.message);
        } else if (userRole) {
          // Role row exists — enforce status
          if (userRole.status !== 'active') {
            await supabase.auth.signOut();
            const statusMessage = userRole.status === 'pending' 
              ? 'Your customer account is pending admin approval. Please wait for activation before logging in.' 
              : `Your customer account is ${userRole.status}. Please contact administrator.`;
            return { data: null, error: statusMessage };
          }
        }
        // If no role row found, allow login (table may not be set up yet)
      } catch (roleCheckErr) {
        console.warn('Role check error, allowing login:', roleCheckErr);
      }

      try {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('verification_status')
          .eq('id', data.user.id)
          .maybeSingle();

        if (customerError) {
          console.warn('Customer check skipped:', customerError.message);
        } else if (customerData && customerData.verification_status && customerData.verification_status !== 'approved') {
          await supabase.auth.signOut();
          return { 
            data: null, 
            error: 'Your account is pending admin approval. Please wait for activation before logging in.' 
          };
        }
        // If no customer row or no verification_status, allow login
      } catch (custCheckErr) {
        console.warn('Customer check error, allowing login:', custCheckErr);
      }
    }

    _suppressAuthEvents = false;
    return { data, error: null };
  } catch (error) {
    _suppressAuthEvents = false;
    console.error('Error signing in:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const signInWithOtp = async (email: string) => {
  if (!supabase) {
    // Demo mode - simulate magic link
    return { data: { user: null }, error: null };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error sending magic link:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const signOut = async () => {
  if (!supabase) {
    // Demo mode - just clear demo session
    localStorage.removeItem('demo-session');
    return { error: null };
  }
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const signUpCustomer = async (customerData: {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  business_name?: string;
  business_type?: string;
  business_registration?: string;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  if (!supabase) {
    // Demo mode - simulate successful signup
    return { 
      data: { 
        user: { 
          id: 'demo-customer-' + Date.now(), 
          email: customerData.email,
          user_metadata: { 
            name: customerData.full_name, 
            role: 'customer' 
          } 
        } 
      }, 
      error: null 
    };
  }

  try {
    // Check if user already has a customer role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id, status')
      .eq('email', customerData.email.toLowerCase())
      .eq('platform', 'customer')
      .maybeSingle();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      console.error('Error checking existing role:', roleCheckError);
    }

    if (existingRole) {
      return { 
        data: null, 
        error: 'This email is already registered for the customer portal. Please log in instead.' 
      };
    }

    // 1. First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: customerData.email,
      password: customerData.password,
      options: {
        data: {
          name: customerData.full_name,
          role: 'customer',
          platform: 'customer'
        }
      }
    });

    if (authError) throw authError;

    // 2. Then create the customer record in the customers table
    if (authData.user) {
      const customerRecord: any = {
        id: authData.user.id,
        email: customerData.email,
        full_name: customerData.full_name,
        phone_number: customerData.phone_number || null,
        address: customerData.address || null,
        business_name: customerData.business_name || null,
        business_type: customerData.business_type || null,
        business_registration: customerData.business_registration || null,
        verification_status: 'pending',
        status: 'pending',
        total_orders: 0
      };

      // Add location as PostGIS point if coordinates are provided
      if (customerData.latitude && customerData.longitude) {
        customerRecord.location = `POINT(${customerData.longitude} ${customerData.latitude})`;
      }

      console.log('Attempting to insert customer record:', customerRecord);

      const { data: insertData, error: customerError } = await supabase
        .from('customers')
        .insert(customerRecord)
        .select();

      if (customerError) {
        console.error('Error creating customer record:', customerError);
        console.error('Customer record that failed:', customerRecord);
        // Note: Auth user was created but customer record failed
        // In production, you might want to handle this differently
        throw new Error(`Failed to create customer profile: ${customerError.message}`);
      }

      console.log('Customer record created successfully:', insertData);

      // 3. Create user role for customer platform
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          email: customerData.email.toLowerCase(),
          platform: 'customer',
          platform_role: 'customer',
          status: 'pending', // Will be set to 'active' when admin approves
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // Continue anyway - role can be added later during migration
      } else {
        console.log('User role created successfully for customer platform');
      }
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Error signing up customer:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Mock data for development
export const useMockData = () => {
  return import.meta.env.VITE_USE_MOCK === '1' || !supabaseUrl || !supabaseAnonKey;
};

// Data fetching helpers
export const fetchWithAuth = async (table: string, options: any = {}) => {
  if (useMockData()) {
    return { data: [], error: null };
  }

  if (!supabase) {
    return { data: [], error: 'No database connection' };
  }

  try {
    let query = supabase.from(table).select(options.select || '*');
    
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Auth state management
export const useAuthState = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    if (!supabase) {
      // Demo mode - check for demo session
      const demoSession = localStorage.getItem('demo-session');
      if (demoSession) {
        const user = JSON.parse(demoSession);
        setAuthState({
          user,
          session: { user },
          loading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    // Rely on onAuthStateChange - it's more reliable than getSession
    // The listener will fire immediately with the current session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        console.log('[Auth] Auth state changed:', _event, !!session, 'suppressed:', _suppressAuthEvents);
        if (_suppressAuthEvents && _event === 'SIGNED_IN') {
          return; // Skip - role validation in progress
        }
        if (!session) {
          setAuthState({ user: null, session: null, loading: false });
          return;
        }
        
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'manager',
        };
        setAuthState({ user, session, loading: false });
      }
    );
    
    // Fallback timeout - if onAuthStateChange doesn't fire within 2 seconds, stop loading
    const fallbackTimer = setTimeout(() => {
      setAuthState(prev => {
        if (prev.loading) {
          console.log('[Auth] Fallback timeout - stopping loading');
          return { user: null, session: null, loading: false };
        }
        return prev;
      });
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return authState;
};