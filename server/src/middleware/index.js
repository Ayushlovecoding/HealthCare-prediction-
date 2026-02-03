/**
 * Middleware Index
 * Export all middleware from a single point
 */
const { authenticate, generateToken, optionalAuth } = require('./auth');
const { authorize, requireMinRole, authorizeOwnerOrRole, DOCTOR_OR_ADMIN, PARAMEDIC_OR_ABOVE, ADMIN_ONLY } = require('./rbac');
const { validateRegister, validateLogin, validatePatient, validateObjectId } = require('./validation');
const { AppError, errorHandler, notFound, asyncHandler } = require('./errorHandler');

module.exports = {
  // Authentication
  authenticate,
  generateToken,
  optionalAuth,
  
  // Role-Based Access Control
  authorize,
  requireMinRole,
  authorizeOwnerOrRole,
  DOCTOR_OR_ADMIN,
  PARAMEDIC_OR_ABOVE,
  ADMIN_ONLY,
  
  // Validation
  validateRegister,
  validateLogin,
  validatePatient,
  validateObjectId,
  
  // Error Handling
  AppError,
  errorHandler,
  notFound,
  asyncHandler
};
