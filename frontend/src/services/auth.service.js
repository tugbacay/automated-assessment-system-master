import api from './api';
import { ENDPOINTS } from '../config/env';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { email, password, name, role }
   * @returns {Promise<Object>} Response with user data and tokens
   */
  register: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
      return { success: true, data: response.data };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} Response with user data and tokens
   */
  login: async (credentials) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, credentials);

      // Store tokens and user data
      if (response.data?.accessToken) {
        localStorage.setItem('auth_token', response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return { success: true, data: response.data };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Response
   */
  logout: async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Response with new access token
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });

      // Update access token
      if (response.data?.accessToken) {
        localStorage.setItem('auth_token', response.data.accessToken);
      }

      return { success: true, data: response.data };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} Response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get(ENDPOINTS.AUTH.ME);
      return { success: true, data: response.data };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password
   * @param {Object} passwords - { currentPassword, newPassword }
   * @returns {Promise<Object>} Response
   */
  changePassword: async (passwords) => {
    try {
      const response = await api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, passwords);
      return { success: true, data: response.data };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get stored user data
   * @returns {Object|null} User data or null
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Get stored access token
   * @returns {string|null} Access token or null
   */
  getAccessToken: () => {
    return localStorage.getItem('auth_token');
  },

  /**
   * Get stored refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },
};

export default authService;
