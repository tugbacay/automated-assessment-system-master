import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Role-based access control middleware
 * Checks if authenticated user has required role(s)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Authorization attempted without authentication');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized. Please login first.',
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Authorization failed: User ${req.user._id} with role ${req.user.role} attempted to access ${req.path}`
      );
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.',
      });
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Check if user is a student
 */
export const isStudent = authorize(USER_ROLES.STUDENT);

/**
 * Check if user is a teacher
 */
export const isTeacher = authorize(USER_ROLES.TEACHER);

/**
 * Check if user is an admin
 */
export const isAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is teacher or admin
 */
export const isTeacherOrAdmin = authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN);

/**
 * Resource ownership check middleware
 * Ensures user can only access their own resources
 */
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    // Admins can access all resources
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Get resource user ID from request body, params, or query
    const resourceUserId =
      req.body[resourceUserIdField] ||
      req.params[resourceUserIdField] ||
      req.query[resourceUserIdField];

    // Check if user owns the resource
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      logger.warn(
        `Ownership check failed: User ${req.user._id} attempted to access resource owned by ${resourceUserId}`
      );
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Forbidden. You can only access your own resources.',
      });
    }

    next();
  };
};

export default {
  authorize,
  isStudent,
  isTeacher,
  isAdmin,
  isTeacherOrAdmin,
  checkOwnership,
};
