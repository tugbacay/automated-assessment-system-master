import AuditLog from '../models/AuditLog.js';

class AuditLogRepository {
  /**
   * Create audit log entry
   */
  async create(logData) {
    return await AuditLog.create(logData);
  }

  /**
   * Find logs by user
   */
  async findByUser(userId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({ userId }),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Find logs by action
   */
  async findByAction(action, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ action })
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({ action }),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Find logs by date range
   */
  async findByDateRange(startDate, endDate, { page = 1, limit = 50 } = {}) {
    const query = {
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Find all logs with filters
   */
  async findAll({ userId, action, entityType, startDate, endDate, page = 1, limit = 50 } = {}) {
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Delete old logs (cleanup)
   */
  async deleteOlderThan(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }

  /**
   * Get audit statistics
   */
  async getStats({ startDate, endDate } = {}) {
    const matchStage = {};

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }

    const stats = await AuditLog.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: ['$success', 1, 0] },
          },
          failureCount: {
            $sum: { $cond: ['$success', 0, 1] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }
}

export default new AuditLogRepository();
