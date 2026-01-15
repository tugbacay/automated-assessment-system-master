import ProgressTrackingService from '../services/ProgressTrackingService.js';
import ProgressReport from '../models/ProgressReport.js';
import Student from '../models/Student.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get weekly progress report (FR9)
 * @route   GET /api/progress/weekly/:studentId
 * @access  Private (Student - own, Teacher/Admin - all)
 */
export const getWeeklyReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { week, year } = req.query;

  // Permission check
  if (req.user.role === USER_ROLES.STUDENT) {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new AppError('You can only view your own progress reports', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Generate or retrieve report
  const report = await ProgressTrackingService.generateWeeklyReport(
    studentId,
    week ? parseInt(week) : null,
    year ? parseInt(year) : null
  );

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { report },
      'Weekly progress report retrieved successfully'
    )
  );
});

/**
 * @desc    Get progress summary with visualization data (FR10)
 * @route   GET /api/progress/visualization/:studentId
 * @access  Private (Student - own, Teacher/Admin - all)
 */
export const getProgressVisualization = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate, limit } = req.query;

  // Permission check
  if (req.user.role === USER_ROLES.STUDENT) {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new AppError('You can only view your own progress data', HTTP_STATUS.FORBIDDEN);
    }
  }

  const visualizationData = await ProgressTrackingService.getProgressSummary(studentId, {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 12,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      visualizationData,
      'Progress visualization data retrieved successfully'
    )
  );
});

/**
 * @desc    Get current student's progress summary
 * @route   GET /api/progress/summary/me
 * @access  Private (Student)
 */
export const getMyProgressSummary = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });

  if (!student) {
    throw new AppError('Student profile not found', HTTP_STATUS.NOT_FOUND);
  }

  const { limit } = req.query;

  const summary = await ProgressTrackingService.getProgressSummary(student._id, {
    limit: limit ? parseInt(limit) : 12,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      summary,
      'Progress summary retrieved successfully'
    )
  );
});

/**
 * @desc    Get all progress reports for a student
 * @route   GET /api/progress/reports/:studentId
 * @access  Private (Student - own, Teacher/Admin - all)
 */
export const getStudentReports = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { page = 1, limit = 10, year } = req.query;

  // Permission check
  if (req.user.role === USER_ROLES.STUDENT) {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new AppError('You can only view your own reports', HTTP_STATUS.FORBIDDEN);
    }
  }

  const query = { studentId };
  if (year) {
    query.year = parseInt(year);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reports, total] = await Promise.all([
    ProgressReport.find(query)
      .sort({ year: -1, weekNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ProgressReport.countDocuments(query),
  ]);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Progress reports retrieved successfully'
    )
  );
});

/**
 * @desc    Trigger batch report generation (admin only)
 * @route   POST /api/progress/batch-generate
 * @access  Private (Admin)
 */
export const batchGenerateReports = asyncHandler(async (req, res) => {
  logger.info(`Batch report generation triggered by admin ${req.user._id}`);

  const results = await ProgressTrackingService.batchGenerateWeeklyReports();

  const successCount = results.filter((r) => r.success).length;

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results,
      },
      `Batch generation completed: ${successCount}/${results.length} reports created`
    )
  );
});

export default {
  getWeeklyReport,
  getProgressVisualization,
  getMyProgressSummary,
  getStudentReports,
  batchGenerateReports,
};
