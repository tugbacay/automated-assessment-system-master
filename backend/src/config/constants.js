export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

export const ACTIVITY_TYPES = {
  SPEAKING: 'speaking',
  WRITING: 'writing',
  QUIZ: 'quiz',
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  EVALUATING: 'evaluating',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ERROR_TYPES = {
  GRAMMAR: 'grammar',
  VOCABULARY: 'vocabulary',
  PRONUNCIATION: 'pronunciation',
  LOGIC: 'logic',
  SPELLING: 'spelling',
  PUNCTUATION: 'punctuation',
};

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
};

export const NOTIFICATION_TYPES = {
  EVALUATION_COMPLETED: 'evaluation_completed',
  FEEDBACK_READY: 'feedback_ready',
  TEACHER_REVIEW: 'teacher_review',
  WEEKLY_REPORT: 'weekly_report',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests
  },
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads
  },
};

export const FILE_LIMITS = {
  MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE || 10 * 1024 * 1024, // 10MB
  ALLOWED_AUDIO_FORMATS: ['mp3', 'wav', 'ogg', 'm4a'],
  ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif'],
  ALLOWED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx'],
};

export default {
  USER_ROLES,
  ACTIVITY_TYPES,
  SUBMISSION_STATUS,
  ERROR_TYPES,
  SEVERITY_LEVELS,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
  HTTP_STATUS,
  RATE_LIMITS,
  FILE_LIMITS,
};
