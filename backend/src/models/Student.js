import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      notificationEnabled: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: 'en',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ studentId: 1 });

// Auto-generate student ID if not provided
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
