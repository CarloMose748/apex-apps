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
            this.updateBottomNavBadges();
            this.isInitialized = true;
            console.log('Hamburger menu initialized successfully');
        } catch (error) {
            console.error('Error initializing hamburger menu:', error);
            this.isInitialized = false;
        }
    }

    createMenuHTML() {
        // Create hamburger menu HTML with SVG icons (simplified menu)
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
                    <h2 class="mobile-menu-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: var(--primary-color);">
                            <path d="M3 4h4v4H3V4zm0 6h4v4H3v-4zm0 6h4v4H3v-4zm6-12h4v4H9V4zm0 6h4v4H9v-4zm0 6h4v4H9v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z"/>
                        </svg>
                        Apex Oil Collector
                    </h2>
                    <p class="mobile-menu-subtitle">Professional Oil Collection Service</p>
                </div>

                <div class="mobile-menu-content">
                    <!-- Admin (conditionally shown) -->
                    <div class="mobile-menu-section" id="adminSection" style="display: none;">
                        <h3 class="mobile-menu-section-title">Administration</h3>
                        <a href="admin.html" class="mobile-menu-item" data-page="admin">
                            <svg class="mobile-menu-item-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
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
                    
                    <button class="btn btn-outline btn-small logout-menu-btn" onclick="handleLogout()" style="width: 100%;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>

            <!-- Bottom Navigation Bar -->
            <nav class="bottom-nav" id="bottomNav">
                <a href="main.html" class="bottom-nav-item" data-page="main">
                    <svg class="bottom-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span class="bottom-nav-label">Home</span>
                </a>
                <a href="jobs.html" class="bottom-nav-item" data-page="jobs">
                    <svg class="bottom-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <span class="bottom-nav-label">Jobs</span>
                    <span class="bottom-nav-badge" id="bottomJobsBadge" style="display: none;">0</span>
                </a>
                <a href="my-jobs.html" class="bottom-nav-item" data-page="my-jobs">
                    <svg class="bottom-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    <span class="bottom-nav-label">My Jobs</span>
                    <span class="bottom-nav-badge badge-info" id="bottomMyJobsBadge" style="display: none;">0</span>
                </a>
                <a href="profile.html" class="bottom-nav-item" data-page="profile">
                    <svg class="bottom-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span class="bottom-nav-label">Profile</span>
                </a>
            </nav>
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
        
        // Set active state for bottom nav
        this.setActiveBottomNav();
    }
    
    setActiveBottomNav() {
        // Remove any existing active states
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active state for current page
        const currentPageItem = document.querySelector(`.bottom-nav-item[data-page="${this.currentPage}"]`);
        if (currentPageItem) {
            currentPageItem.classList.add('active');
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
        const currentPageItem = document.querySelector(`.mobile-menu-item[data-page="${this.currentPage}"]`);
        if (currentPageItem) {
            currentPageItem.classList.add('active');
        }
        
        // Also update bottom nav
        this.setActiveBottomNav();
    }

    updateBottomNavBadges() {
        // Update job count badge on bottom nav
        try {
            const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
            const availableJobs = jobs.filter(job => job.status === 'available');
            
            const bottomJobsBadge = document.getElementById('bottomJobsBadge');
            if (bottomJobsBadge) {
                if (availableJobs.length > 0) {
                    bottomJobsBadge.textContent = availableJobs.length;
                    bottomJobsBadge.style.display = 'flex';
                } else {
                    bottomJobsBadge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating bottom nav badge:', error);
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
            if (jobsBadge) {
                if (availableJobs.length > 0) {
                    jobsBadge.textContent = availableJobs.length;
                    jobsBadge.style.display = 'flex';
                } else {
                    jobsBadge.style.display = 'none';
                }
            }
            
            // Also update bottom nav badge
            this.updateBottomNavBadges();
        } catch (error) {
            console.error('Error updating job badge:', error);
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

// Initialize hamburger menu when script loads
let hamburgerMenuInstance = null;

// Initialize the menu
function initHamburgerMenu() {
    if (!hamburgerMenuInstance) {
        hamburgerMenuInstance = new HamburgerMenu();
    }
    return hamburgerMenuInstance;
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    initHamburgerMenu();
});

// Also try immediate initialization if DOM is already loaded
if (document.readyState !== 'loading') {
    initHamburgerMenu();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HamburgerMenu;
}