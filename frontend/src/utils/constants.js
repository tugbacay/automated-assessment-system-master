// Constants matching backend configuration

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

// UI Constants
export const ITEMS_PER_PAGE = 10;
export const DEBOUNCE_DELAY = 300; // ms
export const POLLING_INTERVAL = 30000; // 30 seconds
export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    MESSAGE: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s]+$/,
    MESSAGE: 'Name must be 2-100 characters and contain only letters',
  },
  RUBRIC_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
    MESSAGE: 'Rubric name must be 3-200 characters',
  },
};

// Score Ranges
export const SCORE_RANGES = {
  EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: '#4caf50' },
  GOOD: { min: 75, max: 89, label: 'Good', color: '#8bc34a' },
  AVERAGE: { min: 60, max: 74, label: 'Average', color: '#ffc107' },
  NEEDS_IMPROVEMENT: { min: 40, max: 59, label: 'Needs Improvement', color: '#ff9800' },
  POOR: { min: 0, max: 39, label: 'Poor', color: '#f44336' },
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
  GRAMMAR: '#3f51b5',
  VOCABULARY: '#9c27b0',
  PRONUNCIATION: '#ff5722',
  LOGIC: '#00bcd4',
};

// Status Colors
export const STATUS_COLORS = {
  [SUBMISSION_STATUS.PENDING]: '#ff9800',
  [SUBMISSION_STATUS.EVALUATING]: '#2196f3',
  [SUBMISSION_STATUS.COMPLETED]: '#4caf50',
  [SUBMISSION_STATUS.FAILED]: '#f44336',
};

// Severity Colors
export const SEVERITY_COLORS = {
  [SEVERITY_LEVELS.CRITICAL]: '#f44336',
  [SEVERITY_LEVELS.MAJOR]: '#ff9800',
  [SEVERITY_LEVELS.MINOR]: '#ffc107',
};

// Role Display Names
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.STUDENT]: 'Student',
  [USER_ROLES.TEACHER]: 'Teacher',
  [USER_ROLES.ADMIN]: 'Administrator',
};

// Activity Type Display Names
export const ACTIVITY_TYPE_DISPLAY_NAMES = {
  [ACTIVITY_TYPES.SPEAKING]: 'Speaking',
  [ACTIVITY_TYPES.WRITING]: 'Writing',
  [ACTIVITY_TYPES.QUIZ]: 'Quiz',
};

// Activity Type Icons
export const ACTIVITY_TYPE_ICONS = {
  [ACTIVITY_TYPES.SPEAKING]: 'mic',
  [ACTIVITY_TYPES.WRITING]: 'edit',
  [ACTIVITY_TYPES.QUIZ]: 'quiz',
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: 'yyyy-MM-dd',
};

// Pagination Options
export const PAGINATION_OPTIONS = [10, 20, 50, 100];

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
};

// Toast Configuration
export const TOAST_CONFIG = {
  POSITION: 'top-right',
  AUTO_CLOSE: 5000,
  HIDE_PROGRESS_BAR: false,
  CLOSE_ON_CLICK: true,
  PAUSEONHOVER: true,
  DRAGGABLE: true,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid audio file.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logout successful!',
  REGISTER: 'Registration successful!',
  SUBMISSION_CREATED: 'Submission created successfully!',
  EVALUATION_COMPLETED: 'Evaluation completed!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  RUBRIC_CREATED: 'Rubric created successfully!',
  RUBRIC_UPDATED: 'Rubric updated successfully!',
  RUBRIC_DELETED: 'Rubric deleted successfully!',
  USER_CREATED: 'User created successfully!',
  USER_UPDATED: 'User updated successfully!',
  USER_DELETED: 'User deleted successfully!',
};

// Breakpoints (matching MUI)
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 960,
  LG: 1280,
  XL: 1920,
};
