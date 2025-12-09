import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, default: 'One-time Project' },
    skills: { type: [String], default: [] },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    duration: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    postedBy: { type: String, default: 'Anonymous' },
  },
  { timestamps: true }
);

const Gig = mongoose.model('Gig', gigSchema);

export default Gig;
