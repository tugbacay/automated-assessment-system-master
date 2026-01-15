import Evaluation from '../models/Evaluation.js';
import mongoose from 'mongoose';

class EvaluationRepository {
  /**
   * Create new evaluation
   */
  async create(evaluationData) {
    return await Evaluation.create(evaluationData);
  }

  /**
   * Find evaluation by ID
   */
  async findById(evaluationId) {
    return await Evaluation.findById(evaluationId)
      .populate('submissionId')
      .populate('teacherId', 'userId teacherId name');
  }

  /**
   * Find evaluation by submission ID
   */
  async findBySubmission(submissionId) {
    return await Evaluation.findOne({ submissionId })
      .populate('teacherId', 'userId teacherId name');
  }

  /**
   * Find evaluations by date range
   */
  async findByDateRange(startDate, endDate, { studentId = null } = {}) {
    const query = {
      evaluatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // If studentId is provided, join with submissions
    if (studentId) {
      const evaluations = await Evaluation.find(query)
        .populate({
          path: 'submissionId',
          match: { studentId },
        });

      // Filter out evaluations where submission didn't match
      return evaluations.filter(eval => eval.submissionId !== null);
    }

    return await Evaluation.find(query).sort({ evaluatedAt: -1 });
  }

  /**
   * Find evaluations pending teacher review
   */
  async findPendingReview({ page = 1, limit = 10 } = {}) {
    const query = { reviewedByTeacher: false };
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      Evaluation.find(query)
        .populate({
          path: 'submissionId',
          populate: {
            path: 'studentId activityId',
          },
        })
        .sort({ evaluatedAt: 1 })
        .skip(skip)
        .limit(limit),
      Evaluation.countDocuments(query),
    ]);

    return { evaluations, total, page, limit };
  }

  /**
   * Update evaluation (teacher review)
   */
  async update(evaluationId, updateData) {
    return await Evaluation.findByIdAndUpdate(evaluationId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Mark as reviewed by teacher
   */
  async markAsReviewed(evaluationId, teacherId, teacherNotes) {
    return await Evaluation.findByIdAndUpdate(
      evaluationId,
      {
        reviewedByTeacher: true,
        teacherId,
        teacherNotes,
      },
      { new: true }
    );
  }

  /**
   * Get average scores for a student
   */
  async getStudentAverageScores(studentId) {
    const result = await Evaluation.aggregate([
      {
        $lookup: {
          from: 'submissions',
          localField: 'submissionId',
          foreignField: '_id',
          as: 'submission',
        },
      },
      { $unwind: '$submission' },
      {
        $match: {
          'submission.studentId': new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        $group: {
          _id: null,
          avgOverallScore: { $avg: '$overallScore' },
          avgGrammarScore: { $avg: '$grammarScore' },
          avgVocabularyScore: { $avg: '$vocabularyScore' },
          avgPronunciationScore: { $avg: '$pronunciationScore' },
          avgLogicScore: { $avg: '$logicScore' },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0] || null;
  }

  /**
   * Get evaluation statistics
   */
  async getStats() {
    const stats = await Evaluation.aggregate([
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          reviewedCount: {
            $sum: { $cond: ['$reviewedByTeacher', 1, 0] },
          },
          avgOverallScore: { $avg: '$overallScore' },
          avgAIConfidence: { $avg: '$aiConfidence' },
        },
      },
    ]);

    return stats[0] || null;
  }
}

export default new EvaluationRepository();
