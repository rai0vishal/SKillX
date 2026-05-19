// src/models/GigApplication.js
import mongoose from 'mongoose';

const gigApplicationSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    gigTitle: { type: String, required: true },

    // who posted the gig (owner)
    gigOwnerEmail: { type: String, required: true },

    // who is applying
    applicantEmail: { type: String, required: true },

    message: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const GigApplication = mongoose.model('GigApplication', gigApplicationSchema);

export default GigApplication;
