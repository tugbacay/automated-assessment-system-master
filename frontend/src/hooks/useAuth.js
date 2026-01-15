import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
const useAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
    updateUser,
    setAccessToken,
    clearError,
    initializeAuth,
    hasRole,
    getUserRole,
    isStudent,
    isTeacher,
    isAdmin,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isAuthenticated && !user) {
      initializeAuth();
    }
  }, []);

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
    updateUser,
    setAccessToken,
    clearError,

    // Helpers
    hasRole,
    getUserRole,
    isStudent,
    isTeacher,
    isAdmin,
  };
};

export default useAuth;
