// Authentication Service
// This module handles user authentication, session management, and route protection

class AuthService {
    constructor() {
        this.supabase = null;
        this.isReady = false;
        this.currentUser = null;
        this.authListeners = [];
        
        // Listen for Supabase to be ready
        document.addEventListener('supabaseReady', (event) => {
            this.supabase = event.detail.client;
            this.isReady = true;
            console.log('AuthService: Supabase client ready');
            this.initializeAuth();
        });
    }

    // Ensure Supabase is ready before operations
    _ensureReady() {
        if (!this.isReady || !this.supabase) {
            throw new Error('AuthService: Supabase not ready. Make sure supabase-config.js is loaded first.');
        }
    }

    // Initialize authentication state
    async initializeAuth() {
        this._ensureReady();
        
        try {
            // Get current user
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (user) {
                this.currentUser = user;
                this._notifyAuthListeners('SIGNED_IN', user);
            }

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                
                switch (event) {
                    case 'SIGNED_IN':
                        this.currentUser = session?.user || null;
                        this._updateLocalStorage(session?.user);
                        this._notifyAuthListeners('SIGNED_IN', session?.user);
                        break;
                        
                    case 'SIGNED_OUT':
                        this.currentUser = null;
                        this._clearLocalStorage();
                        this._notifyAuthListeners('SIGNED_OUT', null);
                        break;
                        
                    case 'TOKEN_REFRESHED':
                        this.currentUser = session?.user || null;
                        this._updateLocalStorage(session?.user);
                        break;
                        
                    case 'USER_UPDATED':
                        this.currentUser = session?.user || null;
                        this._updateLocalStorage(session?.user);
                        this._notifyAuthListeners('USER_UPDATED', session?.user);
                        break;
                }
            });

        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    }

    // ==================== AUTHENTICATION METHODS ====================

    async signUp(email, password, metadata = {}) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        return { data, error };
    }

    async signIn(email, password) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        return { data, error };
    }

    async signOut() {
        this._ensureReady();
        
        try {
            // Sign out from Supabase
            const { error } = await this.supabase.auth.signOut();
            
            // Clear local state
            this.currentUser = null;
            this._clearLocalStorage();
            
            // Notify listeners
            this._notifyAuthListeners('SIGNED_OUT', null);
            
            console.log('User signed out successfully');
            return { error };
        } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
            
            // Even if Supabase sign out fails, clear local state
            this.currentUser = null;
            this._clearLocalStorage();
            this._notifyAuthListeners('SIGNED_OUT', null);
            
            return { error: signOutError };
        }
    }

    async signInWithOAuth(provider, options = {}) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: options.redirectTo || `${window.location.origin}/main.html`,
                ...options
            }
        });
        
        return { data, error };
    }

    async resetPassword(email, redirectTo = null) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo || `${window.location.origin}/auth.html`
        });
        
        return { data, error };
    }

    async updatePassword(newPassword) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.updateUser({
            password: newPassword
        });
        
        return { data, error };
    }

    async updateProfile(updates) {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.updateUser({
            data: updates
        });
        
        return { data, error };
    }

    // ==================== USER INFORMATION ====================

    getCurrentUser() {
        return this.currentUser;
    }

    async refreshUser() {
        this._ensureReady();
        
        const { data: { user }, error } = await this.supabase.auth.getUser();
        
        if (user) {
            this.currentUser = user;
        }
        
        return { user, error };
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getUserType() {
        return this.currentUser?.user_metadata?.user_type || null;
    }

    getUserEmail() {
        return this.currentUser?.email || null;
    }

    getUserId() {
        return this.currentUser?.id || null;
    }

    getUserMetadata() {
        return this.currentUser?.user_metadata || {};
    }

    isDriver() {
        return this.getUserType() === 'driver';
    }

    isCustomer() {
        return this.getUserType() === 'customer';
    }

    // ==================== SESSION MANAGEMENT ====================

    async getSession() {
        this._ensureReady();
        
        const { data: { session }, error } = await this.supabase.auth.getSession();
        return { session, error };
    }

    async refreshSession() {
        this._ensureReady();
        
        const { data, error } = await this.supabase.auth.refreshSession();
        return { data, error };
    }

    // ==================== ROUTE PROTECTION ====================

    requireAuth(redirectUrl = 'auth.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    requireDriver(redirectUrl = 'auth.html') {
        if (!this.isAuthenticated() || !this.isDriver()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    requireCustomer(redirectUrl = 'auth.html') {
        if (!this.isAuthenticated() || !this.isCustomer()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Check auth with async support for initialization
    async checkAuth(redirectUrl = 'auth.html') {
        // Wait for auth to initialize if not ready
        if (!this.isReady) {
            await this._waitForReady();
        }

        // Refresh user data to ensure we have latest info
        await this.refreshUser();

        return this.requireAuth(redirectUrl);
    }

    async _waitForReady(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.isReady) {
                resolve();
                return;
            }

            const checkReady = () => {
                if (this.isReady) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };

            setTimeout(() => reject(new Error('Auth service timeout')), timeout);
            checkReady();
        });
    }

    // ==================== EVENT LISTENERS ====================

    onAuthStateChange(callback) {
        this.authListeners.push(callback);
        
        // If already authenticated, call immediately
        if (this.currentUser) {
            callback('SIGNED_IN', this.currentUser);
        }
        
        // Return unsubscribe function
        return () => {
            this.authListeners = this.authListeners.filter(listener => listener !== callback);
        };
    }

    _notifyAuthListeners(event, user) {
        this.authListeners.forEach(callback => {
            try {
                callback(event, user);
            } catch (error) {
                console.error('Error in auth listener:', error);
            }
        });
    }

    // ==================== LOCAL STORAGE MANAGEMENT ====================

    _updateLocalStorage(user) {
        if (user) {
            const userData = {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                last_sign_in_at: user.last_sign_in_at
            };
            localStorage.setItem('apex_user', JSON.stringify(userData));
        }
    }

    _clearLocalStorage() {
        localStorage.removeItem('apex_user');
        localStorage.removeItem('driverId'); // Clear any driver-specific data
    }

    getStoredUser() {
        try {
            const stored = localStorage.getItem('apex_user');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error parsing stored user:', error);
            return null;
        }
    }

    // ==================== UTILITY METHODS ====================

    // Check if email is verified
    isEmailVerified() {
        return this.currentUser?.email_confirmed_at !== null;
    }

    // Get user's display name
    getDisplayName() {
        const metadata = this.getUserMetadata();
        return metadata.full_name || metadata.name || this.getUserEmail() || 'User';
    }

    // Format user info for display
    async formatUserInfo() {
        if (!this.currentUser) return null;

        const metadata = this.getUserMetadata();
        const baseInfo = {
            id: this.getUserId(),
            email: this.getUserEmail(),
            name: this.getDisplayName(),
            userType: this.getUserType(),
            phoneNumber: metadata.phone_number,
            vehicleType: metadata.vehicle_type,
            licenseNumber: metadata.license_number,
            emailVerified: this.isEmailVerified(),
            lastSignIn: this.currentUser.last_sign_in_at,
            verificationStatus: metadata.verification_status || 'pending',
            isVerified: (metadata.verification_status === 'approved')
        };

        // For more accurate verification status, check database tables
        try {
            let dbVerificationStatus = 'pending';
            
            // Check if user is admin first
            const { data: adminData, error: adminError } = await SupabaseUtils.selectRecords('admins', { 
                email: this.getUserEmail(),
                status: 'active'
            }, { limit: 1 });

            if (!adminError && adminData && adminData.length > 0) {
                // User is admin, they are automatically verified
                return {
                    ...baseInfo,
                    verificationStatus: 'approved',
                    isVerified: true,
                    userType: 'admin',
                    isAdmin: true
                };
            }

            // Check driver table
            if (baseInfo.userType === 'driver') {
                const { data: driverData, error: driverError } = await SupabaseUtils.selectRecords('drivers', { 
                    email: this.getUserEmail() 
                }, { limit: 1 });

                if (!driverError && driverData && driverData.length > 0) {
                    dbVerificationStatus = driverData[0].verification_status || 'pending';
                }
            }
            // Check customer table
            else if (baseInfo.userType === 'customer') {
                const { data: customerData, error: customerError } = await SupabaseUtils.selectRecords('customers', { 
                    email: this.getUserEmail() 
                }, { limit: 1 });

                if (!customerError && customerData && customerData.length > 0) {
                    dbVerificationStatus = customerData[0].verification_status || 'pending';
                }
            }

            // Update with database verification status
            return {
                ...baseInfo,
                verificationStatus: dbVerificationStatus,
                isVerified: (dbVerificationStatus === 'approved')
            };

        } catch (error) {
            console.error('Error checking database verification status:', error);
            // Return basic info if database check fails
            return baseInfo;
        }
    }

    // Check if user is verified for platform access
    async isUserVerified() {
        const userInfo = await this.formatUserInfo();
        return userInfo && (userInfo.isVerified || userInfo.isAdmin);
    }

    // Get verification status
    async getVerificationStatus() {
        const userInfo = await this.formatUserInfo();
        return userInfo ? userInfo.verificationStatus : 'pending';
    }

    // Debug method
    debugAuth() {
        console.log('Auth Debug Info:', {
            isReady: this.isReady,
            isAuthenticated: this.isAuthenticated(),
            currentUser: this.currentUser,
            userType: this.getUserType(),
            storedUser: this.getStoredUser()
        });
    }
}

// Create and export a singleton instance
const authService = new AuthService();

// Global auth utilities for backward compatibility
window.AuthService = authService;
window.authService = authService;  // Also expose lowercase version
window.requireAuth = (redirectUrl) => authService.requireAuth(redirectUrl);
window.requireDriver = (redirectUrl) => authService.requireDriver(redirectUrl);
window.requireCustomer = (redirectUrl) => authService.requireCustomer(redirectUrl);

// Global auth check function
window.checkAuth = async (redirectUrl) => {
    try {
        const authResult = await authService.checkAuth(redirectUrl);
        if (!authResult) return false;

        // Check if user is verified (skip for certain pages)
        const currentPage = window.location.pathname.split('/').pop();
        const skipVerificationPages = ['admin.html', 'auth.html', 'profile.html', 'verification-pending.html', 'test.html'];
        
        if (!skipVerificationPages.includes(currentPage)) {
            const userInfo = await authService.formatUserInfo();
            if (userInfo && !userInfo.isVerified && !userInfo.isAdmin) {
                console.log('User not verified, redirecting to verification pending...');
                window.location.href = 'verification-pending.html';
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = redirectUrl || 'auth.html';
        return false;
    }
};

// Global logout handler
window.handleLogout = async () => {
    try {
        await authService.signOut();
        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'auth.html';
    }
};

// Export auth service instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
}