import express from 'express';
import UserProfile from '../models/UserProfile.js';

const router = express.Router();

// GET /api/profile/:email → get profile by email
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const profile = await UserProfile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// POST /api/profile → create or update profile
router.post('/', async (req, res) => {
  try {
    const { email, name, role, location, bio, skills, stats } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { email },
      {
        email,
        name,
        role,
        location,
        bio,
        skills: skillsArray,
        stats: {
          gigsPosted: stats?.gigsPosted ?? 0,
          gigsCompleted: stats?.gigsCompleted ?? 0,
          skillExchanges: stats?.skillExchanges ?? 0,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: 'Failed to save profile' });
  }
});

export default router;
