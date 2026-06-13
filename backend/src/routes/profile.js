import express from 'express';
import UserProfile from '../models/UserProfile.js';
import { profileSpamLimiter } from '../middleware/rateLimiter.js';
import asyncHandler from '../utils/asyncHandler.js';

// UserProfile routes — POST is exempt from auth (for first-time signup).
// All other routes are secured by the global authenticate middleware.
const router = express.Router();

/**
 * GET /api/profile/:email
 * Fetches a user profile by email address.
 */
router.get('/:email', asyncHandler(async (req, res) => {
  const email = req.params.email;
  const profile = await UserProfile.findOne({ email });

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json(profile);
}));

/**
 * POST /api/profile
 * Upserts a user profile. Handles initial creation and subsequent updates.
 */
router.post('/', profileSpamLimiter, asyncHandler(async (req, res) => {
  const { email, name, role, location, bio, skills, stats, socialLinks } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  const safeEmail = typeof email === 'string' ? email.trim() : email;
  const safeName = typeof name === 'string' ? name.trim() : name;

  const skillsArray = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { email: safeEmail },
    {
      email: safeEmail,
      name: safeName,
      role,
      location,
      bio,
      skills: skillsArray,
      socialLinks: socialLinks || [],
      stats: {
        gigsPosted: stats?.gigsPosted ?? 0,
        gigsCompleted: stats?.gigsCompleted ?? 0,
        skillExchanges: stats?.skillExchanges ?? 0,
      },
    },
    { returnDocument: 'after', upsert: true }
  );

  res.status(200).json(updatedProfile);
}));

export default router;
