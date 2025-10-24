require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const { initDatabase } = require('./database/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS for global access
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000',
        'https://communitycare-backend.onrender.com',
        // Add your production domains here
        'https://your-app.netlify.app',
        'https://your-app.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing with increased limits for images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CommunityCare API is running globally',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Serve frontend
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Initialize and start server
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 CommunityCare Global Server Started!');
        console.log('═'.repeat(50));
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`🌐 Global: https://communitycare-backend.onrender.com`);
        console.log(`🔗 Health: /api/health`);
        console.log('═'.repeat(50));
        console.log('📱 Multi-Device & Global Access Ready!');
        console.log('📸 Photo Upload: Enabled');
        console.log('👑 Admin Panel: Ready');
        console.log('═'.repeat(50));
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
