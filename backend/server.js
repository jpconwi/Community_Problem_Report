// server.js - Enhanced for Multi-Device Support
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

// Get local IP address for network access
function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

// Enhanced CORS configuration for multiple devices and environments
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:3000',
            `http://${localIP}:3000`,
            `http://${localIP}:8080`,
            'https://communitycare-backend.onrender.com',
            // Add your deployed frontend URLs here
            'https://your-frontend-domain.netlify.app',
            'https://your-frontend-domain.vercel.app'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests
app.options('*', cors());

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Body parsing middleware with increased limits for image uploads
app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    parameterLimit: 100000
}));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Serve frontend - catch all handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Handle SPA routing - serve index.html for all unknown routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint with detailed info
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CommunityCare API is running',
        database: 'Supabase',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global Error Handler:', error);
    
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ 
            message: 'Invalid JSON in request body' 
        });
    }
    
    res.status(error.status || 500).json({
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Initialize database and start server
console.log('🔄 Initializing CommunityCare Server...');
console.log('📁 Frontend path:', path.join(__dirname, '../frontend'));

initDatabase().then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 CommunityCare Server Started Successfully!');
        console.log('═'.repeat(50));
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`🌐 Network: http://${localIP}:${PORT}`);
        console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
        console.log('═'.repeat(50));
        console.log('📱 Multi-Device Access:');
        console.log(`   • Other devices can access via: http://${localIP}:${PORT}`);
        console.log(`   • Make sure devices are on the same Wi-Fi network`);
        console.log('═'.repeat(50));
        console.log('🛠️  Features:');
        console.log('   ✅ Photo upload support (up to 50MB)');
        console.log('   ✅ Cross-device compatibility');
        console.log('   ✅ Admin report management');
        console.log('   ✅ Real-time notifications');
        console.log('═'.repeat(50));
        
        // Test backend connectivity
        console.log('🔍 Testing backend connectivity...');
        fetch(`http://localhost:${PORT}/api/health`)
            .then(response => response.json())
            .then(data => console.log('✅ Backend is responding:', data.status))
            .catch(err => console.log('❌ Backend health check failed:', err.message));
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
        console.log('\n🛑 Shutting down server gracefully...');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });

        setTimeout(() => {
            console.error('❌ Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

}).catch(error => {
    console.error('❌ Failed to start server:', error);
    console.error('💡 Check if:');
    console.error('   • Supabase environment variables are set');
    console.error('   • Database tables are created');
    console.error('   • Network connection is stable');
    process.exit(1);
});
