import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: [true, 'Notification ID is required'],
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'evaluation_completed',
          'feedback_ready',
          'teacher_review',
          'weekly_report',
          'system_announcement',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ['submission', 'evaluation', 'feedback', 'report'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ notificationId: 1 });
notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

// Auto-generate notification ID if not provided
notificationSchema.pre('save', async function (next) {
  if (!this.notificationId) {
    const count = await mongoose.model('Notification').countDocuments();
    this.notificationId = `NOTF${String(count + 1).padStart(8, '0')}`;
  }

  // Set readAt when isRead changes to true
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }

  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
