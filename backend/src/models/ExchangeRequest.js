import mongoose from 'mongoose'

const exchangeRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: String,
      required: true,
      trim: true,
    },

    toUserId: {
      type: String,
      required: true,
      trim: true,
    },

    exchangeId: {
      type: String,
    },

    fromEmail: {
      type: String,
      trim: true,
    },

    toEmail: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],  // ✅ SAFETY CHECK
      default: 'pending',
    },
  },
  { timestamps: true }
)

const ExchangeRequest = mongoose.model(
  'ExchangeRequest',
  exchangeRequestSchema
)

export default ExchangeRequest
