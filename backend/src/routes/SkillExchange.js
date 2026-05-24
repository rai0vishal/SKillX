import express from 'express'
import SkillExchange from '../models/SkillExchange.js'
import Profile from '../models/UserProfile.js'   // ✅ NEW: for auto stats update
import { generateMatchInsights } from '../services/aiService.js'

const router = express.Router()

// ✅ GET /api/skill-exchange/recommendations → get top matched profiles with AI insights
router.get('/recommendations', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to fetch recommendations' })
    }

    // 1. Get the current user's profile
    const currentUserProfile = await SkillExchange.findOne({ userId }).sort({ createdAt: -1 })
    
    if (!currentUserProfile) {
      // User hasn't created a profile yet
      return res.status(200).json([])
    }

    // 2. Get other users, sort by matchScore
    const potentialMatches = await SkillExchange.find({ userId: { $ne: userId } })
      .sort({ matchScore: -1 })
      .limit(3) // Top 3 matches

    if (potentialMatches.length === 0) {
      return res.status(200).json([])
    }

    // 3. Get AI insights
    const insights = await generateMatchInsights(currentUserProfile, potentialMatches)

    // 4. Merge insights into matches
    const recommendedMatches = potentialMatches.map((match) => {
      // find insight for this match by id
      const insightData = insights.find(i => i.id === match._id.toString())
      return {
        ...match.toObject(),
        aiInsight: insightData?.aiInsight || null,
        suggestedExchange: insightData?.suggestedExchange || null
      }
    })

    res.status(200).json(recommendedMatches)
  } catch (error) {
    console.error('Error fetching skill exchange recommendations:', error)
    res.status(500).json({ message: 'Failed to fetch recommendations' })
  }
})

// ✅ POST /api/skill-exchange → create an entry + auto-increment stats
router.post('/', async (req, res) => {
  try {
    const {
      name,
      userId,          // 👈 this is the logged-in user's UID
      email,           // 👈 we still need email for auto-increment in Profile
      skillOffered,
      skillWanted,
      location,
      matchScore,
    } = req.body

    console.log('POST /api/skill-exchange body:', req.body)

    const existing = await SkillExchange.findOne({ userId });
    const entry = await SkillExchange.findOneAndUpdate(
      { userId },
      {
        name,
        userId,
        skillOffered,
        skillWanted,
        location,
        matchScore: matchScore ?? 80,
      },
      { new: true, upsert: true }
    )

    // ✅ AUTO-INCREMENT skillExchanges in Profile only if new
    if (!existing) {
      try {
        if (email) {
          await Profile.findOneAndUpdate(
            { email },
            { $inc: { 'stats.skillExchanges': 1 } },
            { upsert: true }  // auto create profile if it doesn't exist
          )
        }
      } catch (err) {
        console.error(
          'Error updating profile stats (skillExchanges +1):',
          err
        )
      }
    }

    res.status(201).json(entry)
  } catch (error) {
    console.error('Error creating skill exchange entry:', error)
    res
      .status(500)
      .json({ message: 'Failed to create skill exchange entry' })
  }
})

function computeMatchScore(currentUser, candidate) {
  const normalize = (str) => (str || '').toLowerCase().trim();
  const splitStr = (str) => normalize(str).split(/[\s,]+/).filter(Boolean);

  const myOffered = splitStr(currentUser.skillOffered);
  const myWanted = splitStr(currentUser.skillWanted);
  const theirOffered = splitStr(candidate.skillOffered);
  const theirWanted = splitStr(candidate.skillWanted);

  const wantCovered = myWanted.filter(s =>
    theirOffered.some(t => t.includes(s) || s.includes(t))
  ).length;

  const offerCovered = theirWanted.filter(s =>
    myOffered.some(t => t.includes(s) || s.includes(t))
  ).length;

  const maxPossible = Math.max(myWanted.length + theirWanted.length, 1);
  const rawScore = ((wantCovered + offerCovered) / maxPossible) * 100;

  return Math.min(Math.round(rawScore), 100);
}

// ✅ GET /api/skill-exchange → list all entries or filter by userId/currentUserId
router.get('/', async (req, res) => {
  try {
    const { userId, currentUserId } = req.query;

    if (userId) {
      // Used by Profile page to fetch just one user's entries
      const entries = await SkillExchange.find({ userId }).sort({ createdAt: -1 });
      return res.json(entries);
    }

    let entriesDocs = await SkillExchange.find({}).sort({ createdAt: -1 });
    // Reset the default MongoDB 80 score to null
    let entries = entriesDocs.map(p => ({ ...p.toObject(), matchScore: null }));

    // If currentUserId is passed, calculate matchScores relative to their profile
    if (currentUserId) {
      const currentUserProfile = await SkillExchange.findOne({ userId: currentUserId }).sort({ createdAt: -1 });
      if (currentUserProfile) {
        entries = entries.map(p => {
          if (p.userId === currentUserId) return p; // Don't score own profile
          return {
            ...p,
            matchScore: computeMatchScore(currentUserProfile, p)
          };
        });
        
        // Sort descending by matchScore for other users
        entries.sort((a, b) => {
          if (a.userId === currentUserId) return -1; // Keep own profile at top or ignore
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA;
        });
      }
    }

    res.json(entries);
  } catch (error) {
    console.error('Error fetching skill exchange entries:', error);
    res.status(500).json({ message: 'Failed to fetch skill exchange entries' });
  }
})

export default router
