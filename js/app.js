// API Base URL - Change this to your backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Current user state
let currentUser = null;
let authToken = null;

// DOM elements
const pages = {
    login: document.getElementById('login-page'),
    register: document.getElementById('register-page'),
    userDashboard: document.getElementById('user-dashboard'),
    myReports: document.getElementById('my-reports-page'),
    notifications: document.getElementById('notifications-page'),
    adminDashboard: document.getElementById('admin-dashboard')
};

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Auth API
async function loginUser(email, password) {
    const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return data;
}

async function registerUser(userData) {
    const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    return data;
}

async function logoutUser() {
    try {
        await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        showSnackbar('See you soon! 👋');
        showPage('login');
    }
}

// Reports API
async function submitReport(reportData) {
    const data = await apiCall('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
    });
    
    return data;
}

async function getUserReports() {
    const data = await apiCall('/reports/my-reports');
    return data.reports;
}

async function getAllReports() {
    const data = await apiCall('/reports');
    return data.reports;
}

async function updateReportStatus(reportId, newStatus) {
    const data = await apiCall(`/reports/${reportId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    
    return data;
}

async function deleteReport(reportId) {
    const data = await apiCall(`/reports/${reportId}`, {
        method: 'DELETE'
    });
    
    return data;
}

// Users API (Admin only)
async function getAllUsers() {
    const data = await apiCall('/users');
    return data.users;
}

async function updateUserRole(userId, newRole) {
    const data = await apiCall(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
    });
    
    return data;
}

async function deleteUser(userId) {
    const data = await apiCall(`/users/${userId}`, {
        method: 'DELETE'
    });
    
    return data;
}

// Notifications API
async function getUserNotifications() {
    const data = await apiCall('/notifications');
    return data.notifications;
}

async function markNotificationsAsRead() {
    const data = await apiCall('/notifications/read', {
        method: 'PUT'
    });
    
    return data;
}

// Utility functions
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });
    pages[pageId].classList.add('active');
}

function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = 'snackbar';
    
    if (type === 'error') {
        snackbar.classList.add('error');
    } else if (type === 'warning') {
        snackbar.classList.add('warning');
    }
    
    snackbar.style.display = 'block';
    
    setTimeout(() => {
        snackbar.style.display = 'none';
    }, 3000);
}

function validateEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}

function validatePhone(phone) {
    if (!phone) return true;
    const pattern = /^\+?1?\d{9,15}$/;
    return pattern.test(phone);
}

// UI rendering functions
async function showUserDashboard() {
    showPage('userDashboard');
    
    document.getElementById('user-name').textContent = currentUser.username;
    
    try {
        const userReports = await getUserReports();
        const pendingCount = userReports.filter(r => r.status === 'Pending').length;
        
        document.getElementById('user-reports-count').textContent = userReports.length;
        document.getElementById('user-pending-count').textContent = pendingCount;
        
        // Update notification badge
        const notifications = await getUserNotifications();
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const notificationBadge = document.getElementById('notification-badge');
        
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    } catch (error) {
        showSnackbar('Error loading dashboard data', 'error');
    }
    
    // Clear form
    document.getElementById('problem-type').value = '';
    document.getElementById('location').value = '';
    document.getElementById('issue').value = '';
    document.getElementById('priority').value = '🟡 Medium';
    document.getElementById('photo-preview-container').classList.add('hidden');
    document.getElementById('clear-photo-btn').classList.add('hidden');
}

async function showAdminDashboard() {
    showPage('adminDashboard');
    await updateAdminStats();
    showAdminTab('reports');
}

async function updateAdminStats() {
    try {
        const reports = await getAllReports();
        const stats = {
            total: reports.length,
            pending: reports.filter(r => r.status === 'Pending').length,
            inProgress: reports.filter(r => r.status === 'In Progress').length,
            resolved: reports.filter(r => r.status === 'Resolved').length
        };
        
        const statsGrid = document.getElementById('admin-stats');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--primary-color);">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--warning-color);">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-value">${stats.pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--primary-color);">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-value">${stats.inProgress}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--success-color);">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-value">${stats.resolved}</div>
                <div class="stat-label">Resolved</div>
            </div>
        `;
    } catch (error) {
        showSnackbar('Error loading stats', 'error');
    }
}

// ... (Include all the other UI functions from the original code, but modified to use API calls)

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }

    // Login page
    document.getElementById('login-btn').addEventListener('click', async function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            showSnackbar('Please fill in all fields!', 'warning');
            return;
        }
        
        try {
            await loginUser(email, password);
            showSnackbar(`Welcome back, ${currentUser.username}! 👋`);
            
            if (currentUser.role === 'admin') {
                showAdminDashboard();
            } else {
                showUserDashboard();
            }
        } catch (error) {
            showSnackbar('Invalid email or password!', 'error');
        }
    });
    
    document.getElementById('go-to-register').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('register');
    });
    
    // Register page
    document.getElementById('register-back').addEventListener('click', function() {
        showPage('login');
    });
    
    document.getElementById('register-btn').addEventListener('click', async function() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showSnackbar('Please fill in all required fields!', 'warning');
            return;
        }
        
        if (!validateEmail(email)) {
            showSnackbar('Please enter a valid email address!', 'warning');
            return;
        }
        
        if (phone && !validatePhone(phone)) {
            showSnackbar('Please enter a valid phone number!', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showSnackbar('Passwords do not match!', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showSnackbar('Password must be at least 6 characters long!', 'warning');
            return;
        }
        
        try {
            await registerUser({ username: name, email, phone, password });
            showSnackbar('Account created successfully! 🎉');
            showPage('login');
        } catch (error) {
            showSnackbar(error.message || 'Registration failed!', 'error');
        }
    });
    
    // User dashboard
    document.getElementById('submit-report-btn').addEventListener('click', async function() {
        const problemType = document.getElementById('problem-type').value;
        const location = document.getElementById('location').value;
        const issue = document.getElementById('issue').value;
        const priority = document.getElementById('priority').value;
        const photoData = document.getElementById('photo-preview').src || null;
        
        if (!problemType || !location || !issue) {
            showSnackbar('Please fill in all required fields! 📝', 'warning');
            return;
        }
        
        try {
            await submitReport({
                problem_type: problemType,
                location,
                issue,
                priority,
                photo_data: photoData
            });
            
            showSnackbar('Report submitted successfully! ✅');
            
            // Clear form
            document.getElementById('problem-type').value = '';
            document.getElementById('location').value = '';
            document.getElementById('issue').value = '';
            document.getElementById('priority').value = '🟡 Medium';
            document.getElementById('photo-preview-container').classList.add('hidden');
            document.getElementById('clear-photo-btn').classList.add('hidden');
            
            // Refresh stats
            await showUserDashboard();
        } catch (error) {
            showSnackbar('Error submitting report', 'error');
        }
    });
    
    // ... (Include all other event listeners from the original code)
});

// Include all the remaining JavaScript functions from the original code, but modified to use API calls