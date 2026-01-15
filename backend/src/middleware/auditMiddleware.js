import AuditLog from '../models/AuditLog.js';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to log user actions for auditing
 */
export const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract entity ID from response or params
        const entityId = data?.data?._id || req.params.id || req.body._id;

        // Create audit log entry
        const logData = {
          userId: req.user?._id,
          action,
          entityType,
          entityId,
          changes: {},
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: true,
        };

        // For UPDATE actions, try to capture changes
        if (action === AUDIT_ACTIONS.UPDATE && req.body) {
          logData.changes = {
            before: req.originalData || {}, // Set by controller
            after: req.body,
          };
        }

        // For CREATE actions, capture created data
        if (action === AUDIT_ACTIONS.CREATE && data?.data) {
          logData.changes = {
            created: data.data,
          };
        }

        // Save audit log asynchronously (don't wait)
        AuditLog.create(logData).catch((error) => {
          logger.error(`Failed to create audit log: ${error.message}`);
        });
      }

      // Call original res.json
      return originalJson(data);
    };

    next();
  };
};

/**
 * Log authentication events
 */
export const auditAuth = (action, success = true) => {
  return async (req, res, next) => {
    try {
      const logData = {
        userId: req.user?._id || req.body.userId,
        action,
        entityType: 'User',
        entityId: req.user?._id || req.body.userId,
        changes: {
          email: req.body.email,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success,
        ...(req.error && { errorMessage: req.error.message }),
      };

      await AuditLog.create(logData);
    } catch (error) {
      logger.error(`Failed to create auth audit log: ${error.message}`);
    }

    next();
  };
};

/**
 * Middleware to capture original data before update
 */
export const captureOriginalData = (Model) => {
  return async (req, res, next) => {
    try {
      if (req.params.id) {
        const original = await Model.findById(req.params.id);
        if (original) {
          req.originalData = original.toObject();
        }
      }
    } catch (error) {
      logger.error(`Failed to capture original data: ${error.message}`);
    }
    next();
  };
};

export default {
  auditLog,
  auditAuth,
  captureOriginalData,
};
