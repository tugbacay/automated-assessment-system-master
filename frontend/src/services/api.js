import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    // Return data directly for successful responses
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          // No refresh token, redirect to login
          handleLogout();
          return Promise.reject(error);
        }

        // Try to refresh the access token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;

        // Save new access token
        localStorage.setItem('auth_token', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token failed, logout user
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

// Helper function to handle logout
const handleLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';

    return {
      success: false,
      status,
      message,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      status: 0,
      message: 'Network error. Please check your connection.',
      data: null,
    };
  } else {
    // Something else happened
    return {
      success: false,
      status: 0,
      message: error.message || 'An unexpected error occurred',
      data: null,
    };
  }
};

// Helper function for success responses
export const handleApiSuccess = (response) => {
  return {
    success: true,
    status: 200,
    message: response.message || 'Success',
    data: response.data,
  };
};

export default api;
