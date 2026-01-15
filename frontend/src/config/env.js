// Environment configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const NODE_ENV = process.env.REACT_APP_ENV || 'development';
export const UPLOAD_MAX_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Submissions
  SUBMISSIONS: {
    SPEAKING: '/submissions/speaking',
    WRITING: '/submissions/writing',
    QUIZ: '/submissions/quiz',
    BY_ID: (id) => `/submissions/${id}`,
    STUDENT_ME: '/submissions/student/me',
    BY_ACTIVITY: (activityId) => `/submissions/activity/${activityId}`,
  },

  // Evaluations
  EVALUATIONS: {
    PENDING_REVIEW: '/evaluations/pending-review',
    EVALUATE: (submissionId) => `/evaluations/evaluate/${submissionId}`,
    RETRY: (submissionId) => `/evaluations/retry/${submissionId}`,
    BY_SUBMISSION: (submissionId) => `/evaluations/submission/${submissionId}`,
    MISTAKES: (id) => `/evaluations/${id}/mistakes`,
    REVIEW: (id) => `/evaluations/${id}/review`,
    BY_ID: (id) => `/evaluations/${id}`,
  },

  // Progress
  PROGRESS: {
    SUMMARY_ME: '/progress/summary/me',
    WEEKLY: (studentId) => `/progress/weekly/${studentId}`,
    VISUALIZATION: (studentId) => `/progress/visualization/${studentId}`,
    REPORTS: (studentId) => `/progress/reports/${studentId}`,
    BATCH_GENERATE: '/progress/batch-generate',
  },

  // Rubrics
  RUBRICS: {
    LIST: '/rubrics',
    CREATE: '/rubrics',
    BY_ID: (id) => `/rubrics/${id}`,
    UPDATE: (id) => `/rubrics/${id}`,
    DELETE: (id) => `/rubrics/${id}`,
    TEMPLATES: (activityType) => `/rubrics/templates/${activityType}`,
    DUPLICATE: (id) => `/rubrics/${id}/duplicate`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    AUDIT_LOGS: '/admin/audit-logs',
    AUDIT_STATS: '/admin/audit-logs/stats',
    ANALYTICS_OVERVIEW: '/admin/analytics/overview',
    ANALYTICS_TRENDS: '/admin/analytics/trends',
    ANALYTICS_ENGAGEMENT: '/admin/analytics/engagement',
    ANALYTICS_TEACHERS: '/admin/analytics/teachers',
    ANALYTICS_DISTRIBUTION: '/admin/analytics/distribution',
    ANALYTICS_EXPORT: '/admin/analytics/export',
    MODEL_RETRAIN: '/admin/model/retrain',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
  },
};

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// Activity Types
export const ACTIVITY_TYPES = {
  SPEAKING: 'speaking',
  WRITING: 'writing',
  QUIZ: 'quiz',
};

// Submission Status
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  EVALUATING: 'evaluating',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Error Types
export const ERROR_TYPES = {
  GRAMMAR: 'grammar',
  VOCABULARY: 'vocabulary',
  PRONUNCIATION: 'pronunciation',
  LOGIC: 'logic',
  SPELLING: 'spelling',
  PUNCTUATION: 'punctuation',
};

// Severity Levels
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  EVALUATION_COMPLETED: 'evaluation_completed',
  FEEDBACK_READY: 'feedback_ready',
  TEACHER_REVIEW: 'teacher_review',
  WEEKLY_REPORT: 'weekly_report',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

// Routes
export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',

  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_ACTIVITIES: '/student/activities',
  STUDENT_ACTIVITY_DETAIL: (id) => `/student/activities/${id}`,
  STUDENT_SPEAKING_SUBMISSION: (id) => `/student/activities/${id}/speaking`,
  STUDENT_WRITING_SUBMISSION: (id) => `/student/activities/${id}/writing`,
  STUDENT_QUIZ_SUBMISSION: (id) => `/student/activities/${id}/quiz`,
  STUDENT_SUBMISSIONS: '/student/submissions',
  STUDENT_SUBMISSION_DETAIL: (id) => `/student/submissions/${id}`,
  STUDENT_PROGRESS: '/student/progress',
  STUDENT_PROFILE: '/student/profile',

  // Teacher
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_ACTIVITIES: '/teacher/activities',
  TEACHER_CREATE_ACTIVITY: '/teacher/activities/create',
  TEACHER_EDIT_ACTIVITY: (id) => `/teacher/activities/edit/${id}`,
  TEACHER_RUBRICS: '/teacher/rubrics',
  TEACHER_CREATE_RUBRIC: '/teacher/rubrics/create',
  TEACHER_EDIT_RUBRIC: (id) => `/teacher/rubrics/edit/${id}`,
  TEACHER_PENDING_REVIEWS: '/teacher/reviews',
  TEACHER_EVALUATION_REVIEW: (id) => `/teacher/reviews/${id}`,
  TEACHER_STUDENTS: '/teacher/students',
  TEACHER_STUDENT_DETAIL: (id) => `/teacher/students/${id}`,
  TEACHER_ANALYTICS: '/teacher/analytics',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SYSTEM_ANALYTICS: '/admin/analytics/system',
  ADMIN_SUBMISSION_ANALYTICS: '/admin/analytics/submissions',
  ADMIN_USER_ENGAGEMENT: '/admin/analytics/engagement',
  ADMIN_TEACHER_PERFORMANCE: '/admin/analytics/teachers',
  ADMIN_PERFORMANCE_DISTRIBUTION: '/admin/analytics/distribution',
  ADMIN_AI_MODEL: '/admin/model',
  ADMIN_EXPORT: '/admin/export',
};
