import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/authMiddleware.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', HTTP_STATUS.CONFLICT);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await User.create({
    email,
    passwordHash,
    name,
    role,
  });

  // Create role-specific profile
  if (role === USER_ROLES.STUDENT) {
    await Student.create({
      userId: user._id,
    });
  } else if (role === USER_ROLES.TEACHER) {
    await Teacher.create({
      userId: user._id,
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  logger.info(`New user registered: ${user.email} (${user.role})`);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      'User registered successfully'
    )
  );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', HTTP_STATUS.FORBIDDEN);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  logger.info(`User logged in: ${user.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      'Login successful'
    )
  );
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      null,
      'Logout successful. Please remove tokens from client storage.'
    )
  );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.role);

    logger.info(`Access token refreshed for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(
        {
          accessToken,
        },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Get role-specific data
  let roleData = null;
  if (user.role === USER_ROLES.STUDENT) {
    roleData = await Student.findOne({ userId: user._id });
  } else if (user.role === USER_ROLES.TEACHER) {
    roleData = await Teacher.findOne({ userId: user._id });
  }

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      roleData,
    })
  );
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Find user with password
  const user = await User.findById(req.user._id).select('+passwordHash');

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.status(HTTP_STATUS.OK).json(formatSuccessResponse(null, 'Password changed successfully'));
});

export default {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
};
