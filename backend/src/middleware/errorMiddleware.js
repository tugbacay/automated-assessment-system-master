import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Custom error class
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle specific errors
 */
const handleMongooseError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new AppError(
      `Duplicate value for ${field}. Please use another value.`,
      HTTP_STATUS.CONFLICT
    );
  }

  if (error.name === 'CastError') {
    return new AppError(`Invalid ${error.path}: ${error.value}`, HTTP_STATUS.BAD_REQUEST);
  }

  return error;
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

  // Handle Mongoose errors
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    error = handleMongooseError(err);
  }

  // Send error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  });
};

/**
 * Handle 404 - Not Found
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
  next(error);
};

export default {
  AppError,
  errorHandler,
  notFound,
};
