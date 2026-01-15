import SubmissionRepository from '../repositories/SubmissionRepository.js';
import Student from '../models/Student.js';
import Activity from '../models/Activity.js';
import { HTTP_STATUS, SUBMISSION_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Submit Speaking Activity (FR2)
 * @route   POST /api/submissions/speaking
 * @access  Private (Student)
 */
export const submitSpeakingActivity = asyncHandler(async (req, res) => {
  const { activityId, content } = req.body;
  const audioFile = req.file;

  // Verify user is a student
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new AppError('Only students can submit activities', HTTP_STATUS.FORBIDDEN);
  }

  // Verify activity exists and is active
  const activity = await Activity.findById(activityId);
  if (!activity || !activity.isActive) {
    throw new AppError('Activity not found or inactive', HTTP_STATUS.NOT_FOUND);
  }

  if (activity.activityType !== 'speaking') {
    throw new AppError('This activity is not a speaking activity', HTTP_STATUS.BAD_REQUEST);
  }

  // Verify audio file was uploaded
  if (!audioFile) {
    throw new AppError('Audio file is required for speaking activity', HTTP_STATUS.BAD_REQUEST);
  }

  // Calculate audio duration (mock - in real app would use audio processing library)
  const duration = Math.floor(Math.random() * 180) + 60; // Mock: 60-240 seconds

  // Create submission
  const submission = await SubmissionRepository.create({
    studentId: student._id,
    activityId: activityId,
    contentType: 'speaking',
    content: {
      audioUrl: audioFile.path,
      originalName: audioFile.originalname,
      duration: duration,
      fileSize: audioFile.size,
      transcript: content?.transcript || '', // Optional transcript from speech-to-text
    },
    status: SUBMISSION_STATUS.PENDING,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Speaking submission created: ${submission.submissionId} by student ${student.studentId}`
  );

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        submission: {
          id: submission._id,
          submissionId: submission.submissionId,
          activityId: submission.activityId,
          contentType: submission.contentType,
          status: submission.status,
          submittedAt: submission.submittedAt,
        },
      },
      'Speaking activity submitted successfully. Evaluation in progress.'
    )
  );
});

/**
 * @desc    Submit Writing Activity (FR3)
 * @route   POST /api/submissions/writing
 * @access  Private (Student)
 */
export const submitWritingActivity = asyncHandler(async (req, res) => {
  const { activityId, content } = req.body;

  // Verify user is a student
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new AppError('Only students can submit activities', HTTP_STATUS.FORBIDDEN);
  }

  // Verify activity exists and is active
  const activity = await Activity.findById(activityId);
  if (!activity || !activity.isActive) {
    throw new AppError('Activity not found or inactive', HTTP_STATUS.NOT_FOUND);
  }

  if (activity.activityType !== 'writing') {
    throw new AppError('This activity is not a writing activity', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate writing content
  if (!content || !content.text || content.text.trim().length < 10) {
    throw new AppError(
      'Writing text is required and must be at least 10 characters',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Calculate word count and character count
  const text = content.text.trim();
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const characterCount = text.length;

  // Create submission
  const submission = await SubmissionRepository.create({
    studentId: student._id,
    activityId: activityId,
    contentType: 'writing',
    content: {
      text: text,
      wordCount: wordCount,
      characterCount: characterCount,
      title: content.title || 'Untitled',
    },
    status: SUBMISSION_STATUS.PENDING,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Writing submission created: ${submission.submissionId} by student ${student.studentId}`
  );

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        submission: {
          id: submission._id,
          submissionId: submission.submissionId,
          activityId: submission.activityId,
          contentType: submission.contentType,
          status: submission.status,
          wordCount: wordCount,
          characterCount: characterCount,
          submittedAt: submission.submittedAt,
        },
      },
      'Writing activity submitted successfully. Evaluation in progress.'
    )
  );
});

/**
 * @desc    Submit Quiz Activity (FR4)
 * @route   POST /api/submissions/quiz
 * @access  Private (Student)
 */
export const submitQuizActivity = asyncHandler(async (req, res) => {
  const { activityId, content } = req.body;

  // Verify user is a student
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new AppError('Only students can submit activities', HTTP_STATUS.FORBIDDEN);
  }

  // Verify activity exists and is active
  const activity = await Activity.findById(activityId);
  if (!activity || !activity.isActive) {
    throw new AppError('Activity not found or inactive', HTTP_STATUS.NOT_FOUND);
  }

  if (activity.activityType !== 'quiz') {
    throw new AppError('This activity is not a quiz activity', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate quiz answers
  if (!content || !content.answers || !Array.isArray(content.answers)) {
    throw new AppError('Quiz answers are required', HTTP_STATUS.BAD_REQUEST);
  }

  // Verify all questions are answered
  const questionCount = activity.questions.length;
  const answeredCount = content.answers.length;

  if (answeredCount !== questionCount) {
    throw new AppError(
      `All ${questionCount} questions must be answered. You answered ${answeredCount}.`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Create submission
  const submission = await SubmissionRepository.create({
    studentId: student._id,
    activityId: activityId,
    contentType: 'quiz',
    content: {
      answers: content.answers.map((answer, index) => ({
        questionIndex: index,
        questionId: activity.questions[index]._id,
        answer: answer,
        submittedAt: new Date(),
      })),
      totalQuestions: questionCount,
      timeTaken: content.timeTaken || null, // Time in seconds
    },
    status: SUBMISSION_STATUS.PENDING,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Quiz submission created: ${submission.submissionId} by student ${student.studentId}`
  );

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        submission: {
          id: submission._id,
          submissionId: submission.submissionId,
          activityId: submission.activityId,
          contentType: submission.contentType,
          status: submission.status,
          totalQuestions: questionCount,
          submittedAt: submission.submittedAt,
        },
      },
      'Quiz submitted successfully. Evaluation in progress.'
    )
  );
});

/**
 * @desc    Get submission by ID
 * @route   GET /api/submissions/:id
 * @access  Private
 */
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await SubmissionRepository.findById(req.params.id);

  if (!submission) {
    throw new AppError('Submission not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check permission: Student can only view their own, Teachers/Admins can view all
  const student = await Student.findOne({ userId: req.user._id });

  if (req.user.role === USER_ROLES.STUDENT) {
    if (!student || submission.studentId.toString() !== student._id.toString()) {
      throw new AppError('You can only view your own submissions', HTTP_STATUS.FORBIDDEN);
    }
  }

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse({ submission }));
});

/**
 * @desc    Get student's submissions
 * @route   GET /api/submissions/student/me
 * @access  Private (Student)
 */
export const getMySubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new AppError('Student profile not found', HTTP_STATUS.NOT_FOUND);
  }

  const result = await SubmissionRepository.findByStudent(student._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(result, 'Submissions retrieved successfully')
  );
});

/**
 * @desc    Get submissions for an activity
 * @route   GET /api/submissions/activity/:activityId
 * @access  Private (Teacher, Admin)
 */
export const getActivitySubmissions = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const result = await SubmissionRepository.findByActivity(activityId, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(result, 'Activity submissions retrieved successfully')
  );
});

/**
 * @desc    Delete submission
 * @route   DELETE /api/submissions/:id
 * @access  Private (Student - own only, Admin - all)
 */
export const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await SubmissionRepository.findById(req.params.id);

  if (!submission) {
    throw new AppError('Submission not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check permission
  if (req.user.role === USER_ROLES.STUDENT) {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || submission.studentId.toString() !== student._id.toString()) {
      throw new AppError('You can only delete your own submissions', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Only allow deletion if not yet evaluated
  if (submission.status === SUBMISSION_STATUS.COMPLETED) {
    throw new AppError('Cannot delete evaluated submissions', HTTP_STATUS.BAD_REQUEST);
  }

  await SubmissionRepository.delete(req.params.id);

  logger.info(`Submission deleted: ${submission.submissionId} by user ${req.user._id}`);

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse(null, 'Submission deleted successfully'));
});

export default {
  submitSpeakingActivity,
  submitWritingActivity,
  submitQuizActivity,
  getSubmission,
  getMySubmissions,
  getActivitySubmissions,
  deleteSubmission,
};
