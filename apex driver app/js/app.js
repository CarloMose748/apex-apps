// Sample implementation showing how to use Supabase in your Apex Driver app
// This file demonstrates common use cases and can be integrated into your existing pages

// Wait for Supabase to be ready
document.addEventListener('supabaseReady', function(event) {
    console.log('Supabase is ready!');
    initializeApp();
});

async function initializeApp() {
    // Example: Load available jobs on page load
    await loadAvailableJobs();
    
    // Example: Set up real-time job updates
    subscribeToJobUpdates();
    
    // Example: Get user location and update driver location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Current location:', latitude, longitude);
            
            // If you have a driver ID (from authentication or local storage)
            const driverId = localStorage.getItem('driverId');
            if (driverId) {
                await updateDriverLocation(driverId, latitude, longitude);
            }
            
            // Load nearby jobs based on location
            await loadNearbyJobs(latitude, longitude);
        });
    }
}

// ==================== JOB MANAGEMENT FUNCTIONS ====================

async function loadAvailableJobs() {
    try {
        const { data, error } = await ApexDriverService.getAvailableJobs();
        
        if (error) {
            console.error('Error loading jobs:', error);
            return;
        }
        
        console.log('Available jobs:', data);
        displayJobs(data);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadNearbyJobs(latitude, longitude, radius = 10) {
    try {
        const { data, error } = await ApexDriverService.getAvailableJobs(latitude, longitude, radius);
        
        if (error) {
            console.error('Error loading nearby jobs:', error);
            return;
        }
        
        console.log('Nearby jobs:', data);
        displayJobs(data);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayJobs(jobs) {
    // This function would integrate with your existing job display logic
    const jobsContainer = document.getElementById('jobsContainer') || document.querySelector('.jobs-grid');
    
    if (!jobsContainer) {
        console.log('Jobs container not found, jobs data:', jobs);
        return;
    }
    
    jobsContainer.innerHTML = '';
    
    jobs.forEach(job => {
        const jobElement = createJobElement(job);
        jobsContainer.appendChild(jobElement);
    });
}

function createJobElement(job) {
    const jobDiv = document.createElement('div');
    jobDiv.className = 'job-card';
    jobDiv.innerHTML = `
        <div class="job-header">
            <h3>${job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}</h3>
            <span class="job-price">R${job.price}</span>
        </div>
        <div class="job-details">
            <p><strong>Customer:</strong> ${job.customer_name}</p>
            <p><strong>Pickup:</strong> ${job.pickup_address}</p>
            <p><strong>Dropoff:</strong> ${job.dropoff_address}</p>
            ${job.description ? `<p><strong>Description:</strong> ${job.description}</p>` : ''}
        </div>
        <div class="job-actions">
            <button class="btn btn-primary" onclick="assignJob('${job.id}')">Accept Job</button>
            <button class="btn btn-secondary" onclick="viewJobDetails('${job.id}')">View Details</button>
        </div>
    `;
    return jobDiv;
}

async function assignJob(jobId) {
    const driverId = localStorage.getItem('driverId');
    
    if (!driverId) {
        alert('Please register as a driver first');
        return;
    }
    
    try {
        const { data, error } = await ApexDriverService.assignJobToDriver(jobId, driverId);
        
        if (error) {
            console.error('Error assigning job:', error);
            alert('Error assigning job: ' + error.message);
            return;
        }
        
        console.log('Job assigned successfully:', data);
        alert('Job assigned successfully!');
        
        // Redirect to job details or refresh the page
        window.location.href = `job-detail.html?id=${jobId}`;
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while assigning the job');
    }
}

function viewJobDetails(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

// ==================== DRIVER MANAGEMENT FUNCTIONS ====================

async function registerDriver(formData) {
    try {
        const { data, error } = await ApexDriverService.registerDriver(formData);
        
        if (error) {
            console.error('Error registering driver:', error);
            alert('Error registering driver: ' + error.message);
            return;
        }
        
        console.log('Driver registered successfully:', data);
        localStorage.setItem('driverId', data.id);
        alert('Driver registered successfully!');
        
        return data;
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    }
}

async function updateDriverLocation(driverId, latitude, longitude) {
    try {
        const { data, error } = await ApexDriverService.updateDriverLocation(driverId, latitude, longitude);
        
        if (error) {
            console.error('Error updating location:', error);
            return;
        }
        
        console.log('Location updated:', data);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateJobStatus(jobId, status) {
    const driverId = localStorage.getItem('driverId');
    
    try {
        const { data, error } = await ApexDriverService.updateJobStatus(jobId, status, driverId);
        
        if (error) {
            console.error('Error updating job status:', error);
            alert('Error updating job status: ' + error.message);
            return;
        }
        
        console.log('Job status updated:', data);
        alert(`Job ${status} successfully!`);
        
        // Refresh the page or update UI accordingly
        if (status === 'completed' || status === 'cancelled') {
            window.location.href = 'jobs.html';
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating job status');
    }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

function subscribeToJobUpdates() {
    // Subscribe to new available jobs
    const subscription = ApexDriverService.subscribeToAvailableJobs((payload) => {
        console.log('New job available:', payload);
        
        // Show notification or update UI
        if (payload.eventType === 'INSERT') {
            showJobNotification(payload.new);
        }
    });
    
    // Store subscription to clean up later if needed
    window.jobSubscription = subscription;
}

function showJobNotification(job) {
    // Create a simple notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Job Available!', {
            body: `${job.job_type} - R${job.price} - ${job.pickup_address}`,
            icon: '/icon-192x192.png' // You can add an app icon
        });
    }
    
    // Or show an in-app notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h4>New Job Available!</h4>
            <p>${job.job_type} - R${job.price}</p>
            <p>${job.pickup_address}</p>
            <button onclick="viewJobDetails('${job.id}')" class="btn btn-sm btn-primary">View</button>
            <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-secondary">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// ==================== UTILITY FUNCTIONS ====================

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Get job from URL parameters (for job-detail.html)
function getJobIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Format distance
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
}

// Format price
function formatPrice(price) {
    return `R${parseFloat(price).toFixed(2)}`;
}

// ==================== INITIALIZATION ====================

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', function() {
    requestNotificationPermission();
});

// Clean up subscriptions when page unloads
window.addEventListener('beforeunload', function() {
    if (window.jobSubscription) {
        ApexDriverService.unsubscribe(window.jobSubscription);
    }
});

// Export functions for use in HTML onclick handlers
window.assignJob = assignJob;
window.viewJobDetails = viewJobDetails;
window.updateJobStatus = updateJobStatus;
window.registerDriver = registerDriver;