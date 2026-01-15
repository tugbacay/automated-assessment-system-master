import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import ProgressReport from '../models/ProgressReport.js';
import { logger } from '../utils/logger.js';

/**
 * Analytics Service (FR20)
 * System-wide analytics and reporting
 */
class AnalyticsService {
  /**
   * Get system overview statistics
   */
  async getSystemOverview() {
    try {
      const [
        totalUsers,
        totalStudents,
        totalTeachers,
        totalSubmissions,
        totalEvaluations,
        activeUsers,
      ] = await Promise.all([
        User.countDocuments(),
        Student.countDocuments(),
        Teacher.countDocuments(),
        Submission.countDocuments(),
        Evaluation.countDocuments(),
        User.countDocuments({ isActive: true }),
      ]);

      // Get submissions by status
      const submissionsByStatus = await Submission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get average scores
      const avgScores = await Evaluation.aggregate([
        {
          $group: {
            _id: null,
            averageOverallScore: { $avg: '$overallScore' },
            averageGrammarScore: { $avg: '$grammarScore' },
            averageVocabularyScore: { $avg: '$vocabularyScore' },
          },
        },
      ]);

      return {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          active: activeUsers,
        },
        submissions: {
          total: totalSubmissions,
          byStatus: submissionsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        evaluations: {
          total: totalEvaluations,
          averageScores: avgScores[0] || {},
        },
      };
    } catch (error) {
      logger.error(`Failed to get system overview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get submission trends over time
   */
  async getSubmissionTrends({ startDate, endDate, groupBy = 'day' } = {}) {
    try {
      const matchStage = {};

      if (startDate || endDate) {
        matchStage.submittedAt = {};
        if (startDate) matchStage.submittedAt.$gte = new Date(startDate);
        if (endDate) matchStage.submittedAt.$lte = new Date(endDate);
      }

      // Group format based on granularity
      const groupFormats = {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
        week: { $week: '$submittedAt' },
        month: { $dateToString: { format: '%Y-%m', date: '$submittedAt' } },
      };

      const trends = await Submission.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: {
              date: groupFormats[groupBy] || groupFormats.day,
              contentType: '$contentType',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);

      return trends;
    } catch (error) {
      logger.error(`Failed to get submission trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement({ startDate, endDate } = {}) {
    try {
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.submittedAt = {};
        if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
        if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
      }

      // Active students (with submissions)
      const activeStudents = await Submission.distinct('studentId', dateFilter);

      // Submissions per student
      const submissionsPerStudent = await Submission.aggregate([
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
        {
          $group: {
            _id: '$studentId',
            submissionCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            averageSubmissions: { $avg: '$submissionCount' },
            minSubmissions: { $min: '$submissionCount' },
            maxSubmissions: { $max: '$submissionCount' },
          },
        },
      ]);

      return {
        activeStudents: activeStudents.length,
        submissionMetrics: submissionsPerStudent[0] || {},
      };
    } catch (error) {
      logger.error(`Failed to get user engagement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get teacher performance metrics
   */
  async getTeacherPerformance() {
    try {
      const teachers = await Teacher.find().populate('userId', 'name email');

      const performanceData = await Promise.all(
        teachers.map(async (teacher) => {
          // Count evaluations reviewed by this teacher
          const reviewedCount = await Evaluation.countDocuments({
            teacherId: teacher._id,
            reviewedByTeacher: true,
          });

          // Count activities created
          const Activity = (await import('../models/Activity.js')).default;
          const activitiesCreated = await Activity.countDocuments({
            createdBy: teacher._id,
          });

          // Count rubrics created
          const Rubric = (await import('../models/Rubric.js')).default;
          const rubricsCreated = await Rubric.countDocuments({
            createdBy: teacher._id,
          });

          return {
            teacher: {
              id: teacher._id,
              teacherId: teacher.teacherId,
              name: teacher.userId.name,
              email: teacher.userId.email,
            },
            metrics: {
              reviewedEvaluations: reviewedCount,
              activitiesCreated,
              rubricsCreated,
            },
          };
        })
      );

      return performanceData;
    } catch (error) {
      logger.error(`Failed to get teacher performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStatistics() {
    try {
      const Activity = (await import('../models/Activity.js')).default;

      const activityStats = await Activity.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$activityType',
            count: { $sum: 1 },
            avgDifficulty: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$difficulty', 'beginner'] }, then: 1 },
                    { case: { $eq: ['$difficulty', 'intermediate'] }, then: 2 },
                    { case: { $eq: ['$difficulty', 'advanced'] }, then: 3 },
                  ],
                  default: 2,
                },
              },
            },
          },
        },
      ]);

      // Get submissions per activity type
      const submissionsByType = await Submission.aggregate([
        {
          $group: {
            _id: '$contentType',
            totalSubmissions: { $sum: 1 },
          },
        },
      ]);

      return {
        activities: activityStats,
        submissions: submissionsByType,
      };
    } catch (error) {
      logger.error(`Failed to get activity statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get performance distribution
   */
  async getPerformanceDistribution() {
    try {
      const distribution = await Evaluation.aggregate([
        {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [0, 40, 60, 75, 85, 100],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              averageScore: { $avg: '$overallScore' },
            },
          },
        },
      ]);

      // Label the buckets
      const labeled = distribution.map((bucket) => {
        let label;
        if (bucket._id === 0) label = 'Failing (0-40)';
        else if (bucket._id === 40) label = 'Poor (40-60)';
        else if (bucket._id === 60) label = 'Fair (60-75)';
        else if (bucket._id === 75) label = 'Good (75-85)';
        else if (bucket._id === 85) label = 'Excellent (85-100)';
        else label = 'Other';

        return {
          range: label,
          count: bucket.count,
          averageScore: Math.round(bucket.averageScore * 100) / 100,
        };
      });

      return labeled;
    } catch (error) {
      logger.error(`Failed to get performance distribution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get improvement trends
   */
  async getImprovementTrends({ limit = 10 } = {}) {
    try {
      const recentReports = await ProgressReport.find()
        .sort({ year: -1, weekNumber: -1 })
        .limit(limit)
        .populate('studentId', 'studentId');

      const improvementData = recentReports.map((report) => ({
        student: report.studentId.studentId,
        week: `${report.year}-W${report.weekNumber}`,
        averageScore: report.averageScore,
        improvementRate: report.improvementRate,
        totalSubmissions: report.totalSubmissions,
      }));

      return improvementData;
    } catch (error) {
      logger.error(`Failed to get improvement trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export analytics data (FR15 - part of download reports)
   */
  async exportAnalyticsData({ startDate, endDate, format = 'json' } = {}) {
    try {
      const overview = await this.getSystemOverview();
      const trends = await this.getSubmissionTrends({ startDate, endDate });
      const engagement = await this.getUserEngagement({ startDate, endDate });
      const performance = await this.getPerformanceDistribution();

      const analyticsData = {
        generatedAt: new Date(),
        period: {
          startDate: startDate || 'all-time',
          endDate: endDate || 'current',
        },
        overview,
        trends,
        engagement,
        performance,
      };

      if (format === 'csv') {
        // Convert to CSV format (simplified)
        return this.convertToCSV(analyticsData);
      }

      return analyticsData;
    } catch (error) {
      logger.error(`Failed to export analytics data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert data to CSV format (helper)
   */
  convertToCSV(data) {
    // Simplified CSV conversion for overview
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', data.overview.users.total],
      ['Total Students', data.overview.users.students],
      ['Total Teachers', data.overview.users.teachers],
      ['Total Submissions', data.overview.submissions.total],
      ['Total Evaluations', data.overview.evaluations.total],
    ];

    return rows.map((row) => row.join(',')).join('\n');
  }
}

export default new AnalyticsService();
