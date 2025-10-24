const API_BASE_URL = 'https://communitycare-backend.onrender.com/api';

let currentUser = null;
let authToken = null;

const pages = {
    login: document.getElementById('login-page'),
    register: document.getElementById('register-page'),
    userDashboard: document.getElementById('user-dashboard'),
    myReports: document.getElementById('my-reports-page'),
    notifications: document.getElementById('notifications-page'),
    adminDashboard: document.getElementById('admin-dashboard')
};

// Enhanced API Functions
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

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error(error.message || 'Network error. Please check your connection.');
    }
}

// Auth functions
// Auth functions
async function loginUser(email, password) {
    const data = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password }
    });
    
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateNavigation();
    return data;
}

async function registerUser(userData) {
    return await apiCall('/auth/register', {
        method: 'POST',
        body: userData
    });
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
        updateNavigation();
        showSnackbar('See you soon! 👋');
        showPage('login');
    }
}

// Report functions
async function submitReport(reportData) {
    return await apiCall('/reports', {
        method: 'POST',
        body: reportData
    });
}

async function getUserReports() {
    const data = await apiCall('/reports/my-reports');
    return data.reports || [];
}

async function getAllReports() {
    const data = await apiCall('/reports');
    return data.reports || [];
}

async function updateReportStatus(reportId, newStatus) {
    return await apiCall(`/reports/${reportId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
    });
}

async function deleteReport(reportId) {
    return await apiCall(`/reports/${reportId}`, {
        method: 'DELETE'
    });
}

// User management (Admin)
async function getAllUsers() {
    const data = await apiCall('/users');
    return data.users || [];
}

async function updateUserRole(userId, newRole) {
    return await apiCall(`/users/${userId}/role`, {
        method: 'PUT',
        body: { role: newRole }
    });
}

async function deleteUser(userId) {
    return await apiCall(`/users/${userId}`, {
        method: 'DELETE'
    });
}

// Notifications
async function getUserNotifications() {
    const data = await apiCall('/notifications');
    return data.notifications || [];
}

async function markNotificationsAsRead() {
    return await apiCall('/notifications/read', {
        method: 'PUT'
    });
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
    
    if (type === 'error') snackbar.classList.add('error');
    else if (type === 'warning') snackbar.classList.add('warning');
    
    snackbar.style.display = 'block';
    setTimeout(() => { snackbar.style.display = 'none'; }, 4000);
}

function validateEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}

// Navigation function
function updateNavigation() {
    const userNav = document.getElementById('user-nav');
    const adminNav = document.getElementById('admin-nav');
    const publicNav = document.getElementById('public-nav');
    
    // Hide all navs first
    userNav.classList.add('hidden');
    adminNav.classList.add('hidden');
    publicNav.classList.add('hidden');
    
    if (currentUser) {
        if (currentUser.role === 'admin') {
            adminNav.classList.remove('hidden');
        } else {
            userNav.classList.remove('hidden');
        }
    } else {
        publicNav.classList.remove('hidden');
    }
}

// Enhanced Photo Upload System
function setupPhotoUpload() {
    const uploadBtn = document.getElementById('upload-photo-btn');
    const chooseBtn = document.getElementById('choose-photo-btn');
    const clearBtn = document.getElementById('clear-photo-btn');
    const previewContainer = document.getElementById('photo-preview-container');
    const preview = document.getElementById('photo-preview');
    const cameraInput = document.getElementById('photo-input');
    const galleryInput = document.getElementById('gallery-input');
    
    // Camera upload
    uploadBtn.addEventListener('click', () => {
        cameraInput.click();
    });
    
    // Gallery upload
    chooseBtn.addEventListener('click', () => {
        galleryInput.click();
    });
    
    // Handle file selection
    function handleImageSelection(file) {
        if (!file) return;
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showSnackbar('Image must be smaller than 5MB', 'error');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showSnackbar('Please select an image file (JPEG, PNG, etc.)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            clearBtn.classList.remove('hidden');
            showSnackbar('Photo added successfully! 📸');
        };
        
        reader.onerror = function() {
            showSnackbar('Error reading image file', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    cameraInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files[0]);
    });
    
    galleryInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files[0]);
    });
    
    // Clear photo
    clearBtn.addEventListener('click', function() {
        preview.src = '';
        previewContainer.classList.add('hidden');
        this.classList.add('hidden');
        cameraInput.value = '';
        galleryInput.value = '';
        showSnackbar('Photo removed', 'warning');
    });
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
        console.error('Error loading dashboard:', error);
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
        console.error('Error loading stats:', error);
        showSnackbar('Error loading stats', 'error');
    }
}
// Add this function to debug and ensure proper loading
function initializeApp() {
    console.log('Initializing CommunityCare app...');
    
    // Ensure login page is properly displayed
    const loginPage = document.getElementById('login-page');
    if (loginPage) {
        loginPage.style.display = 'block';
        loginPage.classList.add('active');
    }
    
    // Check if elements exist
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    console.log('Login form exists:', !!loginForm);
    console.log('Email input exists:', !!emailInput);
    console.log('Password input exists:', !!passwordInput);
    
    if (loginForm && emailInput && passwordInput) {
        console.log('All login elements found successfully');
    } else {
        console.error('Some login elements are missing');
    }
}

// Call this at the end of your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... your existing code ...
    
    // Add this line at the end
    initializeApp();
});

function showAdminTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'reports') {
        loadAdminReports();
    } else if (tabName === 'users') {
        loadAdminUsers();
    } else if (tabName === 'logs') {
        loadAdminLogs();
    }
}

async function loadAdminReports() {
    const reportsList = document.getElementById('admin-reports-list');
    
    try {
        const allReports = await getAllReports();
        
        if (allReports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No community reports found.</p>
                </div>
            `;
            return;
        }
        
        reportsList.innerHTML = '';
        
        allReports.forEach(report => {
            const statusColor = {
                'Pending': 'badge-pending',
                'In Progress': 'badge-in-progress',
                'Resolved': 'badge-resolved'
            }[report.status] || 'badge-pending';
            
            const reportElement = document.createElement('div');
            reportElement.className = 'list-item';
            reportElement.innerHTML = `
                <div class="d-flex justify-between align-center">
                    <div>
                        <div class="list-item-title">${report.problem_type}</div>
                        <div class="list-item-subtitle">
                            By: ${report.name || report.users?.username} • ${report.location} • ${report.date}
                            ${report.photo_data ? ' 📷' : ''}
                        </div>
                    </div>
                    <div class="d-flex align-center">
                        <span class="badge ${statusColor}">${report.status}</span>
                        <div style="margin-left: 8px;">
                            <button class="btn btn-secondary btn-sm admin-report-actions" data-id="${report.id}">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            reportsList.appendChild(reportElement);
        });
        
        // Add event listeners
        document.querySelectorAll('.admin-report-actions').forEach(button => {
            button.addEventListener('click', function() {
                const reportId = this.getAttribute('data-id');
                const report = allReports.find(r => r.id == reportId);
                showReportDetailModal(report, true);
            });
        });
    } catch (error) {
        console.error('Error loading reports:', error);
        showSnackbar('Error loading reports', 'error');
    }
}

async function loadAdminUsers() {
    const usersList = document.getElementById('admin-users-list');
    
    try {
        const allUsers = await getAllUsers();
        
        if (allUsers.length === 0) {
            usersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No users found.</p>
                </div>
            `;
            return;
        }
        
        usersList.innerHTML = '';
        
        allUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'list-item';
            userElement.innerHTML = `
                <div class="d-flex justify-between align-center">
                    <div>
                        <div class="list-item-title">${user.username}</div>
                        <div class="list-item-subtitle">${user.email} • ${user.role}</div>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-sm admin-user-actions" data-id="${user.id}">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            `;
            
            usersList.appendChild(userElement);
        });
        
        document.querySelectorAll('.admin-user-actions').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                const user = allUsers.find(u => u.id == userId);
                showUserActionsModal(user);
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showSnackbar('Error loading users', 'error');
    }
}

async function loadAdminLogs() {
    const logsList = document.getElementById('admin-logs-list');
    logsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>Activity logs feature coming soon</p>
        </div>
    `;
}

async function showMyReports() {
    showPage('myReports');
    const myReportsList = document.getElementById('my-reports-list');
    
    try {
        const userReports = await getUserReports();
        
        if (userReports.length === 0) {
            myReportsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No reports yet</p>
                    <p class="text-small">Submit your first community issue report</p>
                </div>
            `;
            return;
        }
        
        myReportsList.innerHTML = '';
        
        userReports.forEach(report => {
            const statusColor = {
                'Pending': 'badge-pending',
                'In Progress': 'badge-in-progress',
                'Resolved': 'badge-resolved'
            }[report.status] || 'badge-pending';
            
            const priorityClass = {
                '🟢 Low': 'badge-low',
                '🟡 Medium': 'badge-medium',
                '🔴 High': 'badge-high',
                '🚨 Emergency': 'badge-emergency'
            }[report.priority] || 'badge-medium';
            
            const cleanPriority = report.priority ? report.priority.replace('🟢 ', '')
                .replace('🟡 ', '')
                .replace('🔴 ', '')
                .replace('🚨 ', '') : 'Medium';
            
            const reportElement = document.createElement('div');
            reportElement.className = 'card';
            reportElement.innerHTML = `
                <div class="d-flex justify-between align-center mb-2">
                    <span class="text-small text-muted">#${report.id}</span>
                    <div class="d-flex align-center">
                        <span class="badge ${statusColor}">${report.status}</span>
                        <span class="badge-priority ${priorityClass}" style="margin-left: 8px;">${cleanPriority}</span>
                    </div>
                </div>
                <h3 class="h3 mb-1">${report.problem_type}</h3>
                <p class="text-muted mb-2">${report.location}</p>
                <p class="text-small text-muted mb-2">${report.date}</p>
                ${report.photo_data ? '<p class="text-small text-muted">📷 Photo attached</p>' : ''}
                <button class="btn btn-secondary btn-sm view-report-details" data-id="${report.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
            `;
            
            myReportsList.appendChild(reportElement);
        });
        
        document.querySelectorAll('.view-report-details').forEach(button => {
            button.addEventListener('click', async function() {
                const reportId = this.getAttribute('data-id');
                try {
                    const userReports = await getUserReports();
                    const report = userReports.find(r => r.id == reportId);
                    showReportDetailModal(report, false);
                } catch (error) {
                    console.error('Error loading report details:', error);
                    showSnackbar('Error loading report details', 'error');
                }
            });
        });
    } catch (error) {
        console.error('Error loading reports:', error);
        showSnackbar('Error loading reports', 'error');
    }
}

async function showNotifications() {
    showPage('notifications');
    await markNotificationsAsRead();
    
    const notificationsList = document.getElementById('notifications-list');
    
    try {
        const userNotifications = await getUserNotifications();
        
        if (userNotifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                    <p class="text-small">You're all caught up! 🎉</p>
                </div>
            `;
            return;
        }
        
        notificationsList.innerHTML = '';
        
        userNotifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'card';
            notificationElement.innerHTML = `
                <p class="mb-1">${notification.message}</p>
                <p class="text-small text-muted">${new Date(notification.created_at).toLocaleString()}</p>
            `;
            
            notificationsList.appendChild(notificationElement);
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        showSnackbar('Error loading notifications', 'error');
    }
}

function showReportDetailModal(report, isAdmin = false) {
    const modal = document.getElementById('report-detail-modal');
    const content = document.getElementById('report-detail-content');
    
    const cleanPriority = report.priority ? report.priority.replace('🟢 ', '')
        .replace('🟡 ', '')
        .replace('🔴 ', '')
        .replace('🚨 ', '') : 'Medium';
    
    const statusColor = {
        'Pending': 'badge-pending',
        'In Progress': 'badge-in-progress',
        'Resolved': 'badge-resolved'
    }[report.status] || 'badge-pending';
    
    const priorityClass = {
        '🟢 Low': 'badge-low',
        '🟡 Medium': 'badge-medium',
        '🔴 High': 'badge-high',
        '🚨 Emergency': 'badge-emergency'
    }[report.priority] || 'badge-medium';
    
    let actionsHTML = '';
    if (isAdmin && report.status !== 'Resolved') {
        actionsHTML = `
            <div class="action-buttons">
                ${report.status !== 'In Progress' ? `
                <button class="btn btn-secondary" id="mark-in-progress-btn" data-id="${report.id}">
                    <i class="fas fa-sync-alt"></i> Mark In Progress
                </button>
                ` : ''}
                <button class="btn btn-primary" id="mark-resolved-btn" data-id="${report.id}">
                    <i class="fas fa-check-circle"></i> Mark Resolved
                </button>
                <button class="btn btn-danger" id="delete-report-btn" data-id="${report.id}">
                    <i class="fas fa-trash"></i> Delete Report
                </button>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="d-flex justify-between align-center mb-2">
            <h3 class="h3">Report #${report.id}</h3>
            <span class="badge ${statusColor}">${report.status}</span>
        </div>
        
        <div class="mb-3">
            <h4 class="h4 mb-1">Reporter Information</h4>
            <div class="card">
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-user" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 80px;">Name:</span>
                    <span>${report.name || report.users?.username || 'Unknown'}</span>
                </div>
                ${report.users?.email ? `
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-envelope" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 80px;">Email:</span>
                    <span>${report.users.email}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="mb-3">
            <h4 class="h4 mb-1">Report Details</h4>
            <div class="card">
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-tag" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 100px;">Problem Type:</span>
                    <span>${report.problem_type}</span>
                </div>
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-map-marker-alt" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 100px;">Location:</span>
                    <span>${report.location}</span>
                </div>
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-flag" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 100px;">Priority:</span>
                    <span class="badge-priority ${priorityClass}">${cleanPriority}</span>
                </div>
                <div class="d-flex align-center mb-1">
                    <i class="fas fa-calendar" style="color: var(--gray-500); margin-right: 8px;"></i>
                    <span class="text-muted" style="width: 100px;">Report Date:</span>
                    <span>${report.date || new Date(report.created_at).toLocaleString()}</span>
                </div>
            </div>
        </div>
        
        <div class="mb-3">
            <h4 class="h4 mb-1">Description</h4>
            <div class="card">
                <p>${report.issue}</p>
            </div>
        </div>
        
        ${report.photo_data ? `
        <div class="mb-3">
            <h4 class="h4 mb-1">Attached Photo</h4>
            <img src="${report.photo_data}" class="report-image" alt="Report photo" style="max-width: 100%; height: auto; border-radius: 8px;">
        </div>
        ` : `
        <div class="mb-3">
            <h4 class="h4 mb-1">Attached Photo</h4>
            <div class="empty-state">
                <i class="fas fa-camera"></i>
                <p>No photo was attached to this report</p>
            </div>
        </div>
        `}
        
        ${actionsHTML}
    `;
    
    modal.style.display = 'flex';
    
    // Add event listeners to action buttons if admin
    if (isAdmin) {
        if (document.getElementById('mark-in-progress-btn')) {
            document.getElementById('mark-in-progress-btn').addEventListener('click', async function() {
                const reportId = this.getAttribute('data-id');
                try {
                    await updateReportStatus(reportId, 'In Progress');
                    modal.style.display = 'none';
                    loadAdminReports();
                    updateAdminStats();
                } catch (error) {
                    console.error('Error updating report status:', error);
                    showSnackbar('Error updating report status', 'error');
                }
            });
        }
        
        if (document.getElementById('mark-resolved-btn')) {
            document.getElementById('mark-resolved-btn').addEventListener('click', async function() {
                const reportId = this.getAttribute('data-id');
                try {
                    await updateReportStatus(reportId, 'Resolved');
                    modal.style.display = 'none';
                    loadAdminReports();
                    updateAdminStats();
                } catch (error) {
                    console.error('Error updating report status:', error);
                    showSnackbar('Error updating report status', 'error');
                }
            });
        }
        
        if (document.getElementById('delete-report-btn')) {
            document.getElementById('delete-report-btn').addEventListener('click', async function() {
                if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                    const reportId = this.getAttribute('data-id');
                    try {
                        await deleteReport(reportId);
                        modal.style.display = 'none';
                        loadAdminReports();
                        updateAdminStats();
                    } catch (error) {
                        console.error('Error deleting report:', error);
                        showSnackbar('Error deleting report', 'error');
                    }
                }
            });
        }
    }
}

function showUserActionsModal(user) {
    const modal = document.getElementById('user-actions-modal');
    const content = document.getElementById('user-actions-content');
    
    content.innerHTML = `
        <h3 class="h3 mb-2">User: ${user.username}</h3>
        <div class="card mb-3">
            <div class="d-flex align-center mb-1">
                <i class="fas fa-envelope" style="color: var(--gray-500); margin-right: 8px;"></i>
                <span class="text-muted" style="width: 60px;">Email:</span>
                <span>${user.email}</span>
            </div>
            <div class="d-flex align-center mb-1">
                <i class="fas fa-user-tag" style="color: var(--gray-500); margin-right: 8px;"></i>
                <span class="text-muted" style="width: 60px;">Role:</span>
                <span class="badge ${user.role === 'admin' ? 'badge-resolved' : 'badge-pending'}">${user.role}</span>
            </div>
        </div>
        
        <div class="action-buttons">
            ${user.role !== 'admin' ? `
            <button class="btn btn-primary" id="make-admin-btn" data-id="${user.id}">
                <i class="fas fa-shield-alt"></i> Make Admin
            </button>
            ` : `
            <button class="btn btn-secondary" id="make-user-btn" data-id="${user.id}">
                <i class="fas fa-user"></i> Make Regular User
            </button>
            `}
            <button class="btn btn-danger" id="delete-user-btn" data-id="${user.id}">
                <i class="fas fa-trash"></i> Delete User
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Add event listeners
    if (document.getElementById('make-admin-btn')) {
        document.getElementById('make-admin-btn').addEventListener('click', async function() {
            const userId = this.getAttribute('data-id');
            try {
                await updateUserRole(userId, 'admin');
                modal.style.display = 'none';
                loadAdminUsers();
            } catch (error) {
                console.error('Error updating user role:', error);
                showSnackbar('Error updating user role', 'error');
            }
        });
    }
    
    if (document.getElementById('make-user-btn')) {
        document.getElementById('make-user-btn').addEventListener('click', async function() {
            const userId = this.getAttribute('data-id');
            try {
                await updateUserRole(userId, 'user');
                modal.style.display = 'none';
                loadAdminUsers();
            } catch (error) {
                console.error('Error updating user role:', error);
                showSnackbar('Error updating user role', 'error');
            }
        });
    }
    
    document.getElementById('delete-user-btn').addEventListener('click', async function() {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const userId = this.getAttribute('data-id');
            try {
                await deleteUser(userId);
                modal.style.display = 'none';
                loadAdminUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                showSnackbar('Error deleting user', 'error');
            }
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize photo upload system
    setupPhotoUpload();
    
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateNavigation();
        
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    } else {
        showPage('login');
        updateNavigation();
    }
    
    // Login form
    // Login form
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    
    if (!email || !password) {
        showSnackbar('Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showSnackbar('Please enter a valid email address', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    
    try {
        const data = await loginUser(email, password);
        showSnackbar(`Welcome back, ${data.user.username}! 👋`);
        
        if (data.user.role === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    } catch (error) {
        showSnackbar(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const submitBtn = document.getElementById('register-submit');
        
        if (!username || !email || !password || !confirmPassword) {
            showSnackbar('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showSnackbar('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            showSnackbar('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showSnackbar('Passwords do not match', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
        
        try {
            await registerUser({ username, email, password });
            showSnackbar('Account created successfully! Please sign in. ✅');
            showPage('login');
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
    
    // Report submission form
    document.getElementById('report-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const problemType = document.getElementById('problem-type').value.trim();
        const location = document.getElementById('location').value.trim();
        const issue = document.getElementById('issue').value.trim();
        const priority = document.getElementById('priority').value;
        const photoPreview = document.getElementById('photo-preview');
        const submitBtn = document.getElementById('submit-report-btn');
        
        if (!problemType || !location || !issue) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }
        
        const reportData = {
            problem_type: problemType,
            location,
            issue,
            priority
        };
        
        // Add photo data if available
        if (photoPreview.src && photoPreview.src !== '') {
            reportData.photo_data = photoPreview.src;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        try {
            await submitReport(reportData);
            showSnackbar('Report submitted successfully! 🎉');
            
            // Reset form
            document.getElementById('problem-type').value = '';
            document.getElementById('location').value = '';
            document.getElementById('issue').value = '';
            document.getElementById('priority').value = '🟡 Medium';
            document.getElementById('photo-preview-container').classList.add('hidden');
            document.getElementById('clear-photo-btn').classList.add('hidden');
            
            // Update dashboard stats
            showUserDashboard();
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
        }
    });
    
    // Navigation links
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('register');
    });
    
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('login');
    });
    
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
    document.getElementById('admin-logout-btn').addEventListener('click', logoutUser);
    
    document.getElementById('my-reports-link').addEventListener('click', function(e) {
        e.preventDefault();
        showMyReports();
    });
    
    document.getElementById('notifications-link').addEventListener('click', function(e) {
        e.preventDefault();
        showNotifications();
    });
    
    document.getElementById('dashboard-link').addEventListener('click', function(e) {
        e.preventDefault();
        showUserDashboard();
    });
    
    document.getElementById('admin-dashboard-link').addEventListener('click', function(e) {
        e.preventDefault();
        showAdminDashboard();
    });
    
    // Additional navigation buttons
    document.getElementById('my-reports-btn').addEventListener('click', function(e) {
        e.preventDefault();
        showMyReports();
    });
    
    document.getElementById('user-notifications-btn').addEventListener('click', function(e) {
        e.preventDefault();
        showNotifications();
    });
    
    document.getElementById('back-to-dashboard').addEventListener('click', function(e) {
        e.preventDefault();
        showUserDashboard();
    });
    
    document.getElementById('back-to-dashboard-2').addEventListener('click', function(e) {
        e.preventDefault();
        showUserDashboard();
    });
    
    document.getElementById('public-login-link').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('login');
    });
    
    // Admin tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showAdminTab(tabName);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
});
