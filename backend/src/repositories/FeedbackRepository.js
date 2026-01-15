import Feedback from '../models/Feedback.js';

class FeedbackRepository {
  /**
   * Create new feedback
   */
  async create(feedbackData) {
    return await Feedback.create(feedbackData);
  }

  /**
   * Find feedback by ID
   */
  async findById(feedbackId) {
    return await Feedback.findById(feedbackId).populate('evaluationId');
  }

  /**
   * Find feedback by evaluation ID
   */
  async findByEvaluation(evaluationId) {
    return await Feedback.findOne({ evaluationId });
  }

  /**
   * Update feedback
   */
  async update(feedbackId, updateData) {
    return await Feedback.findByIdAndUpdate(feedbackId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete feedback
   */
  async delete(feedbackId) {
    return await Feedback.findByIdAndDelete(feedbackId);
  }

  /**
   * Get all feedback with pagination
   */
  async findAll({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      Feedback.find()
        .populate({
          path: 'evaluationId',
          populate: {
            path: 'submissionId',
          },
        })
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(),
    ]);

    return { feedbacks, total, page, limit };
  }
}

export default new FeedbackRepository();
