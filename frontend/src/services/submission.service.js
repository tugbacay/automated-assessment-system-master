import api from './api';
import { ENDPOINTS } from '../config/env';

/**
 * Submission Service
 * Handles all submission-related API calls
 */
const submissionService = {
  // Submit speaking activity
  submitSpeaking: async (formData) => {
    return await api.post(ENDPOINTS.SUBMISSIONS.SPEAKING, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Submit writing activity
  submitWriting: async (submissionData) => {
    return await api.post(ENDPOINTS.SUBMISSIONS.WRITING, submissionData);
  },

  // Submit quiz activity
  submitQuiz: async (submissionData) => {
    return await api.post(ENDPOINTS.SUBMISSIONS.QUIZ, submissionData);
  },

  // Get submission by ID
  getSubmissionById: async (id) => {
    return await api.get(`${ENDPOINTS.SUBMISSIONS.BASE}/${id}`);
  },

  // Get student's submissions
  getStudentSubmissions: async (studentId) => {
    return await api.get(ENDPOINTS.SUBMISSIONS.STUDENT_ME);
  },

  // Get pending submissions for teacher
  getPendingSubmissions: async () => {
    return await api.get(ENDPOINTS.SUBMISSIONS.PENDING);
  },

  // Submit teacher review
  submitReview: async (submissionId, reviewData) => {
    return await api.post(`${ENDPOINTS.SUBMISSIONS.BASE}/${submissionId}/review`, reviewData);
  },
};

export default submissionService;
