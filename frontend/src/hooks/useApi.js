import { useState, useCallback } from 'react';
import { handleApiError } from '../services/api';
import useUIStore from '../store/uiStore';

/**
 * Custom hook for API calls with loading and error handling
 * Provides consistent state management for async operations
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const { showError: showErrorToast, showSuccess: showSuccessToast } = useUIStore();

  /**
   * Execute an API function with automatic loading and error handling
   * @param {Function} apiFunc - API function to execute
   * @param {Object} options - Options { showSuccessToast, showErrorToast, successMessage, errorMessage }
   * @returns {Promise<Object>} Result { success, data, error }
   */
  const execute = useCallback(async (apiFunc, options = {}) => {
    const {
      showSuccessToast: showSuccess = false,
      showErrorToast: showError = true,
      successMessage = 'Operation successful',
      errorMessage = null,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFunc();
      setData(response.data || response);
      setLoading(false);

      // Show success toast if requested
      if (showSuccess) {
        showSuccessToast(successMessage);
      }

      return {
        success: true,
        data: response.data || response,
        error: null,
      };

    } catch (err) {
      const errorResult = handleApiError(err);
      setError(errorResult);
      setData(null);
      setLoading(false);

      // Show error toast if requested
      if (showError) {
        const message = errorMessage || errorResult.message || 'An error occurred';
        showErrorToast(message);
      }

      return {
        success: false,
        data: null,
        error: errorResult,
      };
    }
  }, [showErrorToast, showSuccessToast]);

  /**
   * Execute multiple API functions in parallel
   * @param {Function[]} apiFuncs - Array of API functions
   * @param {Object} options - Options { showSuccessToast, showErrorToast }
   * @returns {Promise<Object>} Result { success, data, errors }
   */
  const executeMultiple = useCallback(async (apiFuncs, options = {}) => {
    const {
      showSuccessToast: showSuccess = false,
      showErrorToast: showError = true,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const promises = apiFuncs.map(func => func());
      const results = await Promise.allSettled(promises);

      const successResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const errorResults = results
        .filter(r => r.status === 'rejected')
        .map(r => handleApiError(r.reason));

      setData(successResults);
      setError(errorResults.length > 0 ? errorResults : null);
      setLoading(false);

      // Show toasts
      if (errorResults.length > 0 && showError) {
        showErrorToast(`${errorResults.length} operation(s) failed`);
      } else if (showSuccess) {
        showSuccessToast('All operations completed successfully');
      }

      return {
        success: errorResults.length === 0,
        data: successResults,
        errors: errorResults,
      };

    } catch (err) {
      const errorResult = handleApiError(err);
      setError(errorResult);
      setLoading(false);

      if (showError) {
        showErrorToast(errorResult.message);
      }

      return {
        success: false,
        data: null,
        errors: [errorResult],
      };
    }
  }, [showErrorToast, showSuccessToast]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    executeMultiple,
    reset,
    clearError,
  };
};

export default useApi;
