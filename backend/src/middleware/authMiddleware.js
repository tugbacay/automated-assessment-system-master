import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/helpers.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Alternative: Check for token in cookies (if using cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'User account is deactivated.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
});

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export default {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
