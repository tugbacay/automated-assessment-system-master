import api from './api';
import { ENDPOINTS } from '../config/env';

/**
 * Activity Service
 * Handles all activity-related API calls
 */
const activityService = {
  // Get all activities
  getAllActivities: async () => {
    return await api.get(ENDPOINTS.ACTIVITIES.BASE);
  },

  // Get activity by ID
  getActivityById: async (id) => {
    return await api.get(`${ENDPOINTS.ACTIVITIES.BASE}/${id}`);
  },

  // Get teacher's activities
  getTeacherActivities: async (teacherId) => {
    return await api.get(ENDPOINTS.ACTIVITIES.TEACHER_ACTIVITIES.replace(':teacherId', teacherId));
  },

  // Create new activity
  createActivity: async (activityData) => {
    return await api.post(ENDPOINTS.ACTIVITIES.BASE, activityData);
  },

  // Update activity
  updateActivity: async (id, activityData) => {
    return await api.put(`${ENDPOINTS.ACTIVITIES.BASE}/${id}`, activityData);
  },

  // Delete activity
  deleteActivity: async (id) => {
    return await api.delete(`${ENDPOINTS.ACTIVITIES.BASE}/${id}`);
  },
};

export default activityService;
