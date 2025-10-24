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

// Middleware - Updated CORS for production
app.use(cors({
    origin: [
        'https://jpconwi.github.io',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve frontend from Render (optional - you can keep using GitHub Pages)
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
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
        
        if (process.env.NODE_ENV === 'production') {
            console.log('✅ Production mode enabled');
        }
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
