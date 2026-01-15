import mongoose from 'mongoose';

const mistakeSchema = new mongoose.Schema(
  {
    mistakeId: {
      type: String,
      required: [true, 'Mistake ID is required'],
      unique: true,
      trim: true,
    },
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation',
      required: [true, 'Evaluation ID is required'],
    },
    errorType: {
      type: String,
      enum: {
        values: ['grammar', 'vocabulary', 'pronunciation', 'logic', 'spelling', 'punctuation'],
        message: '{VALUE} is not a valid error type',
      },
      required: [true, 'Error type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    suggestion: {
      type: String,
      required: [true, 'Suggestion is required'],
      trim: true,
      maxlength: [500, 'Suggestion cannot exceed 500 characters'],
    },
    positionStart: {
      type: Number,
      min: [0, 'Position cannot be negative'],
    },
    positionEnd: {
      type: Number,
      min: [0, 'Position cannot be negative'],
    },
    severity: {
      type: String,
      enum: {
        values: ['critical', 'major', 'minor'],
        message: '{VALUE} is not a valid severity level',
      },
      default: 'minor',
    },
    isPossibleError: {
      type: Boolean,
      default: false, // True if AI is uncertain
    },
    originalText: {
      type: String,
      trim: true,
    },
    correctedText: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mistakeSchema.index({ mistakeId: 1 });
mistakeSchema.index({ evaluationId: 1 });
mistakeSchema.index({ errorType: 1 });
mistakeSchema.index({ severity: 1 });

// Auto-generate mistake ID if not provided
mistakeSchema.pre('save', async function (next) {
  if (!this.mistakeId) {
    const count = await mongoose.model('Mistake').countDocuments();
    this.mistakeId = `MSTK${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const Mistake = mongoose.model('Mistake', mistakeSchema);

export default Mistake;
