import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getAuditStats,
  getAnalyticsOverview,
  getAnalyticsTrends,
  getEngagementMetrics,
  getTeacherPerformance,
  getPerformanceDistribution,
  exportAnalytics,
  retrainModel,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';
import {
  registerValidation,
  mongoIdValidation,
  updateUserValidation,
  retrainModelValidation,
} from '../utils/validators.js';
import { auditLog } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * User Management Routes (FR18)
 */

// Get all users
router.get('/users', getAllUsers);

// Create user
router.post(
  '/users',
  registerValidation,
  auditLog(AUDIT_ACTIONS.CREATE, 'User'),
  createUser
);

// Get user by ID
router.get('/users/:id', mongoIdValidation, getUserById);

// Update user
router.put(
  '/users/:id',
  mongoIdValidation,
  updateUserValidation,
  auditLog(AUDIT_ACTIONS.UPDATE, 'User'),
  updateUser
);

// Delete user
router.delete(
  '/users/:id',
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.DELETE, 'User'),
  deleteUser
);

/**
 * Audit Log Routes (FR19)
 */

// Get audit logs
router.get('/audit-logs', getAuditLogs);

// Get audit statistics
router.get('/audit-logs/stats', getAuditStats);

/**
 * Analytics Routes (FR20)
 */

// Get analytics overview
router.get('/analytics/overview', getAnalyticsOverview);

// Get submission trends
router.get('/analytics/trends', getAnalyticsTrends);

// Get user engagement metrics
router.get('/analytics/engagement', getEngagementMetrics);

// Get teacher performance
router.get('/analytics/teachers', getTeacherPerformance);

// Get performance distribution
router.get('/analytics/distribution', getPerformanceDistribution);

// Export analytics data (FR15)
router.get('/analytics/export', exportAnalytics);

/**
 * Model Management Routes (FR17)
 */

// Mock AI model retraining
router.post(
  '/model/retrain',
  retrainModelValidation,
  retrainModel
);

export default router;
