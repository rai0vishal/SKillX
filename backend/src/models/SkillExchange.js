import mongoose from 'mongoose';

const skillExchangeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false }, // 👈 who owns this profile
    skillOffered: { type: String, required: true },
    skillWanted: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    matchScore: { type: Number, default: 80 }, // 0–100
  },
  { timestamps: true }
);

const SkillExchange = mongoose.model('SkillExchange', skillExchangeSchema);

export default SkillExchange;
