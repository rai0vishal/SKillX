import express from 'express';
import Gig from '../models/Gig.js';
import SkillExchange from '../models/SkillExchange.js';
import UserProfile from '../models/UserProfile.js';

const router = express.Router();

// GET /api/dashboard?email=someone@gmail.com
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    // Global stats
    const [totalGigs, totalSkillExchanges, totalProfiles] = await Promise.all([
      Gig.countDocuments({}),
      SkillExchange.countDocuments({}),
      UserProfile.countDocuments({}),
    ]);

    let user = null;

    if (email) {
      const profile = await UserProfile.findOne({ email });

      user = {
        email,
        name: profile?.name || '',
        stats: {
          gigsPosted: profile?.stats?.gigsPosted ?? 0,
          gigsCompleted: profile?.stats?.gigsCompleted ?? 0,
          skillExchanges: profile?.stats?.skillExchanges ?? 0,
        },
      };
    }

    res.json({
      totalGigs,
      totalSkillExchanges,
      totalProfiles,
      user,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
