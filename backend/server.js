// server.js - Update CORS configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const { initDatabase } = require('./database/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for multiple devices
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500', 'https://your-frontend-domain.com'], // Add your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CommunityCare API is running',
        database: 'Supabase',
        timestamp: new Date().toISOString()
    });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🌐 Accessible on your network: http://YOUR_LOCAL_IP:${PORT}`);
        console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
        console.log(`📱 Other devices can access via your local IP address`);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
