import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    activityId: {
      type: String,
      required: [true, 'Activity ID is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    activityType: {
      type: String,
      enum: {
        values: ['speaking', 'writing', 'quiz'],
        message: '{VALUE} is not a valid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: '{VALUE} is not a valid difficulty level',
      },
      default: 'intermediate',
    },
    rubricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rubric',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Creator is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Additional fields for quiz type
    questions: [
      {
        questionText: String,
        questionType: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'short-answer'],
        },
        options: [String], // For multiple choice
        correctAnswer: String,
        points: {
          type: Number,
          default: 1,
        },
      },
    ],
    // Additional fields for speaking/writing
    prompt: {
      type: String,
      trim: true,
    },
    expectedDuration: {
      type: Number, // in minutes
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ activityId: 1 });
activitySchema.index({ activityType: 1 });
activitySchema.index({ createdBy: 1 });
activitySchema.index({ isActive: 1 });

// Auto-generate activity ID if not provided
activitySchema.pre('save', async function (next) {
  if (!this.activityId) {
    const typePrefix = {
      speaking: 'SPK',
      writing: 'WRT',
      quiz: 'QUZ',
    };
    const prefix = typePrefix[this.activityType] || 'ACT';
    const count = await mongoose.model('Activity').countDocuments({
      activityType: this.activityType,
    });
    this.activityId = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
