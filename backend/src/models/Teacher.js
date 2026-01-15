import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
teacherSchema.index({ userId: 1 });
teacherSchema.index({ teacherId: 1 });

// Auto-generate teacher ID if not provided
teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    const count = await mongoose.model('Teacher').countDocuments();
    this.teacherId = `TCH${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
