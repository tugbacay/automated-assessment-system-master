import express from 'express';
import {
  getWeeklyReport,
  getProgressVisualization,
  getMyProgressSummary,
  getStudentReports,
  batchGenerateReports,
} from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isStudent, isAdmin, isTeacherOrAdmin } from '../middleware/roleMiddleware.js';
import { mongoIdValidation } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   GET /api/progress/summary/me
 * @desc    Get current student's progress summary
 * @access  Private (Student)
 */
router.get('/summary/me', authenticate, isStudent, getMyProgressSummary);

/**
 * @route   GET /api/progress/weekly/:studentId
 * @desc    Get weekly progress report (FR9)
 * @access  Private
 */
router.get('/weekly/:studentId', authenticate, mongoIdValidation, getWeeklyReport);

/**
 * @route   GET /api/progress/visualization/:studentId
 * @desc    Get progress visualization data (FR10)
 * @access  Private
 */
router.get(
  '/visualization/:studentId',
  authenticate,
  mongoIdValidation,
  getProgressVisualization
);

/**
 * @route   GET /api/progress/reports/:studentId
 * @desc    Get all progress reports for a student
 * @access  Private
 */
router.get('/reports/:studentId', authenticate, mongoIdValidation, getStudentReports);

/**
 * @route   POST /api/progress/batch-generate
 * @desc    Trigger batch report generation for all students
 * @access  Private (Admin)
 */
router.post('/batch-generate', authenticate, isAdmin, batchGenerateReports);

export default router;
