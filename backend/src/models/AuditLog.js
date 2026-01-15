import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: [true, 'Log ID is required'],
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      enum: {
        values: [
          'CREATE',
          'READ',
          'UPDATE',
          'DELETE',
          'LOGIN',
          'LOGOUT',
          'LOGIN_FAILED',
          'PASSWORD_CHANGE',
          'PERMISSION_CHANGE',
        ],
        message: '{VALUE} is not a valid action',
      },
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
      enum: {
        values: [
          'User',
          'Student',
          'Teacher',
          'Activity',
          'Submission',
          'Evaluation',
          'Feedback',
          'Rubric',
          'Notification',
        ],
        message: '{VALUE} is not a valid entity type',
      },
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // Store before/after values
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false, // Using timestamp field instead
  }
);

// Indexes for efficient querying
auditLogSchema.index({ logId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

// Auto-generate log ID if not provided
auditLogSchema.pre('save', async function (next) {
  if (!this.logId) {
    const count = await mongoose.model('AuditLog').countDocuments();
    this.logId = `AUDT${String(count + 1).padStart(10, '0')}`;
  }
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
