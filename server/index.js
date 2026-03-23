
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Root endpoint for API-only backend
app.get('/', (req, res) => {
    res.json({
        message: 'Oijaba backend API is running.',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Routes
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const driversRoutes = require('./routes/drivers');
const ridersRoutes = require('./routes/riders');
const parcelsRoutes = require('./routes/parcels');
const paymentsRoutes = require('./routes/payments');
const vehiclesRoutes = require('./routes/vehicles');
const earningsRoutes = require('./routes/earnings');



// Setup Socket.io with Vercel-compatible configuration
const io = new Server(server, {
    cors: { 
        origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    },
    // Vercel serverless functions have limited WebSocket support
    transports: ['websocket', 'polling']
});
require('./sockets/rides')(io);
app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));
// Allow larger JSON payloads for image uploads (data URIs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
    
    // Add a simple /api route for health/status
    app.get('/api', (req, res) => {
        res.json({ status: 'API root is reachable' });
    });

// ...existing code...

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/parcels', parcelsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/earnings', earningsRoutes);

const PORT = process.env.PORT || 3002;

function startServer(port, allowFallback = false) {
    server
        .listen(port, '0.0.0.0', () => {
            console.log(`🚀 Oijaba server running on http://localhost:${port}`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
        })
        .once('error', (err) => {
            if (err?.code === 'EADDRINUSE' && allowFallback) {
                const fallbackPort = Number(port) + 1;
                console.warn(`⚠️ Port ${port} is in use. Retrying on ${fallbackPort}...`);
                startServer(fallbackPort, fallbackPort < 3011);
                return;
            }

            if (err?.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use. Set PORT to a free port and restart the server.`);
            } else {
                console.error('❌ Server failed to start:', err?.message || err);
            }

            process.exit(1);
        });
}

if (require.main === module) {
    const requestedPort = Number(PORT);
    const usingDefaultPort = !process.env.PORT && requestedPort === 3001;
    startServer(requestedPort, usingDefaultPort);
}

module.exports = app;
module.exports = server;
