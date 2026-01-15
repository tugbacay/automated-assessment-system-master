import Submission from '../models/Submission.js';

class SubmissionRepository {
  /**
   * Create new submission
   */
  async create(submissionData) {
    return await Submission.create(submissionData);
  }

  /**
   * Find submission by ID
   */
  async findById(submissionId) {
    return await Submission.findById(submissionId)
      .populate('studentId', 'userId studentId')
      .populate('activityId', 'title activityType difficulty');
  }

  /**
   * Find submissions by student
   */
  async findByStudent(studentId, { page = 1, limit = 10, status = null } = {}) {
    const query = { studentId };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate('activityId', 'title activityType difficulty')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(query),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Find submissions by activity
   */
  async findByActivity(activityId, { page = 1, limit = 10 } = {}) {
    const query = { activityId };
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate('studentId', 'userId studentId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(query),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Find pending submissions (for AI evaluation queue)
   */
  async findPending(limit = 50) {
    return await Submission.find({ status: 'pending' })
      .populate('activityId')
      .sort({ submittedAt: 1 })
      .limit(limit);
  }

  /**
   * Update submission status
   */
  async updateStatus(submissionId, status) {
    return await Submission.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update submission
   */
  async update(submissionId, updateData) {
    return await Submission.findByIdAndUpdate(submissionId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete submission
   */
  async delete(submissionId) {
    return await Submission.findByIdAndDelete(submissionId);
  }

  /**
   * Get student submission statistics
   */
  async getStudentStats(studentId) {
    const stats = await Submission.aggregate([
      { $match: { studentId: studentId } },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]);

    return stats;
  }

  /**
   * Get submissions by date range
   */
  async findByDateRange(startDate, endDate, { studentId = null } = {}) {
    const query = {
      submittedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (studentId) query.studentId = studentId;

    return await Submission.find(query)
      .populate('activityId', 'title activityType')
      .sort({ submittedAt: -1 });
  }
}

export default new SubmissionRepository();
