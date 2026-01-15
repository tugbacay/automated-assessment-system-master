import express from 'express';
import {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getTeacherActivities,
} from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (protected but accessible by authenticated users)
router.get('/', protect, getAllActivities);
router.get('/:id', protect, getActivityById);

// Teacher routes
router.post('/', protect, authorize('teacher', 'admin'), createActivity);
router.put('/:id', protect, authorize('teacher', 'admin'), updateActivity);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteActivity);
router.get('/teacher/:teacherId', protect, authorize('teacher', 'admin'), getTeacherActivities);

export default router;
