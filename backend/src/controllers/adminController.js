import UserRepository from '../repositories/UserRepository.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';
import AnalyticsService from '../services/AnalyticsService.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import bcrypt from 'bcrypt';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get all users (FR18)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, isActive, search } = req.query;

  let result;

  if (search) {
    result = await UserRepository.search(search, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  } else {
    result = await UserRepository.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : null,
    });
  }

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        users: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
      'Users retrieved successfully'
    )
  );
});

/**
 * @desc    Get user by ID (FR18)
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const result = await UserRepository.findByIdWithRoleData(req.params.id);

  if (!result || !result.user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(result, 'User retrieved successfully')
  );
});

/**
 * @desc    Create user (FR18)
 * @route   POST /api/admin/users
 * @access  Private (Admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Check if user already exists
  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', HTTP_STATUS.CONFLICT);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await UserRepository.create({
    email,
    passwordHash,
    name,
    role,
  });

  // Create role-specific profile
  if (role === USER_ROLES.STUDENT) {
    await Student.create({ userId: user._id });
  } else if (role === USER_ROLES.TEACHER) {
    await Teacher.create({ userId: user._id });
  }

  logger.info(`User created by admin: ${user.email} (${user.role})`);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      'User created successfully'
    )
  );
});

/**
 * @desc    Update user (FR18)
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { name, isActive, password } = req.body;

  const updateData = {};

  if (name) updateData.name = name;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    updateData.passwordHash = await bcrypt.hash(password, saltRounds);
  }

  const updatedUser = await UserRepository.update(req.params.id, updateData);

  if (!updatedUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  logger.info(`User updated by admin: ${updatedUser.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      },
      'User updated successfully'
    )
  );
});

/**
 * @desc    Delete user (FR18)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  // Soft delete
  const deletedUser = await UserRepository.delete(req.params.id);

  if (!deletedUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  logger.info(`User deleted (soft) by admin: ${deletedUser.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(null, 'User deactivated successfully')
  );
});

/**
 * @desc    Get audit logs (FR19)
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { userId, action, entityType, startDate, endDate, page = 1, limit = 50 } = req.query;

  const result = await AuditLogRepository.findAll({
    userId,
    action,
    entityType,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        logs: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
      'Audit logs retrieved successfully'
    )
  );
});

/**
 * @desc    Get audit statistics (FR19)
 * @route   GET /api/admin/audit-logs/stats
 * @access  Private (Admin)
 */
export const getAuditStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await AuditLogRepository.getStats({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ stats }, 'Audit statistics retrieved successfully')
  );
});

/**
 * @desc    Get analytics overview (FR20)
 * @route   GET /api/admin/analytics/overview
 * @access  Private (Admin)
 */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const overview = await AnalyticsService.getSystemOverview();

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(overview, 'Analytics overview retrieved successfully')
  );
});

/**
 * @desc    Get submission trends (FR20)
 * @route   GET /api/admin/analytics/trends
 * @access  Private (Admin)
 */
export const getAnalyticsTrends = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;

  const trends = await AnalyticsService.getSubmissionTrends({
    startDate,
    endDate,
    groupBy,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ trends }, 'Analytics trends retrieved successfully')
  );
});

/**
 * @desc    Get user engagement metrics (FR20)
 * @route   GET /api/admin/analytics/engagement
 * @access  Private (Admin)
 */
export const getEngagementMetrics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const engagement = await AnalyticsService.getUserEngagement({
    startDate,
    endDate,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(engagement, 'Engagement metrics retrieved successfully')
  );
});

/**
 * @desc    Get teacher performance (FR20)
 * @route   GET /api/admin/analytics/teachers
 * @access  Private (Admin)
 */
export const getTeacherPerformance = asyncHandler(async (req, res) => {
  const performance = await AnalyticsService.getTeacherPerformance();

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ teachers: performance }, 'Teacher performance retrieved successfully')
  );
});

/**
 * @desc    Get performance distribution (FR20)
 * @route   GET /api/admin/analytics/distribution
 * @access  Private (Admin)
 */
export const getPerformanceDistribution = asyncHandler(async (req, res) => {
  const distribution = await AnalyticsService.getPerformanceDistribution();

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { distribution },
      'Performance distribution retrieved successfully'
    )
  );
});

/**
 * @desc    Export analytics data (FR15)
 * @route   GET /api/admin/analytics/export
 * @access  Private (Admin)
 */
export const exportAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  const analyticsData = await AnalyticsService.exportAnalyticsData({
    startDate,
    endDate,
    format,
  });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.send(analyticsData);
  } else {
    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(analyticsData, 'Analytics data exported successfully')
    );
  }
});

/**
 * @desc    Mock AI model retraining (FR17)
 * @route   POST /api/admin/model/retrain
 * @access  Private (Admin)
 */
export const retrainModel = asyncHandler(async (req, res) => {
  const { modelType = 'all' } = req.body;

  logger.info(`Mock AI model retraining initiated by admin ${req.user._id} for ${modelType}`);

  // Simulate model retraining (mock implementation)
  const mockResult = {
    modelType,
    version: `v${Date.now()}`,
    status: 'completed',
    startedAt: new Date(Date.now() - 5000),
    completedAt: new Date(),
    improvements: {
      accuracy: '+2.5%',
      precision: '+1.8%',
      recall: '+2.1%',
    },
    metricsBeforeUpdate: {
      accuracy: 0.85,
      precision: 0.83,
      recall: 0.84,
    },
    metricsAfterUpdate: {
      accuracy: 0.875,
      precision: 0.848,
      recall: 0.861,
    },
  };

  logger.info(`Mock model retraining completed: ${modelType} - ${mockResult.version}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(mockResult, 'Model retraining completed successfully (mock)')
  );
});

export default {
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
};
