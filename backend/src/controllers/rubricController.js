import Rubric from '../models/Rubric.js';
import Teacher from '../models/Teacher.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Create rubric (FR12)
 * @route   POST /api/rubrics
 * @access  Private (Teacher, Admin)
 */
export const createRubric = asyncHandler(async (req, res) => {
  const { name, activityType, criteria, isTemplate } = req.body;

  // Get teacher profile
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher && req.user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Teacher profile not found', HTTP_STATUS.NOT_FOUND);
  }

  // Validate criteria weights sum to 1.0
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new AppError('Criteria weights must sum to 1.0', HTTP_STATUS.BAD_REQUEST);
  }

  // Create rubric
  const rubric = await Rubric.create({
    name,
    activityType,
    criteria,
    isTemplate: isTemplate || false,
    createdBy: teacher?._id || req.user._id,
  });

  logger.info(`Rubric created: ${rubric.rubricId} by ${req.user.email}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      { rubric },
      'Rubric created successfully'
    )
  );
});

/**
 * @desc    Get all rubrics
 * @route   GET /api/rubrics
 * @access  Private
 */
export const getRubrics = asyncHandler(async (req, res) => {
  const { activityType, isTemplate, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };

  if (activityType) {
    query.activityType = activityType;
  }

  if (isTemplate !== undefined) {
    query.isTemplate = isTemplate === 'true';
  }

  // Teachers can only see their own rubrics and templates
  if (req.user.role === USER_ROLES.TEACHER) {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    query.$or = [
      { createdBy: teacher._id },
      { isTemplate: true }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [rubrics, total] = await Promise.all([
    Rubric.find(query)
      .populate('createdBy', 'teacherId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Rubric.countDocuments(query),
  ]);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        rubrics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Rubrics retrieved successfully'
    )
  );
});

/**
 * @desc    Get rubric by ID
 * @route   GET /api/rubrics/:id
 * @access  Private
 */
export const getRubric = asyncHandler(async (req, res) => {
  const rubric = await Rubric.findById(req.params.id).populate('createdBy', 'teacherId');

  if (!rubric) {
    throw new AppError('Rubric not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse({ rubric }));
});

/**
 * @desc    Update rubric
 * @route   PUT /api/rubrics/:id
 * @access  Private (Teacher - own, Admin - all)
 */
export const updateRubric = asyncHandler(async (req, res) => {
  const { name, criteria, isTemplate, isActive } = req.body;

  const rubric = await Rubric.findById(req.params.id);

  if (!rubric) {
    throw new AppError('Rubric not found', HTTP_STATUS.NOT_FOUND);
  }

  // Permission check: Teacher can only update their own
  if (req.user.role === USER_ROLES.TEACHER) {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || rubric.createdBy.toString() !== teacher._id.toString()) {
      throw new AppError('You can only update your own rubrics', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Update fields
  if (name) rubric.name = name;
  if (criteria) {
    // Validate weights
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new AppError('Criteria weights must sum to 1.0', HTTP_STATUS.BAD_REQUEST);
    }
    rubric.criteria = criteria;
  }
  if (isTemplate !== undefined) rubric.isTemplate = isTemplate;
  if (isActive !== undefined) rubric.isActive = isActive;

  await rubric.save();

  logger.info(`Rubric updated: ${rubric.rubricId} by ${req.user.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { rubric },
      'Rubric updated successfully'
    )
  );
});

/**
 * @desc    Delete rubric
 * @route   DELETE /api/rubrics/:id
 * @access  Private (Teacher - own, Admin - all)
 */
export const deleteRubric = asyncHandler(async (req, res) => {
  const rubric = await Rubric.findById(req.params.id);

  if (!rubric) {
    throw new AppError('Rubric not found', HTTP_STATUS.NOT_FOUND);
  }

  // Permission check: Teacher can only delete their own
  if (req.user.role === USER_ROLES.TEACHER) {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || rubric.createdBy.toString() !== teacher._id.toString()) {
      throw new AppError('You can only delete your own rubrics', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Soft delete: set isActive to false
  rubric.isActive = false;
  await rubric.save();

  logger.info(`Rubric deleted (soft): ${rubric.rubricId} by ${req.user.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      null,
      'Rubric deleted successfully'
    )
  );
});

/**
 * @desc    Get template rubrics
 * @route   GET /api/rubrics/templates/:activityType
 * @access  Private
 */
export const getTemplateRubrics = asyncHandler(async (req, res) => {
  const { activityType } = req.params;

  const templates = await Rubric.find({
    activityType,
    isTemplate: true,
    isActive: true,
  }).populate('createdBy', 'teacherId');

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { templates, count: templates.length },
      'Template rubrics retrieved successfully'
    )
  );
});

/**
 * @desc    Duplicate rubric (create from template)
 * @route   POST /api/rubrics/:id/duplicate
 * @access  Private (Teacher, Admin)
 */
export const duplicateRubric = asyncHandler(async (req, res) => {
  const originalRubric = await Rubric.findById(req.params.id);

  if (!originalRubric) {
    throw new AppError('Rubric not found', HTTP_STATUS.NOT_FOUND);
  }

  // Get teacher profile
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher && req.user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Teacher profile not found', HTTP_STATUS.NOT_FOUND);
  }

  // Create duplicate
  const duplicateRubric = await Rubric.create({
    name: `${originalRubric.name} (Copy)`,
    activityType: originalRubric.activityType,
    criteria: originalRubric.criteria,
    isTemplate: false,
    createdBy: teacher?._id || req.user._id,
  });

  logger.info(`Rubric duplicated: ${duplicateRubric.rubricId} from ${originalRubric.rubricId}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      { rubric: duplicateRubric },
      'Rubric duplicated successfully'
    )
  );
});

export default {
  createRubric,
  getRubrics,
  getRubric,
  updateRubric,
  deleteRubric,
  getTemplateRubrics,
  duplicateRubric,
};
