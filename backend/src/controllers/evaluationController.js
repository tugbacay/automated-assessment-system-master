import EvaluationRepository from '../repositories/EvaluationRepository.js';
import Teacher from '../models/Teacher.js';
import Evaluation from '../models/Evaluation.js';
import AIEvaluationService from '../services/AIEvaluationService.js';
import NotificationService from '../services/NotificationService.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get evaluation by ID
 * @route   GET /api/evaluations/:id
 * @access  Private
 */
export const getEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await EvaluationRepository.findById(req.params.id);

  if (!evaluation) {
    throw new AppError('Evaluation not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse({ evaluation }));
});

/**
 * @desc    Get evaluation by submission ID
 * @route   GET /api/evaluations/submission/:submissionId
 * @access  Private
 */
export const getEvaluationBySubmission = asyncHandler(async (req, res) => {
  const evaluation = await EvaluationRepository.findBySubmission(req.params.submissionId);

  if (!evaluation) {
    throw new AppError('Evaluation not found for this submission', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse({ evaluation }));
});

/**
 * @desc    Get mistakes for evaluation
 * @route   GET /api/evaluations/:id/mistakes
 * @access  Private
 */
export const getEvaluationMistakes = asyncHandler(async (req, res) => {
  const Mistake = (await import('../models/Mistake.js')).default;

  const evaluation = await EvaluationRepository.findById(req.params.id);

  if (!evaluation) {
    throw new AppError('Evaluation not found', HTTP_STATUS.NOT_FOUND);
  }

  const mistakes = await Mistake.find({ evaluationId: evaluation._id }).sort({ severity: 1 });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { mistakes, count: mistakes.length },
      'Mistakes retrieved successfully'
    )
  );
});

/**
 * @desc    Teacher review evaluation (FR11)
 * @route   PUT /api/evaluations/:id/review
 * @access  Private (Teacher, Admin)
 */
export const reviewEvaluation = asyncHandler(async (req, res) => {
  const { overallScore, grammarScore, vocabularyScore, pronunciationScore, logicScore, teacherNotes } = req.body;

  // Get teacher profile
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher && req.user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Teacher profile not found', HTTP_STATUS.NOT_FOUND);
  }

  const evaluation = await Evaluation.findById(req.params.id).populate('submissionId');

  if (!evaluation) {
    throw new AppError('Evaluation not found', HTTP_STATUS.NOT_FOUND);
  }

  if (evaluation.reviewedByTeacher) {
    throw new AppError('This evaluation has already been reviewed', HTTP_STATUS.BAD_REQUEST);
  }

  // Update evaluation with teacher's review
  const updateData = {
    reviewedByTeacher: true,
    teacherId: teacher?._id || null,
    teacherNotes: teacherNotes || '',
  };

  // Update scores if provided
  if (overallScore !== undefined) updateData.overallScore = overallScore;
  if (grammarScore !== undefined) updateData.grammarScore = grammarScore;
  if (vocabularyScore !== undefined) updateData.vocabularyScore = vocabularyScore;
  if (pronunciationScore !== undefined) updateData.pronunciationScore = pronunciationScore;
  if (logicScore !== undefined) updateData.logicScore = logicScore;

  const updatedEvaluation = await EvaluationRepository.update(evaluation._id, updateData);

  // Notify student
  const submission = evaluation.submissionId;
  await NotificationService.notifyTeacherReview(
    submission.studentId,
    evaluation._id,
    teacherNotes
  );

  logger.info(
    `Evaluation ${evaluation.evaluationId} reviewed by teacher ${teacher?.teacherId || 'admin'}`
  );

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { evaluation: updatedEvaluation },
      'Evaluation reviewed successfully'
    )
  );
});

/**
 * @desc    Get evaluations pending teacher review
 * @route   GET /api/evaluations/pending-review
 * @access  Private (Teacher, Admin)
 */
export const getPendingReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await EvaluationRepository.findPendingReview({
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      result,
      'Pending reviews retrieved successfully'
    )
  );
});

/**
 * @desc    Trigger AI evaluation for submission
 * @route   POST /api/evaluations/evaluate/:submissionId
 * @access  Private (Teacher, Admin)
 */
export const triggerEvaluation = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  logger.info(`Manual evaluation triggered for submission ${submissionId} by ${req.user._id}`);

  const evaluation = await AIEvaluationService.evaluateSubmission(submissionId);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      { evaluation },
      'Evaluation completed successfully'
    )
  );
});

/**
 * @desc    Retry failed evaluation
 * @route   POST /api/evaluations/retry/:submissionId
 * @access  Private (Teacher, Admin)
 */
export const retryEvaluation = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  logger.info(`Evaluation retry triggered for submission ${submissionId} by ${req.user._id}`);

  const evaluation = await AIEvaluationService.retryEvaluation(submissionId);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { evaluation },
      'Evaluation retry completed successfully'
    )
  );
});

export default {
  getEvaluation,
  getEvaluationBySubmission,
  getEvaluationMistakes,
  reviewEvaluation,
  getPendingReviews,
  triggerEvaluation,
  retryEvaluation,
};
