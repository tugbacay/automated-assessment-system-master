import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      required: [true, 'Submission ID is required'],
      unique: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    contentType: {
      type: String,
      enum: {
        values: ['speaking', 'writing', 'quiz'],
        message: '{VALUE} is not a valid content type',
      },
      required: [true, 'Content type is required'],
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Content is required'],
    },
    // For speaking: { audioUrl: String, duration: Number }
    // For writing: { text: String, wordCount: Number }
    // For quiz: { answers: [{questionId: String, answer: String}] }
    status: {
      type: String,
      enum: {
        values: ['pending', 'evaluating', 'completed', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      attemptNumber: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
submissionSchema.index({ submissionId: 1 });
submissionSchema.index({ studentId: 1, createdAt: -1 });
submissionSchema.index({ activityId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });

// Compound index for student submissions by activity
submissionSchema.index({ studentId: 1, activityId: 1 });

// Auto-generate submission ID if not provided
submissionSchema.pre('save', async function (next) {
  if (!this.submissionId) {
    const typePrefix = {
      speaking: 'SPKS',
      writing: 'WRTS',
      quiz: 'QUZS',
    };
    const prefix = typePrefix[this.contentType] || 'SUBS';
    const count = await mongoose.model('Submission').countDocuments();
    this.submissionId = `${prefix}${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
