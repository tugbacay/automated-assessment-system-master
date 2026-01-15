import mongoose from 'mongoose';

const progressReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: [true, 'Report ID is required'],
      unique: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    weekNumber: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week number must be at least 1'],
      max: [53, 'Week number cannot exceed 53'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2020, 'Year must be 2020 or later'],
    },
    totalSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Total submissions cannot be negative'],
    },
    averageScore: {
      type: Number,
      min: [0, 'Average score cannot be less than 0'],
      max: [100, 'Average score cannot exceed 100'],
    },
    improvementRate: {
      type: Number, // Percentage change from previous week
      default: 0,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    activityBreakdown: {
      speaking: {
        count: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
      },
      writing: {
        count: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
      },
      quiz: {
        count: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
progressReportSchema.index({ reportId: 1 });
progressReportSchema.index({ studentId: 1, year: -1, weekNumber: -1 });
progressReportSchema.index({ generatedAt: -1 });

// Compound unique index to prevent duplicate reports
progressReportSchema.index({ studentId: 1, year: 1, weekNumber: 1 }, { unique: true });

// Auto-generate report ID if not provided
progressReportSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const count = await mongoose.model('ProgressReport').countDocuments();
    this.reportId = `PROG${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const ProgressReport = mongoose.model('ProgressReport', progressReportSchema);

export default ProgressReport;
