import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // email
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['MESSAGE', 'REQUEST', 'SESSION', 'REVIEW', 'GIG', 'SYSTEM', 'ADMIN'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String, // ID to the specific document (gig, session, review)
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
