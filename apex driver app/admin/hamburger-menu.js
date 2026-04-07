// Hamburger Menu Component - Professional Mobile Navigation
// This component provides a consistent navigation experience across all pages

class HamburgerMenu {
    constructor() {
        this.isOpen = false;
        this.currentPage = this.getCurrentPage();
        this.isInitialized = false;
        
        // Initialize immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM is already ready, initialize immediately
            this.init();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return page.replace('.html', '');
    }

    init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.log('Hamburger menu already initialized');
            return;
        }
        
        try {
            console.log('Initializing hamburger menu...');
            this.createMenuHTML();
            this.attachEventListeners();
            this.setActiveMenuItem();
            this.isInitialized = true;
            console.log('Hamburger menu initialized successfully');
        } catch (error) {
            console.error('Error initializing hamburger menu:', error);
            this.isInitialized = false;
        }
    }

    createMenuHTML() {
        // Create hamburger menu HTML
        const menuHTML = `
            <!-- Hamburger Menu Button -->
            <div class="hamburger-menu" id="hamburgerMenu">
                <button class="hamburger-toggle" id="hamburgerToggle" aria-label="Open navigation menu">
                    <div class="hamburger-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
            </div>

            <!-- Mobile Menu Overlay -->
            <div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>

            <!-- Mobile Menu Panel -->
            <div class="mobile-menu" id="mobileMenu">
                <div class="mobile-menu-header">
                    <h2 class="mobile-menu-title">🛢️ Apex Oil Collector</h2>
                    <p class="mobile-menu-subtitle">Professional Oil Collection Service</p>
                </div>

                <div class="mobile-menu-content">
                    <!-- Main Navigation -->
                    <div class="mobile-menu-section">
                        <h3 class="mobile-menu-section-title">Navigation</h3>
                        <a href="main.html" class="mobile-menu-item" data-page="main">
                            <span class="mobile-menu-item-icon">🏠</span>
                            Home
                        </a>
                        <a href="dashboard.html" class="mobile-menu-item" data-page="dashboard">
                            <span class="mobile-menu-item-icon">📊</span>
                            Dashboard
                            <span class="mobile-menu-badge badge-primary" id="dashboardBadge" style="display: none;">New</span>
                        </a>
                        <a href="jobs.html" class="mobile-menu-item" data-page="jobs">
                            <span class="mobile-menu-item-icon">📋</span>
                            Available Jobs
                            <span class="mobile-menu-badge" id="jobsBadge" style="display: none;">0</span>
                        </a>
                        <a href="map.html" class="mobile-menu-item" data-page="map">
                            <span class="mobile-menu-item-icon">🗺️</span>
                            Map View
                        </a>
                    </div>

                    <!-- Oil Collection -->
                    <div class="mobile-menu-section">
                        <h3 class="mobile-menu-section-title">Oil Collection</h3>
                        <a href="oil-collection.html" class="mobile-menu-item" data-page="oil-collection">
                            <span class="mobile-menu-item-icon">🛢️</span>
                            Record Collection
                        </a>
                        <a href="job-detail.html" class="mobile-menu-item" data-page="job-detail">
                            <span class="mobile-menu-item-icon">📄</span>
                            Job Details
                        </a>
                    </div>

                    <!-- Account -->
                    <div class="mobile-menu-section">
                        <h3 class="mobile-menu-section-title">Account</h3>
                        <a href="profile.html" class="mobile-menu-item" data-page="profile">
                            <span class="mobile-menu-item-icon">👤</span>
                            Profile
                        </a>
                        <a href="verification-pending.html" class="mobile-menu-item" data-page="verification-pending">
                            <span class="mobile-menu-item-icon">⏳</span>
                            Verification
                            <span class="mobile-menu-badge badge-warning" id="verificationBadge" style="display: none;">Pending</span>
                        </a>
                    </div>

                    <!-- Admin (conditionally shown) -->
                    <div class="mobile-menu-section" id="adminSection" style="display: none;">
                        <h3 class="mobile-menu-section-title">Administration</h3>
                        <a href="admin.html" class="mobile-menu-item" data-page="admin">
                            <span class="mobile-menu-item-icon">⚙️</span>
                            Admin Panel
                        </a>
                    </div>
                </div>

                <div class="mobile-menu-footer">
                    <div class="mobile-menu-user" id="mobileMenuUser">
                        <div class="mobile-menu-avatar" id="mobileMenuAvatar">U</div>
                        <div class="mobile-menu-user-info">
                            <p class="mobile-menu-user-name" id="mobileMenuUserName">Loading...</p>
                            <p class="mobile-menu-user-role" id="mobileMenuUserRole">Driver</p>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-small" onclick="handleLogout()" style="width: 100%;">
                        <span>🚪</span>
                        Sign Out
                    </button>
                </div>
            </div>
        `;

        // Insert menu HTML into the designated container
        const menuContainer = document.getElementById('hamburger-menu');
        if (menuContainer) {
            menuContainer.innerHTML = menuHTML;
            console.log('Menu HTML inserted into hamburger-menu container');
        } else {
            // Fallback: insert into body if container not found
            console.warn('hamburger-menu container not found, inserting into body');
            document.body.insertAdjacentHTML('afterbegin', `<div id="hamburger-menu">${menuHTML}</div>`);
        }
    }

    attachEventListeners() {
        const hamburgerToggle = document.getElementById('hamburgerToggle');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const mobileMenu = document.getElementById('mobileMenu');

        // Check if elements exist before attaching listeners
        if (!hamburgerToggle || !mobileMenuOverlay || !mobileMenu) {
            console.error('Hamburger menu elements not found in DOM');
            return;
        }

        // Toggle menu
        hamburgerToggle.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking overlay
        mobileMenuOverlay.addEventListener('click', () => this.closeMenu());

        // Close menu when clicking a navigation item
        const menuItems = document.querySelectorAll('.mobile-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Add a small delay to allow the page transition to start
                setTimeout(() => this.closeMenu(), 100);
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburgerToggle = document.getElementById('hamburgerToggle');

        hamburgerMenu.classList.add('menu-open');
        mobileMenuOverlay.classList.add('show');
        mobileMenu.classList.add('show');
        
        // Update accessibility
        hamburgerToggle.setAttribute('aria-label', 'Close navigation menu');
        hamburgerToggle.setAttribute('aria-expanded', 'true');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        mobileMenu.focus();
        
        // Load user info
        this.loadUserInfo();
        this.updateBadges();
    }

    closeMenu() {
        this.isOpen = false;
        
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburgerToggle = document.getElementById('hamburgerToggle');

        hamburgerMenu.classList.remove('menu-open');
        mobileMenuOverlay.classList.remove('show');
        mobileMenu.classList.remove('show');
        
        // Update accessibility
        hamburgerToggle.setAttribute('aria-label', 'Open navigation menu');
        hamburgerToggle.setAttribute('aria-expanded', 'false');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    setActiveMenuItem() {
        // Remove any existing active states
        document.querySelectorAll('.mobile-menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active state for current page
        const currentPageItem = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (currentPageItem) {
            currentPageItem.classList.add('active');
        }
    }

    async loadUserInfo() {
        try {
            // Try to get user info from AuthService if available
            if (typeof window !== 'undefined' && window.AuthService && typeof window.AuthService.getCurrentUser === 'function') {
                const user = window.AuthService.getCurrentUser();
                if (user) {
                    let userInfo = null;
                    
                    // Check if formatUserInfo method exists
                    if (typeof window.AuthService.formatUserInfo === 'function') {
                        userInfo = await window.AuthService.formatUserInfo();
                    }
                    
                    const nameElement = document.getElementById('mobileMenuUserName');
                    const roleElement = document.getElementById('mobileMenuUserRole');
                    const avatarElement = document.getElementById('mobileMenuAvatar');
                    
                    if (nameElement && roleElement && avatarElement) {
                        if (userInfo) {
                            nameElement.textContent = userInfo.name || user.email || 'User';
                            roleElement.textContent = (userInfo.userType || 'driver').toUpperCase();
                            
                            // Set avatar initial
                            const initial = (userInfo.name || user.email || 'U').charAt(0).toUpperCase();
                            avatarElement.textContent = initial;
                            
                            // Show admin section if user is admin
                            if (userInfo.userType === 'admin' || userInfo.isAdmin) {
                                const adminSection = document.getElementById('adminSection');
                                if (adminSection) {
                                    adminSection.style.display = 'block';
                                }
                            }
                        } else {
                            nameElement.textContent = user.email || 'User';
                            roleElement.textContent = 'DRIVER';
                            avatarElement.textContent = (user.email || 'U').charAt(0).toUpperCase();
                        }
                    }
                }
            } else {
                // Fallback to localStorage or default values
                this.loadUserInfoFromStorage();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            this.loadUserInfoFromStorage();
        }
    }

    loadUserInfoFromStorage() {
        const nameElement = document.getElementById('mobileMenuUserName');
        const roleElement = document.getElementById('mobileMenuUserRole');
        const avatarElement = document.getElementById('mobileMenuAvatar');
        
        // Try to get from localStorage or use defaults
        const userName = localStorage.getItem('userName') || 'Driver';
        const userRole = localStorage.getItem('userRole') || 'DRIVER';
        
        nameElement.textContent = userName;
        roleElement.textContent = userRole;
        avatarElement.textContent = userName.charAt(0).toUpperCase();
    }

    updateBadges() {
        // Update job count badge
        try {
            const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
            const availableJobs = jobs.filter(job => job.status === 'available');
            
            const jobsBadge = document.getElementById('jobsBadge');
            if (availableJobs.length > 0) {
                jobsBadge.textContent = availableJobs.length;
                jobsBadge.style.display = 'flex';
            } else {
                jobsBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating job badge:', error);
        }

        // Update verification badge (if user needs verification)
        const verificationStatus = localStorage.getItem('verificationStatus');
        const verificationBadge = document.getElementById('verificationBadge');
        
        if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
            verificationBadge.style.display = 'flex';
            verificationBadge.textContent = verificationStatus === 'pending' ? 'Pending' : 'Review';
        } else {
            verificationBadge.style.display = 'none';
        }
    }

    // Public method to refresh menu data
    refresh() {
        this.setActiveMenuItem();
        if (this.isOpen) {
            this.loadUserInfo();
            this.updateBadges();
        }
    }

    // Public method to force reinitialization (useful for debugging)
    forceInit() {
        this.isInitialized = false;
        this.init();
    }

    // Public method to show notification badge
    showNotificationBadge(itemId, count = 1, type = 'primary') {
        const badge = document.getElementById(itemId + 'Badge');
        if (badge) {
            badge.textContent = count;
            badge.className = `mobile-menu-badge badge-${type}`;
            badge.style.display = 'flex';
        }
    }

    // Public method to hide notification badge
    hideNotificationBadge(itemId) {
        const badge = document.getElementById(itemId + 'Badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// Global logout function for consistency
function handleLogout() {
    if (window.AuthService && typeof window.AuthService.logout === 'function') {
        window.AuthService.logout();
    } else {
        // Fallback logout
        localStorage.clear();
        window.location.href = 'auth.html?logout=true';
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HamburgerMenu;
}