/**
 * User Management Routes
 * Admin routes for managing users
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  authenticate,
  authorize,
  validateObjectId,
  asyncHandler,
  AppError,
  ADMIN_ONLY,
  DOCTOR_OR_ADMIN
} = require('../middleware');

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination)
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize(...ADMIN_ONLY), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search
  } = req.query;

  // Build query
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users,
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
 * @route   GET /api/users/doctors
 * @desc    Get all doctors (for assignment dropdown)
 * @access  Private (Doctors and Admins)
 */
router.get('/doctors', authenticate, authorize(...DOCTOR_OR_ADMIN), asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'DOCTOR', isActive: true })
    .select('name email department')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { doctors }
  });
}));

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize(...ADMIN_ONLY), validateObjectId('id'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user (Admin)
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize(...ADMIN_ONLY), validateObjectId('id'), asyncHandler(async (req, res) => {
  const { name, role, department, isActive } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (role) updates.role = role;
  if (department) updates.department = department;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
}));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(...ADMIN_ONLY), validateObjectId('id'), asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.userId.toString()) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate a user account
 * @access  Private (Admin only)
 */
router.put('/:id/deactivate', authenticate, authorize(...ADMIN_ONLY), validateObjectId('id'), asyncHandler(async (req, res) => {
  if (req.params.id === req.userId.toString()) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deactivated successfully',
    data: { user }
  });
}));

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate a user account
 * @access  Private (Admin only)
 */
router.put('/:id/activate', authenticate, authorize(...ADMIN_ONLY), validateObjectId('id'), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User activated successfully',
    data: { user }
  });
}));

module.exports = router;
