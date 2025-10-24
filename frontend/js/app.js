// Replace the first line with:
const API_BASE_URL = 'https://communitycare-backend.onrender.com/api';

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

    if (options.body) {
        config.body = options.body;
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

// Photo Upload Functionality
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
    
    // Handle camera photo selection
    cameraInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files[0]);
    });
    
    // Handle gallery photo selection
    galleryInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files[0]);
    });
    
    function handleImageSelection(file) {
        if (!file) return;
        
        console.log('File selected:', file.name, file.size, file.type);
        
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
            console.log('File read successfully');
            preview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            showSnackbar('Photo added successfully! 📸');
        };
        
        reader.onerror = function() {
            showSnackbar('Error reading image file', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    // Clear photo button handler
    clearBtn.addEventListener('click', function() {
        preview.src = '';
        previewContainer.classList.add('hidden');
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

function showAdminTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab content
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
                            By: ${report.name} • ${report.location} • ${report.date}
                            ${report.photo_data ? ' 📷' : ''}
                        </div>
                    </div>
                    <div class="d-flex align-center">
                        <span class="badge ${statusColor}">${report.status}</span>
                        <div style="margin-left: 8px; position: relative;">
                            <button class="btn btn-secondary btn-sm admin-report-actions" data-id="${report.id}">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            reportsList.appendChild(reportElement);
        });
        
        // Add event listeners to action buttons
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
        
        // Add event listeners to action buttons
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
    // For now, we'll show a placeholder since we don't have a logs API
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
            
            const cleanPriority = report.priority.replace('🟢 ', '')
                .replace('🟡 ', '')
                .replace('🔴 ', '')
                .replace('🚨 ', '');
            
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
        
        // Add event listeners to view details buttons
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
    
    const cleanPriority = report.priority.replace('🟢 ', '')
        .replace('🟡 ', '')
        .replace('🔴 ', '')
        .replace('🚨 ', '');
    
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
                <button class="btn btn-secondary" id="mark-resolved-btn" data-id="${report.id}">
                    <i class="fas fa-check-circle"></i> Mark Resolved
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
                    <span>${report.name}</span>
                </div>
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
                    <span>${report.date}</span>
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
    }
}

async function showUserActionsModal(user) {
    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-modal-title');
    const message = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-action-btn');
    
    title.textContent = 'User Actions';
    message.innerHTML = `
        <p>User: <strong>${user.username}</strong></p>
        <p>Email: ${user.email}</p>
        <p>Current Role: ${user.role}</p>
    `;
    
    confirmBtn.textContent = user.role === 'user' ? 'Make Admin' : 'Make User';
    confirmBtn.onclick = async function() {
        const newRole = user.role === 'user' ? 'admin' : 'user';
        try {
            await updateUserRole(user.id, newRole);
            modal.style.display = 'none';
            loadAdminUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            showSnackbar('Error updating user role', 'error');
        }
    };
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete User';
    deleteBtn.onclick = function() {
        showConfirmModal(
            'Confirm Delete',
            'Are you sure you want to delete this user? All their reports will also be deleted.',
            async function() {
                try {
                    await deleteUser(user.id);
                    modal.style.display = 'none';
                    loadAdminUsers();
                    updateAdminStats();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showSnackbar('Error deleting user', 'error');
                }
            }
        );
    };
    
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = '';
    actionButtons.appendChild(confirmBtn);
    actionButtons.appendChild(deleteBtn);
    
    modal.style.display = 'flex';
}

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('confirm-modal-title');
    const modalMessage = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-action-btn');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmBtn.textContent = title.includes('Delete') ? 'Delete' : 'Confirm';
    confirmBtn.className = title.includes('Delete') ? 'btn btn-danger' : 'btn btn-primary';
    
    confirmBtn.onclick = onConfirm;
    
    modal.style.display = 'flex';
}

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

    // Setup photo upload - THIS IS CRITICAL!
    setupPhotoUpload();

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
            console.error('Login error:', error);
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
            console.error('Registration error:', error);
            showSnackbar(error.message || 'Registration failed!', 'error');
        }
    });
    
    // User dashboard - REPORT SUBMISSION WITH PHOTO
    document.getElementById('submit-report-btn').addEventListener('click', async function() {
        const problemType = document.getElementById('problem-type').value;
        const location = document.getElementById('location').value;
        const issue = document.getElementById('issue').value;
        const priority = document.getElementById('priority').value;
        const photoData = document.getElementById('photo-preview').src || null;
        
        console.log('Submitting report with photo data:', photoData ? 'Yes' : 'No');
        
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
            console.error('Error submitting report:', error);
            showSnackbar('Error submitting report: ' + error.message, 'error');
        }
    });
    
    // Navigation buttons
    document.getElementById('my-reports-btn').addEventListener('click', showMyReports);
    document.getElementById('user-notifications-btn').addEventListener('click', showNotifications);
    document.getElementById('user-logout-btn').addEventListener('click', logoutUser);
    document.getElementById('notification-btn').addEventListener('click', showNotifications);
    
    // Back buttons
    document.getElementById('my-reports-back').addEventListener('click', showUserDashboard);
    document.getElementById('notifications-back').addEventListener('click', showUserDashboard);
    
    // Admin dashboard
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            showAdminTab(this.getAttribute('data-tab'));
        });
    });
    
    document.getElementById('refresh-reports-btn').addEventListener('click', function() {
        loadAdminReports();
        updateAdminStats();
        showSnackbar('Reports refreshed!');
    });
    
    document.getElementById('refresh-users-btn').addEventListener('click', function() {
        loadAdminUsers();
        showSnackbar('Users refreshed!');
    });
    
    document.getElementById('refresh-logs-btn').addEventListener('click', function() {
        loadAdminLogs();
        showSnackbar('Logs refreshed!');
    });
    
    document.getElementById('clear-logs-btn').addEventListener('click', function() {
        showConfirmModal(
            'Clear All Logs',
            'Are you sure you want to clear all activity logs?',
            function() {
                // This would call a clear logs API if we had one
                showSnackbar('Logs cleared!');
                loadAdminLogs();
            }
        );
    });
    
    document.getElementById('admin-logout-btn').addEventListener('click', logoutUser);
    
    // Modal close buttons
    document.getElementById('close-report-modal').addEventListener('click', function() {
        document.getElementById('report-detail-modal').style.display = 'none';
    });
    
    document.getElementById('close-confirm-modal').addEventListener('click', function() {
        document.getElementById('confirm-modal').style.display = 'none';
    });
    
    document.getElementById('cancel-action-btn').addEventListener('click', function() {
        document.getElementById('confirm-modal').style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const reportModal = document.getElementById('report-detail-modal');
        const confirmModal = document.getElementById('confirm-modal');
        
        if (e.target === reportModal) {
            reportModal.style.display = 'none';
        }
        
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
    
    console.log('Photo upload system initialized');
});

