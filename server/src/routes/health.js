/**
 * Health Check Routes
 * API health and status endpoints
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { checkMLServiceHealth, getConnectedCount } = require('../utils');
const { asyncHandler } = require('../middleware');

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with all services
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  // Check MongoDB connection
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  // Check ML service
  const mlStatus = await checkMLServiceHealth();

  // Get Socket.IO connections
  const socketConnections = getConnectedCount();

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: {
        status: 'healthy',
        version: '1.0.0'
      },
      database: {
        status: mongoStatus,
        type: 'MongoDB'
      },
      mlService: {
        status: mlStatus.healthy ? 'healthy' : 'unhealthy',
        details: mlStatus
      },
      websocket: {
        status: 'healthy',
        connections: socketConnections
      }
    },
    environment: process.env.NODE_ENV || 'development'
  });
}));

/**
 * @route   GET /api/health/ready
 * @desc    Kubernetes/Docker readiness probe
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req, res) => {
  const isDBReady = mongoose.connection.readyState === 1;

  if (!isDBReady) {
    return res.status(503).json({
      success: false,
      status: 'not ready',
      message: 'Database not connected'
    });
  }

  res.json({
    success: true,
    status: 'ready'
  });
}));

/**
 * @route   GET /api/health/live
 * @desc    Kubernetes/Docker liveness probe
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.json({
    success: true,
    status: 'alive'
  });
});

module.exports = router;
