import { create } from 'zustand';

/**
 * UI Store
 * Manages UI state (modals, loading, sidebar, etc.)
 */
const useUIStore = create((set, get) => ({
  // State
  globalLoading: false,
  sidebarOpen: true,
  modals: {},
  toasts: [],

  // Loading Management

  /**
   * Set global loading state
   * @param {boolean} loading - Loading state
   */
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  /**
   * Show global loading
   */
  showLoading: () => set({ globalLoading: true }),

  /**
   * Hide global loading
   */
  hideLoading: () => set({ globalLoading: false }),

  // Sidebar Management

  /**
   * Toggle sidebar open/close
   */
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  /**
   * Open sidebar
   */
  openSidebar: () => set({ sidebarOpen: true }),

  /**
   * Close sidebar
   */
  closeSidebar: () => set({ sidebarOpen: false }),

  /**
   * Set sidebar state
   * @param {boolean} open - Sidebar open state
   */
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Modal Management

  /**
   * Open modal
   * @param {string} modalId - Unique modal identifier
   * @param {Object} data - Optional modal data
   */
  openModal: (modalId, data = null) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: { open: true, data },
      },
    }));
  },

  /**
   * Close modal
   * @param {string} modalId - Unique modal identifier
   */
  closeModal: (modalId) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: { open: false, data: null },
      },
    }));
  },

  /**
   * Get modal state
   * @param {string} modalId - Unique modal identifier
   * @returns {Object} Modal state { open, data }
   */
  getModalState: (modalId) => {
    const { modals } = get();
    return modals[modalId] || { open: false, data: null };
  },

  /**
   * Update modal data
   * @param {string} modalId - Unique modal identifier
   * @param {Object} data - New modal data
   */
  updateModalData: (modalId, data) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: {
          ...state.modals[modalId],
          data,
        },
      },
    }));
  },

  /**
   * Close all modals
   */
  closeAllModals: () => {
    set({ modals: {} });
  },

  // Toast Management

  /**
   * Add toast notification
   * @param {Object} toast - { message, type, duration }
   */
  addToast: (toast) => {
    const id = Date.now();
    const newToast = {
      id,
      message: toast.message,
      type: toast.type || 'info', // success, error, warning, info
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  /**
   * Remove toast
   * @param {number} id - Toast ID
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  /**
   * Clear all toasts
   */
  clearAllToasts: () => {
    set({ toasts: [] });
  },

  /**
   * Show success toast
   * @param {string} message - Toast message
   */
  showSuccess: (message) => {
    get().addToast({ message, type: 'success' });
  },

  /**
   * Show error toast
   * @param {string} message - Toast message
   */
  showError: (message) => {
    get().addToast({ message, type: 'error' });
  },

  /**
   * Show warning toast
   * @param {string} message - Toast message
   */
  showWarning: (message) => {
    get().addToast({ message, type: 'warning' });
  },

  /**
   * Show info toast
   * @param {string} message - Toast message
   */
  showInfo: (message) => {
    get().addToast({ message, type: 'info' });
  },

  // Mobile Detection

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile
   */
  isMobile: () => {
    return window.innerWidth < 768;
  },

  /**
   * Check if device is tablet
   * @returns {boolean} True if tablet
   */
  isTablet: () => {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },

  /**
   * Check if device is desktop
   * @returns {boolean} True if desktop
   */
  isDesktop: () => {
    return window.innerWidth >= 1024;
  },
}));

export default useUIStore;
