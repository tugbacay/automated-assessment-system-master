import express from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
} from '../utils/validators.js';
import { auditAuth } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, auditAuth(AUDIT_ACTIONS.LOGIN), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, auditAuth(AUDIT_ACTIONS.LOGOUT), logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, refreshAccessToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  auditAuth(AUDIT_ACTIONS.PASSWORD_CHANGE),
  changePassword
);

export default router;
