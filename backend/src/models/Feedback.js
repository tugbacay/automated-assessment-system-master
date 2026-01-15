import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: String,
      required: [true, 'Feedback ID is required'],
      unique: true,
      trim: true,
    },
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation',
      required: [true, 'Evaluation ID is required'],
      unique: true, // One feedback per evaluation
    },
    feedbackText: {
      type: String,
      required: [true, 'Feedback text is required'],
      trim: true,
      minlength: [10, 'Feedback must be at least 10 characters'],
      maxlength: [5000, 'Feedback cannot exceed 5000 characters'],
    },
    isSummarized: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    tone: {
      type: String,
      enum: ['encouraging', 'constructive', 'neutral'],
      default: 'constructive',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
feedbackSchema.index({ feedbackId: 1 });
feedbackSchema.index({ evaluationId: 1 });
feedbackSchema.index({ generatedAt: -1 });

// Auto-generate feedback ID if not provided
feedbackSchema.pre('save', async function (next) {
  if (!this.feedbackId) {
    const count = await mongoose.model('Feedback').countDocuments();
    this.feedbackId = `FDBK${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
