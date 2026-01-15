import express from 'express';
import {
  createRubric,
  getRubrics,
  getRubric,
  updateRubric,
  deleteRubric,
  getTemplateRubrics,
  duplicateRubric,
} from '../controllers/rubricController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isTeacherOrAdmin } from '../middleware/roleMiddleware.js';
import { mongoIdValidation, rubricValidation, updateRubricValidation } from '../utils/validators.js';
import { auditLog } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   POST /api/rubrics
 * @desc    Create new rubric (FR12)
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/',
  authenticate,
  isTeacherOrAdmin,
  rubricValidation,
  auditLog(AUDIT_ACTIONS.CREATE, 'Rubric'),
  createRubric
);

/**
 * @route   GET /api/rubrics/templates/:activityType
 * @desc    Get template rubrics for activity type
 * @access  Private
 */
router.get('/templates/:activityType', authenticate, getTemplateRubrics);

/**
 * @route   POST /api/rubrics/:id/duplicate
 * @desc    Duplicate rubric (create from template)
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/:id/duplicate',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.CREATE, 'Rubric'),
  duplicateRubric
);

/**
 * @route   GET /api/rubrics
 * @desc    Get all rubrics with filters
 * @access  Private
 */
router.get('/', authenticate, getRubrics);

/**
 * @route   GET /api/rubrics/:id
 * @desc    Get rubric by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdValidation, getRubric);

/**
 * @route   PUT /api/rubrics/:id
 * @desc    Update rubric
 * @access  Private (Teacher - own, Admin - all)
 */
router.put(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  updateRubricValidation,
  auditLog(AUDIT_ACTIONS.UPDATE, 'Rubric'),
  updateRubric
);

/**
 * @route   DELETE /api/rubrics/:id
 * @desc    Delete rubric (soft delete)
 * @access  Private (Teacher - own, Admin - all)
 */
router.delete(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.DELETE, 'Rubric'),
  deleteRubric
);

export default router;
