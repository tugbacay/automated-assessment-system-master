import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';

/**
 * Authentication Store
 * Manages user authentication state
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions

      /**
       * Login user
       * @param {Object} credentials - { email, password }
       */
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);

          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, data: response.data };
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      /**
       * Register new user
       * @param {Object} userData - { email, password, name, role }
       */
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);

          // Auto-login after registration
          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, data: response.data };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed',
          });
          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Refresh access token
       */
      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(refreshToken);

          set({
            accessToken: response.data.accessToken,
          });

          return { success: true };
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      /**
       * Fetch current user data
       */
      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authService.getCurrentUser();

          set({
            user: response.data.user,
            isLoading: false,
          });

          return { success: true, data: response.data };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch user data',
          });
          throw error;
        }
      },

      /**
       * Update user data
       * @param {Object} userData - Updated user data
       */
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      /**
       * Set access token
       * @param {string} token - New access token
       */
      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Initialize auth from storage
       */
      initializeAuth: () => {
        const user = authService.getStoredUser();
        const accessToken = authService.getAccessToken();
        const refreshToken = authService.getRefreshToken();

        if (user && accessToken) {
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        }
      },

      /**
       * Check if user has role
       * @param {string|string[]} roles - Role(s) to check
       * @returns {boolean} True if user has role
       */
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      /**
       * Get user role
       * @returns {string|null} User role or null
       */
      getUserRole: () => {
        const { user } = get();
        return user?.role || null;
      },

      /**
       * Check if user is student
       * @returns {boolean}
       */
      isStudent: () => {
        return get().hasRole('student');
      },

      /**
       * Check if user is teacher
       * @returns {boolean}
       */
      isTeacher: () => {
        return get().hasRole('teacher');
      },

      /**
       * Check if user is admin
       * @returns {boolean}
       */
      isAdmin: () => {
        return get().hasRole('admin');
      },
    }),
    {
      name: 'auth-storage', // Storage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
