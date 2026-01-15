import mongoose from 'mongoose';

const rubricSchema = new mongoose.Schema(
  {
    rubricId: {
      type: String,
      required: [true, 'Rubric ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Rubric name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    activityType: {
      type: String,
      enum: {
        values: ['speaking', 'writing', 'quiz', 'general'],
        message: '{VALUE} is not a valid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    criteria: [
      {
        name: {
          type: String,
          required: [true, 'Criterion name is required'],
          trim: true,
        },
        weight: {
          type: Number,
          required: [true, 'Weight is required'],
          min: [0, 'Weight cannot be negative'],
          max: [1, 'Weight cannot exceed 1'],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        levels: [
          {
            level: {
              type: String,
              required: true,
            },
            score: {
              type: Number,
              required: true,
            },
            description: String,
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Creator is required'],
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rubricSchema.index({ rubricId: 1 });
rubricSchema.index({ activityType: 1 });
rubricSchema.index({ createdBy: 1 });
rubricSchema.index({ isTemplate: 1 });

// Validate that weights sum to 1
rubricSchema.pre('save', function (next) {
  if (this.criteria && this.criteria.length > 0) {
    const totalWeight = this.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return next(new Error('Criteria weights must sum to 1.0'));
    }
  }

  // Auto-generate rubric ID if not provided
  if (!this.rubricId) {
    mongoose.model('Rubric').countDocuments().then((count) => {
      this.rubricId = `RBR${String(count + 1).padStart(6, '0')}`;
      next();
    });
  } else {
    next();
  }
});

const Rubric = mongoose.model('Rubric', rubricSchema);

export default Rubric;
