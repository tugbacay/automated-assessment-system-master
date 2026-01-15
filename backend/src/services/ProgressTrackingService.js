import ProgressReport from '../models/ProgressReport.js';
import Evaluation from '../models/Evaluation.js';
import Submission from '../models/Submission.js';
import Mistake from '../models/Mistake.js';
import Student from '../models/Student.js';
import { getWeekNumber } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import NotificationService from './NotificationService.js';

/**
 * Progress Tracking Service (FR9 & FR10)
 * Generates weekly progress reports and analytics
 */
class ProgressTrackingService {
  /**
   * Generate weekly progress report for student (FR9)
   */
  async generateWeeklyReport(studentId, weekNumber = null, year = null) {
    try {
      // Get current week if not specified
      const weekInfo = weekNumber && year ? { week: weekNumber, year } : getWeekNumber();

      // Check if report already exists
      const existingReport = await ProgressReport.findOne({
        studentId,
        weekNumber: weekInfo.week,
        year: weekInfo.year,
      });

      if (existingReport) {
        logger.info(
          `Weekly report already exists for student ${studentId}, week ${weekInfo.week}/${weekInfo.year}`
        );
        return existingReport;
      }

      // Calculate week start and end dates
      const weekStart = this.getWeekStartDate(weekInfo.year, weekInfo.week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get submissions for the week
      const submissions = await Submission.find({
        studentId,
        submittedAt: { $gte: weekStart, $lt: weekEnd },
      });

      if (submissions.length === 0) {
        logger.info(
          `No submissions for student ${studentId} in week ${weekInfo.week}/${weekInfo.year}`
        );
        // Create report with zero submissions
        return await this.createEmptyReport(studentId, weekInfo.week, weekInfo.year);
      }

      // Get evaluations for these submissions
      const submissionIds = submissions.map((s) => s._id);
      const evaluations = await Evaluation.find({ submissionId: { $in: submissionIds } });

      // Calculate metrics
      const metrics = await this.calculateWeeklyMetrics(
        submissions,
        evaluations,
        studentId,
        weekInfo
      );

      // Create progress report
      const report = await ProgressReport.create({
        studentId,
        weekNumber: weekInfo.week,
        year: weekInfo.year,
        ...metrics,
      });

      // Send notification
      await NotificationService.notifyWeeklyReport(studentId, report._id);

      logger.info(`Weekly report generated: ${report.reportId} for student ${studentId}`);

      return report;
    } catch (error) {
      logger.error(`Failed to generate weekly report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate weekly metrics
   */
  async calculateWeeklyMetrics(submissions, evaluations, studentId, weekInfo) {
    const totalSubmissions = submissions.length;

    // Calculate scores
    const scores = evaluations.map((e) => e.overallScore);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Calculate improvement rate (compared to previous week)
    const improvementRate = await this.calculateImprovementRate(
      studentId,
      averageScore,
      weekInfo.week,
      weekInfo.year
    );

    // Analyze activity breakdown
    const activityBreakdown = this.analyzeActivityBreakdown(submissions, evaluations);

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = await this.identifyStrengthsWeaknesses(evaluations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      averageScore,
      weaknesses,
      activityBreakdown
    );

    return {
      totalSubmissions,
      averageScore: Math.round(averageScore * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      activityBreakdown,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  /**
   * Analyze activity breakdown by type
   */
  analyzeActivityBreakdown(submissions, evaluations) {
    const breakdown = {
      speaking: { count: 0, averageScore: 0 },
      writing: { count: 0, averageScore: 0 },
      quiz: { count: 0, averageScore: 0 },
    };

    submissions.forEach((submission) => {
      const evaluation = evaluations.find(
        (e) => e.submissionId.toString() === submission._id.toString()
      );

      if (breakdown[submission.contentType]) {
        breakdown[submission.contentType].count++;
        if (evaluation) {
          breakdown[submission.contentType].averageScore += evaluation.overallScore;
        }
      }
    });

    // Calculate averages
    Object.keys(breakdown).forEach((type) => {
      if (breakdown[type].count > 0) {
        breakdown[type].averageScore = Math.round(
          (breakdown[type].averageScore / breakdown[type].count) * 100
        ) / 100;
      }
    });

    return breakdown;
  }

  /**
   * Identify strengths and weaknesses from evaluations
   */
  async identifyStrengthsWeaknesses(evaluations) {
    const strengths = [];
    const weaknesses = [];

    if (evaluations.length === 0) {
      return { strengths, weaknesses };
    }

    // Analyze score components
    const avgGrammar =
      evaluations.reduce((sum, e) => sum + (e.grammarScore || 0), 0) / evaluations.length;
    const avgVocabulary =
      evaluations.reduce((sum, e) => sum + (e.vocabularyScore || 0), 0) / evaluations.length;
    const avgPronunciation =
      evaluations.filter((e) => e.pronunciationScore).length > 0
        ? evaluations.reduce((sum, e) => sum + (e.pronunciationScore || 0), 0) /
          evaluations.filter((e) => e.pronunciationScore).length
        : 0;
    const avgLogic =
      evaluations.filter((e) => e.logicScore).length > 0
        ? evaluations.reduce((sum, e) => sum + (e.logicScore || 0), 0) /
          evaluations.filter((e) => e.logicScore).length
        : 0;

    // Identify strengths (score >= 80)
    if (avgGrammar >= 80) strengths.push('Strong grammar skills');
    if (avgVocabulary >= 80) strengths.push('Excellent vocabulary range');
    if (avgPronunciation >= 80) strengths.push('Clear pronunciation');
    if (avgLogic >= 80) strengths.push('Strong logical reasoning');

    // Identify weaknesses (score < 60)
    if (avgGrammar > 0 && avgGrammar < 60) weaknesses.push('Grammar needs improvement');
    if (avgVocabulary > 0 && avgVocabulary < 60) weaknesses.push('Vocabulary expansion needed');
    if (avgPronunciation > 0 && avgPronunciation < 60) weaknesses.push('Pronunciation practice needed');
    if (avgLogic > 0 && avgLogic < 60) weaknesses.push('Analytical skills development needed');

    // Analyze common mistakes
    const evaluationIds = evaluations.map((e) => e._id);
    const mistakes = await Mistake.find({ evaluationId: { $in: evaluationIds } });

    const errorTypeCounts = {};
    mistakes.forEach((mistake) => {
      errorTypeCounts[mistake.errorType] = (errorTypeCounts[mistake.errorType] || 0) + 1;
    });

    // Add frequent error types to weaknesses
    Object.entries(errorTypeCounts).forEach(([errorType, count]) => {
      if (count >= 5) {
        const weaknessText = `Frequent ${errorType} errors (${count} this week)`;
        if (!weaknesses.includes(weaknessText)) {
          weaknesses.push(weaknessText);
        }
      }
    });

    return { strengths, weaknesses };
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(averageScore, weaknesses, activityBreakdown) {
    const recommendations = [];

    // Score-based recommendations
    if (averageScore < 60) {
      recommendations.push('Focus on fundamental concepts and practice regularly');
      recommendations.push('Review feedback from previous submissions carefully');
    } else if (averageScore < 75) {
      recommendations.push('Continue practicing to strengthen your skills');
      recommendations.push('Pay attention to common mistakes and avoid repeating them');
    } else if (averageScore < 85) {
      recommendations.push('Excellent progress! Challenge yourself with advanced topics');
    } else {
      recommendations.push('Outstanding performance! Maintain your excellent work');
    }

    // Weakness-based recommendations
    if (weaknesses.includes('Grammar needs improvement')) {
      recommendations.push('Review grammar rules and complete focused grammar exercises');
    }
    if (weaknesses.includes('Vocabulary expansion needed')) {
      recommendations.push('Read more and practice using new vocabulary in context');
    }
    if (weaknesses.includes('Pronunciation practice needed')) {
      recommendations.push('Listen to native speakers and practice pronunciation daily');
    }

    // Activity balance recommendations
    const totalActivities =
      activityBreakdown.speaking.count +
      activityBreakdown.writing.count +
      activityBreakdown.quiz.count;

    if (totalActivities > 0) {
      if (activityBreakdown.speaking.count === 0) {
        recommendations.push('Try completing speaking activities to practice oral skills');
      }
      if (activityBreakdown.writing.count === 0) {
        recommendations.push('Practice writing activities to improve written communication');
      }
      if (activityBreakdown.quiz.count === 0) {
        recommendations.push('Complete quiz activities to test your knowledge');
      }
    }

    return recommendations.slice(0, 5); // Return max 5 recommendations
  }

  /**
   * Calculate improvement rate compared to previous week
   */
  async calculateImprovementRate(studentId, currentAverage, weekNumber, year) {
    // Get previous week's report
    let previousWeek = weekNumber - 1;
    let previousYear = year;

    if (previousWeek < 1) {
      previousWeek = 52;
      previousYear = year - 1;
    }

    const previousReport = await ProgressReport.findOne({
      studentId,
      weekNumber: previousWeek,
      year: previousYear,
    });

    if (!previousReport || previousReport.averageScore === 0) {
      return 0;
    }

    // Calculate percentage change
    const improvement =
      ((currentAverage - previousReport.averageScore) / previousReport.averageScore) * 100;

    return improvement;
  }

  /**
   * Create empty report for week with no submissions
   */
  async createEmptyReport(studentId, weekNumber, year) {
    return await ProgressReport.create({
      studentId,
      weekNumber,
      year,
      totalSubmissions: 0,
      averageScore: 0,
      improvementRate: 0,
      activityBreakdown: {
        speaking: { count: 0, averageScore: 0 },
        writing: { count: 0, averageScore: 0 },
        quiz: { count: 0, averageScore: 0 },
      },
      strengths: [],
      weaknesses: ['No submissions this week'],
      recommendations: [
        'Complete some activities to track your progress',
        'Aim for at least 3-5 submissions per week',
      ],
    });
  }

  /**
   * Get week start date
   */
  getWeekStartDate(year, weekNumber) {
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7;
    const date = new Date(jan1);
    date.setDate(jan1.getDate() + daysToAdd - jan1.getDay() + 1); // Monday
    return date;
  }

  /**
   * Get student's progress summary (FR10 - Visualization data)
   */
  async getProgressSummary(studentId, { startDate, endDate, limit = 12 } = {}) {
    try {
      const query = { studentId };

      if (startDate || endDate) {
        // If dates provided, find reports in date range
        const weekRanges = this.getWeekRangesFromDates(startDate, endDate);
        query.$or = weekRanges;
      }

      const reports = await ProgressReport.find(query)
        .sort({ year: -1, weekNumber: -1 })
        .limit(limit);

      // Calculate overall statistics
      const totalSubmissions = reports.reduce((sum, r) => sum + r.totalSubmissions, 0);
      const overallAverage =
        reports.length > 0
          ? reports.reduce((sum, r) => sum + r.averageScore, 0) / reports.length
          : 0;

      // Get trend data for visualization
      const trendData = reports
        .reverse()
        .map((report) => ({
          week: `${report.year}-W${report.weekNumber}`,
          averageScore: report.averageScore,
          totalSubmissions: report.totalSubmissions,
          improvementRate: report.improvementRate,
        }));

      // Activity type distribution
      const activityDistribution = {
        speaking: 0,
        writing: 0,
        quiz: 0,
      };

      reports.forEach((report) => {
        activityDistribution.speaking += report.activityBreakdown.speaking.count;
        activityDistribution.writing += report.activityBreakdown.writing.count;
        activityDistribution.quiz += report.activityBreakdown.quiz.count;
      });

      // Recent strengths and weaknesses
      const recentReport = reports[reports.length - 1];
      const strengths = recentReport?.strengths || [];
      const weaknesses = recentReport?.weaknesses || [];

      return {
        summary: {
          totalSubmissions,
          overallAverage: Math.round(overallAverage * 100) / 100,
          reportsCount: reports.length,
        },
        trendData,
        activityDistribution,
        recentPerformance: {
          strengths,
          weaknesses,
          recommendations: recentReport?.recommendations || [],
        },
      };
    } catch (error) {
      logger.error(`Failed to get progress summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get week ranges from date range
   */
  getWeekRangesFromDates(startDate, endDate) {
    const ranges = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    while (current <= end) {
      const weekInfo = getWeekNumber(current);
      ranges.push({ year: weekInfo.year, weekNumber: weekInfo.week });
      current.setDate(current.getDate() + 7);
    }

    return ranges;
  }

  /**
   * Batch generate reports for all students (cron job)
   */
  async batchGenerateWeeklyReports() {
    try {
      const students = await Student.find();
      const weekInfo = getWeekNumber();

      logger.info(
        `Starting batch generation of weekly reports for ${students.length} students (Week ${weekInfo.week}/${weekInfo.year})`
      );

      const results = [];

      for (const student of students) {
        try {
          const report = await this.generateWeeklyReport(
            student._id,
            weekInfo.week,
            weekInfo.year
          );
          results.push({ studentId: student._id, success: true, reportId: report.reportId });
        } catch (error) {
          logger.error(
            `Failed to generate report for student ${student._id}: ${error.message}`
          );
          results.push({ studentId: student._id, success: false, error: error.message });
        }
      }

      logger.info(
        `Batch report generation complete: ${results.filter((r) => r.success).length}/${students.length} successful`
      );

      return results;
    } catch (error) {
      logger.error(`Batch report generation failed: ${error.message}`);
      throw error;
    }
  }
}

export default new ProgressTrackingService();
