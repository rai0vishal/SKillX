import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    participants: {
      type: [String], // Array of emails
      required: true,
    },
    referenceId: {
      type: String, // Can be gigId or exchangeRequestId for context
      required: false,
    },
    referenceType: {
      type: String, // 'gig' or 'exchange'
      required: false,
    },
    title: {
      type: String, // Context title like "React Portfolio"
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatRoom', chatRoomSchema);
