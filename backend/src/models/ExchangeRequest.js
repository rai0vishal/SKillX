import mongoose from 'mongoose'

const exchangeRequestSchema = new mongoose.Schema(
  {
    fromEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    toEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
