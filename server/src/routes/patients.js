/**
 * Patient Routes
 * Handles patient data CRUD operations and predictions
 */
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const {
  authenticate,
  authorize,
  validatePatient,
  validateObjectId,
  asyncHandler,
  AppError,
  DOCTOR_OR_ADMIN,
  PARAMEDIC_OR_ABOVE
} = require('../middleware');
const { getPrediction, emitNewPatient, emitPatientUpdate, emitStatusChange } = require('../utils');

/**
 * @route   POST /api/patients
 * @desc    Create a new patient record with ML prediction
 * @access  Private (Paramedics and above)
 */
router.post('/', authenticate, authorize(...PARAMEDIC_OR_ABOVE), validatePatient, asyncHandler(async (req, res) => {
  const {
    age,
    gender,
    heartRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    oxygenSaturation,
    temperature,
    respiratoryRate,
    gcsScore,
    lactateLevel,
    location,
    notes
  } = req.body;

  // Prepare patient data
  const patientData = {
    age,
    gender,
    heartRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    oxygenSaturation,
    temperature,
    respiratoryRate,
    gcsScore: gcsScore || 14,
    lactateLevel: lactateLevel || 2.0,
    location,
    notes,
    submittedBy: req.userId
  };

  // Get ML prediction
  const predictionResult = await getPrediction(patientData);
  
  // Add prediction to patient data
  patientData.prediction = predictionResult.data;

  // Create patient record
  const patient = await Patient.create(patientData);

  // Populate references for response
  await patient.populate('submittedBy', 'name role');

  // Emit Socket.IO event for real-time updates
  const io = req.app.get('io');
  if (io) {
    emitNewPatient(io, patient);
  }

  res.status(201).json({
    success: true,
    message: 'Patient record created successfully',
    mlServiceStatus: predictionResult.success ? 'connected' : 'fallback',
    data: { patient }
  });
}));

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination and filtering
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    riskLevel,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (riskLevel) {
    query['prediction.riskLevel'] = riskLevel;
  }

  // For paramedics, optionally filter to their own submissions
  if (req.user.role === 'PARAMEDIC' && req.query.myPatients === 'true') {
    query.submittedBy = req.userId;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [patients, total] = await Promise.all([
    Patient.find(query)
      .populate('submittedBy', 'name role')
      .populate('assignedDoctor', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Patient.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

/**
 * @route   GET /api/patients/recent
 * @desc    Get recent patients for dashboard
 * @access  Private
 */
router.get('/recent', authenticate, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const patients = await Patient.findRecent(limit);

  res.json({
    success: true,
    data: { patients }
  });
}));

/**
 * @route   GET /api/patients/stats
 * @desc    Get patient statistics for dashboard
 * @access  Private (Doctors and Admins)
 */
router.get('/stats', authenticate, authorize(...DOCTOR_OR_ADMIN), asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    todayPatients,
    criticalPatients,
    highRiskPatients,
    statusCounts,
    riskDistribution
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.countDocuments({ createdAt: { $gte: today } }),
    Patient.countDocuments({ 'prediction.riskLevel': 'Critical', status: { $ne: 'Discharged' } }),
    Patient.countDocuments({ 'prediction.riskLevel': 'High', status: { $ne: 'Discharged' } }),
    Patient.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Patient.aggregate([
      { $group: { _id: '$prediction.riskLevel', count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalPatients,
      todayPatients,
      criticalPatients,
      highRiskPatients,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      riskDistribution: riskDistribution.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {})
    }
  });
}));

/**
 * @route   GET /api/patients/:id
 * @desc    Get a single patient by ID
 * @access  Private
 */
router.get('/:id', authenticate, validateObjectId('id'), asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('submittedBy', 'name role email')
    .populate('assignedDoctor', 'name email');

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.json({
    success: true,
    data: { patient }
  });
}));

/**
 * @route   PUT /api/patients/:id
 * @desc    Update a patient record
 * @access  Private (Doctors and Admins)
 */
router.put('/:id', authenticate, authorize(...DOCTOR_OR_ADMIN), validateObjectId('id'), asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'status',
    'priority',
    'notes',
    'assignedDoctor',
    'location'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const oldStatus = patient.status;

  // Apply updates
  Object.assign(patient, updates);
  await patient.save();

  // Populate for response
  await patient.populate('submittedBy', 'name role');
  await patient.populate('assignedDoctor', 'name');

  // Emit Socket.IO events
  const io = req.app.get('io');
  if (io) {
    emitPatientUpdate(io, patient);
    if (oldStatus !== patient.status) {
      emitStatusChange(io, patient, oldStatus);
    }
  }

  res.json({
    success: true,
    message: 'Patient updated successfully',
    data: { patient }
  });
}));

/**
 * @route   PUT /api/patients/:id/assign
 * @desc    Assign a doctor to a patient
 * @access  Private (Doctors and Admins)
 */
router.put('/:id/assign', authenticate, authorize(...DOCTOR_OR_ADMIN), validateObjectId('id'), asyncHandler(async (req, res) => {
  const { doctorId } = req.body;

  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // If no doctorId provided, assign current user (if they're a doctor)
  const assigneeId = doctorId || (req.user.role === 'DOCTOR' ? req.userId : null);

  if (!assigneeId) {
    throw new AppError('Doctor ID is required', 400);
  }

  patient.assignedDoctor = assigneeId;
  if (patient.status === 'Incoming') {
    patient.status = 'Triaged';
  }
  
  await patient.save();
  await patient.populate('submittedBy', 'name role');
  await patient.populate('assignedDoctor', 'name email');

  // Emit Socket.IO event
  const io = req.app.get('io');
  if (io) {
    emitPatientUpdate(io, patient);
  }

  res.json({
    success: true,
    message: 'Doctor assigned successfully',
    data: { patient }
  });
}));

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient record
 * @access  Private (Admins only)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), validateObjectId('id'), asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.json({
    success: true,
    message: 'Patient record deleted successfully'
  });
}));

module.exports = router;
