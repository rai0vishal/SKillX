import mongoose from 'mongoose';

const sessionAttendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index — one attendance record per user per session
sessionAttendanceSchema.index({ sessionId: 1, userEmail: 1 }, { unique: true });

export default mongoose.model('SessionAttendance', sessionAttendanceSchema);
