/**
 * Cache management utilities to prevent stale app loading issues
 */

// App version and cache management
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();

export const cacheManager = {
  // Check if app version has changed (with safety checks)
  checkForUpdates() {
    try {
      const storedVersion = localStorage.getItem('apex-app-version');
      const lastReloadTime = localStorage.getItem('apex-last-reload');
      
      // Prevent reload loops - don't reload if we just reloaded in the last 10 seconds
      if (lastReloadTime) {
        const timeSinceReload = Date.now() - parseInt(lastReloadTime, 10);
        if (timeSinceReload < 10000) {
          console.log('Skipping version check - recent reload detected');
          return false;
        }
      }
      
      // Only trigger update if version actually changed and we have a stored version
      const versionChanged = storedVersion && storedVersion !== APP_VERSION;
      
      if (versionChanged) {
        console.log(`App update detected: ${storedVersion} → ${APP_VERSION}`);
        localStorage.setItem('apex-last-reload', Date.now().toString());
        this.clearAllCaches();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  },

  // Clear all browser caches
  async clearAllCaches() {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear only app-specific storage, preserve some items
      const itemsToPreserve = ['apex-app-version', 'apex-last-reload'];
      const preservedItems: { [key: string]: string | null } = {};
      
      itemsToPreserve.forEach(key => {
        preservedItems[key] = localStorage.getItem(key);
      });

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Restore preserved items
      Object.entries(preservedItems).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });

      console.log('App caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  },

  // Store current version info
  updateVersionInfo() {
    try {
      localStorage.setItem('apex-app-version', APP_VERSION);
      localStorage.setItem('apex-build-time', BUILD_TIME);
    } catch (error) {
      console.error('Error updating version info:', error);
    }
  },

  // Force reload with cache bypass
  forceReload() {
    try {
      // Record reload time to prevent loops
      localStorage.setItem('apex-last-reload', Date.now().toString());
      
      // Add timestamp to force cache bypass
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.replace(url.href);
    } catch (error) {
      console.error('Error during forced reload:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  },

  // Initialize cache management (safer version)
  init() {
    try {
      // Don't do anything aggressive on first load
      const hasStoredVersion = localStorage.getItem('apex-app-version');
      
      if (!hasStoredVersion) {
        // First time visit - just store version
        this.updateVersionInfo();
        console.log('First visit detected, version stored');
        return false;
      }

      // Check for updates only if we have a stored version
      if (this.checkForUpdates()) {
        // Small delay to allow current script to finish
        setTimeout(() => {
          this.forceReload();
        }, 500);
        return true; // Indicates reload will happen
      }

      // Update version info for next time
      this.updateVersionInfo();
      return false;
    } catch (error) {
      console.error('Error initializing cache manager:', error);
      // On error, just update version and continue
      this.updateVersionInfo();
      return false;
    }
  },

  // Manual cache clear for user action
  async manualCacheClear() {
    try {
      await this.clearAllCaches();
      localStorage.setItem('apex-last-reload', Date.now().toString());
      this.forceReload();
    } catch (error) {
      console.error('Error during manual cache clear:', error);
      window.location.reload();
    }
  }
};

// Detect if we're in a problematic cached state
export const detectStaleCache = () => {
  try {
    const storedVersion = localStorage.getItem('apex-app-version');
    return storedVersion && storedVersion !== APP_VERSION;
  } catch {
    return false;
  }
};

// Export version info for debugging
export const getVersionInfo = () => {
  try {
    return {
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      userAgent: navigator.userAgent,
      cached: localStorage.getItem('apex-app-version'),
      lastReload: localStorage.getItem('apex-last-reload'),
      stale: detectStaleCache()
    };
  } catch (error) {
    return {
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      userAgent: navigator.userAgent,
      cached: 'Error reading',
      lastReload: 'Error reading',
      stale: false
    };
  }
};