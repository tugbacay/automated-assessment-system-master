import express from 'express';
import {
  submitSpeakingActivity,
  submitWritingActivity,
  submitQuizActivity,
  getSubmission,
  getMySubmissions,
  getActivitySubmissions,
  deleteSubmission,
} from '../controllers/submissionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, isStudent, isTeacherOrAdmin } from '../middleware/roleMiddleware.js';
import { uploadAudio, handleUploadError } from '../middleware/uploadMiddleware.js';
import { submissionValidation, mongoIdValidation } from '../utils/validators.js';
import { auditLog } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   POST /api/submissions/speaking
 * @desc    Submit speaking activity (FR2)
 * @access  Private (Student)
 */
router.post(
  '/speaking',
  authenticate,
  isStudent,
  uploadAudio,
  handleUploadError,
  auditLog(AUDIT_ACTIONS.CREATE, 'Submission'),
  submitSpeakingActivity
);

/**
 * @route   POST /api/submissions/writing
 * @desc    Submit writing activity (FR3)
 * @access  Private (Student)
 */
router.post(
  '/writing',
  authenticate,
  isStudent,
  auditLog(AUDIT_ACTIONS.CREATE, 'Submission'),
  submitWritingActivity
);

/**
 * @route   POST /api/submissions/quiz
 * @desc    Submit quiz activity (FR4)
 * @access  Private (Student)
 */
router.post(
  '/quiz',
  authenticate,
  isStudent,
  auditLog(AUDIT_ACTIONS.CREATE, 'Submission'),
  submitQuizActivity
);

/**
 * @route   GET /api/submissions/student/me
 * @desc    Get current student's submissions
 * @access  Private (Student)
 */
router.get('/student/me', authenticate, isStudent, getMySubmissions);

/**
 * @route   GET /api/submissions/activity/:activityId
 * @desc    Get all submissions for an activity
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/activity/:activityId',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  getActivitySubmissions
);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdValidation, getSubmission);

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Delete submission
 * @access  Private (Student - own, Admin - all)
 */
router.delete(
  '/:id',
  authenticate,
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.DELETE, 'Submission'),
  deleteSubmission
);

export default router;
