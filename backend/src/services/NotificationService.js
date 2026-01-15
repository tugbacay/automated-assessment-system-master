import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Notification Service (FR13)
 * Manages in-app notifications for users
 */
class NotificationService {
  /**
   * Create notification
   */
  async createNotification(userId, type, title, message, relatedEntity = null) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedEntity,
      });

      logger.info(`Notification created: ${notification.notificationId} for user ${userId}`);

      return notification;
    } catch (error) {
      logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notify when evaluation is completed
   */
  async notifyEvaluationCompleted(studentId, evaluationId) {
    const student = await Student.findById(studentId).populate('userId');

    if (!student || !student.preferences.notificationEnabled) {
      return null;
    }

    return await this.createNotification(
      student.userId._id,
      NOTIFICATION_TYPES.EVALUATION_COMPLETED,
      'Evaluation Completed',
      'Your submission has been evaluated by our AI system. Check your results!',
      {
        type: 'evaluation',
        id: evaluationId,
      }
    );
  }

  /**
   * Notify when feedback is ready
   */
  async notifyFeedbackReady(studentId, feedbackId) {
    const student = await Student.findById(studentId).populate('userId');

    if (!student || !student.preferences.notificationEnabled) {
      return null;
    }

    return await this.createNotification(
      student.userId._id,
      NOTIFICATION_TYPES.FEEDBACK_READY,
      'Feedback Available',
      'Personalized feedback for your submission is now available. Review it to improve!',
      {
        type: 'feedback',
        id: feedbackId,
      }
    );
  }

  /**
   * Notify when teacher reviews submission
   */
  async notifyTeacherReview(studentId, evaluationId, teacherNotes) {
    const student = await Student.findById(studentId).populate('userId');

    if (!student || !student.preferences.notificationEnabled) {
      return null;
    }

    const message = teacherNotes
      ? 'Your teacher has reviewed your submission and added comments.'
      : 'Your teacher has reviewed your submission.';

    return await this.createNotification(
      student.userId._id,
      NOTIFICATION_TYPES.TEACHER_REVIEW,
      'Teacher Review Available',
      message,
      {
        type: 'evaluation',
        id: evaluationId,
      }
    );
  }

  /**
   * Notify about weekly progress report
   */
  async notifyWeeklyReport(studentId, reportId) {
    const student = await Student.findById(studentId).populate('userId');

    if (!student || !student.preferences.notificationEnabled) {
      return null;
    }

    return await this.createNotification(
      student.userId._id,
      NOTIFICATION_TYPES.WEEKLY_REPORT,
      'Weekly Progress Report Ready',
      'Your weekly progress report is available. See how you performed this week!',
      {
        type: 'report',
        id: reportId,
      }
    );
  }

  /**
   * Send system announcement to all users or specific role
   */
  async sendSystemAnnouncement(title, message, role = null) {
    try {
      const query = role ? { role } : {};
      const users = await require('../models/User.js').default.find(query);

      const notifications = await Promise.all(
        users.map((user) =>
          this.createNotification(
            user._id,
            NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
            title,
            message,
            null
          )
        )
      );

      logger.info(`System announcement sent to ${notifications.length} users`);

      return notifications;
    } catch (error) {
      logger.error(`Failed to send system announcement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { userId };

    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ sentAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      unreadCount: await Notification.countDocuments({ userId, isRead: false }),
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    logger.info(`Notification marked as read: ${notification.notificationId}`);

    return notification;
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    return result;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

    if (!notification) {
      throw new Error('Notification not found');
    }

    logger.info(`Notification deleted: ${notification.notificationId}`);

    return notification;
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Notification.deleteMany({
      sentAt: { $lt: cutoffDate },
      isRead: true,
    });

    logger.info(`Deleted ${result.deletedCount} old notifications`);

    return result.deletedCount;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }
}

export default new NotificationService();
