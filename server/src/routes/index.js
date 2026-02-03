/**
 * Routes Index
 * Central routing configuration
 */
const express = require('express');
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const userRoutes = require('./users');
const healthRoutes = require('./health');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);

module.exports = router;
