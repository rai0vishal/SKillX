import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    stats: {
      gigsPosted: { type: Number, default: 0 },
      gigsCompleted: { type: Number, default: 0 },
      skillExchanges: { type: Number, default: 0 },
      skillExchangesCompleted: { type: Number, default: 0 },  

    },
  },
  { timestamps: true }
);

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
