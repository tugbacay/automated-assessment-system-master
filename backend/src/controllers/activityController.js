import Activity from '../models/Activity.js';
import { logger } from '../utils/logger.js';

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private/Teacher
export const createActivity = async (req, res, next) => {
  try {
    const activityData = {
      ...req.body,
      createdBy: req.user._id,
      activityId: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const activity = await Activity.create(activityData);

    logger.info(`Activity created: ${activity._id} by user: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity },
    });
  } catch (error) {
    logger.error(`Error creating activity: ${error.message}`);
    next(error);
  }
};

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
export const getAllActivities = async (req, res, next) => {
  try {
    const { activityType, difficulty, isActive } = req.query;

    const filter = {};
    if (activityType) filter.activityType = activityType;
    if (difficulty) filter.difficulty = difficulty;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const activities = await Activity.find(filter)
      .populate('createdBy', 'name email')
      .populate('rubricId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: { activities },
    });
  } catch (error) {
    logger.error(`Error fetching activities: ${error.message}`);
    next(error);
  }
};

// @desc    Get activity by ID
// @route   GET /api/activities/:id
// @access  Private
export const getActivityById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('rubricId');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { activity },
    });
  } catch (error) {
    logger.error(`Error fetching activity: ${error.message}`);
    next(error);
  }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private/Teacher
export const updateActivity = async (req, res, next) => {
  try {
    let activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // Check if user is the creator or admin
    if (activity.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this activity',
      });
    }

    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name email')
      .populate('rubricId');

    logger.info(`Activity updated: ${activity._id} by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: { activity },
    });
  } catch (error) {
    logger.error(`Error updating activity: ${error.message}`);
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private/Teacher
export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // Check if user is the creator or admin
    if (activity.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity',
      });
    }

    await Activity.findByIdAndDelete(req.params.id);

    logger.info(`Activity deleted: ${req.params.id} by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
      data: {},
    });
  } catch (error) {
    logger.error(`Error deleting activity: ${error.message}`);
    next(error);
  }
};

// @desc    Get teacher's activities
// @route   GET /api/activities/teacher/:teacherId
// @access  Private/Teacher
export const getTeacherActivities = async (req, res, next) => {
  try {
    // Allow teacher to see own activities or admin to see any teacher's activities
    if (req.user._id.toString() !== req.params.teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these activities',
      });
    }

    const activities = await Activity.find({ createdBy: req.params.teacherId })
      .populate('rubricId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: { activities },
    });
  } catch (error) {
    logger.error(`Error fetching teacher activities: ${error.message}`);
    next(error);
  }
};
