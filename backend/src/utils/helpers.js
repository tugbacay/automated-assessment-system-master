import crypto from 'crypto';

/**
 * Generate a unique ID with prefix
 */
export const generateId = (prefix = 'ID', length = 8) => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}${randomStr}`.substring(0, prefix.length + length);
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize object by removing null/undefined values
 */
export const sanitizeObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Calculate week number from date
 */
export const getWeekNumber = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return {
    year: d.getUTCFullYear(),
    week: weekNo,
  };
};

/**
 * Format error response
 */
export const formatErrorResponse = (message, statusCode = 500, errors = []) => {
  return {
    success: false,
    message,
    statusCode,
    errors,
  };
};

/**
 * Format success response
 */
export const formatSuccessResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Validate file type
 */
export const isValidFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export default {
  generateId,
  getPaginationMeta,
  sanitizeObject,
  getWeekNumber,
  formatErrorResponse,
  formatSuccessResponse,
  asyncHandler,
  calculatePercentage,
  isValidFileType,
  generateRandomString,
};
