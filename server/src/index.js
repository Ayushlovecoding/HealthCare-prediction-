/**
 * Express Server Entry Point
 * Emergency Healthcare Platform API Server
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Load environment variables first
require('dotenv').config();

const config = require('./config');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware');
const { initializeSocketHandlers } = require('./utils/socket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Emergency Healthcare Platform API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    server.listen(config.port, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🏥 Emergency Healthcare Platform API Server');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`✅ Environment: ${config.nodeEnv}`);
      console.log(`✅ MongoDB connected`);
      console.log(`✅ Socket.IO initialized`);
      console.log(`✅ ML Service URL: ${config.mlServiceUrl}`);
      console.log('═══════════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💀 Process terminated!');
  });
});

// Start the server
startServer();

module.exports = { app, server, io };
