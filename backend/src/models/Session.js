import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 2,
        message: 'A session must have exactly 2 participants.',
      },
    },
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      enum: ['30 mins', '60 mins', '90 mins', '120 mins'],
      default: '60 mins',
    },
    mode: {
      type: String,
      enum: ['Remote', 'Video Session', 'In Person', 'Chat Session'],
      default: 'Remote',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled',
    },
    reviewedBy: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
