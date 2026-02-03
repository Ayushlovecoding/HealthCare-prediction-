/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 */

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  PARAMEDIC: 1,
  DOCTOR: 2,
  ADMIN: 3
};

/**
 * Restrict access to specific roles
 * @param  {...string} allowedRoles - Roles that can access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires ${allowedRoles.join(' or ')} role.`
      });
    }

    next();
  };
};

/**
 * Require minimum role level
 * @param {string} minimumRole - Minimum role required
 */
const requireMinRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Requires at least ${minimumRole} role.`
      });
    }

    next();
  };
};

/**
 * Check if user is owner or has higher role
 * Useful for allowing users to edit their own resources
 */
const authorizeOwnerOrRole = (ownerField, ...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Allow if user is owner
    const ownerId = req.params[ownerField] || req.body[ownerField];
    if (ownerId && req.user._id.toString() === ownerId.toString()) {
      return next();
    }

    // Allow if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

// Predefined role combinations
const DOCTOR_OR_ADMIN = ['DOCTOR', 'ADMIN'];
const PARAMEDIC_OR_ABOVE = ['PARAMEDIC', 'DOCTOR', 'ADMIN'];
const ADMIN_ONLY = ['ADMIN'];

module.exports = {
  authorize,
  requireMinRole,
  authorizeOwnerOrRole,
  DOCTOR_OR_ADMIN,
  PARAMEDIC_OR_ABOVE,
  ADMIN_ONLY,
  ROLE_HIERARCHY
};
