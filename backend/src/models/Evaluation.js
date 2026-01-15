import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    evaluationId: {
      type: String,
      required: [true, 'Evaluation ID is required'],
      unique: true,
      trim: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Submission ID is required'],
      unique: true, // One evaluation per submission
    },
    overallScore: {
      type: Number,
      required: [true, 'Overall score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot be more than 100'],
    },
    grammarScore: {
      type: Number,
      min: [0, 'Grammar score cannot be less than 0'],
      max: [100, 'Grammar score cannot be more than 100'],
    },
    vocabularyScore: {
      type: Number,
      min: [0, 'Vocabulary score cannot be less than 0'],
      max: [100, 'Vocabulary score cannot be more than 100'],
    },
    pronunciationScore: {
      type: Number, // For speaking activities
      min: [0, 'Pronunciation score cannot be less than 0'],
      max: [100, 'Pronunciation score cannot be more than 100'],
    },
    logicScore: {
      type: Number, // For quiz activities
      min: [0, 'Logic score cannot be less than 0'],
      max: [100, 'Logic score cannot be more than 100'],
    },
    aiConfidence: {
      type: Number,
      required: [true, 'AI confidence is required'],
      min: [0, 'Confidence cannot be less than 0'],
      max: [1, 'Confidence cannot be more than 1'],
      default: 0.85,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedByTeacher: {
      type: Boolean,
      default: false,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    teacherNotes: {
      type: String,
      maxlength: [1000, 'Teacher notes cannot exceed 1000 characters'],
    },
    scoreBreakdown: {
      type: Map,
      of: Number, // Flexible score breakdown by criteria
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
evaluationSchema.index({ evaluationId: 1 });
evaluationSchema.index({ submissionId: 1 });
evaluationSchema.index({ evaluatedAt: -1 });
evaluationSchema.index({ reviewedByTeacher: 1 });

// Auto-generate evaluation ID if not provided
evaluationSchema.pre('save', async function (next) {
  if (!this.evaluationId) {
    const count = await mongoose.model('Evaluation').countDocuments();
    this.evaluationId = `EVAL${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
