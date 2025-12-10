// src/models/GigApplication.js
import mongoose from 'mongoose'

const gigApplicationSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    applicantEmail: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

const GigApplication = mongoose.model(
  'GigApplication',
  gigApplicationSchema
)

export default GigApplication
