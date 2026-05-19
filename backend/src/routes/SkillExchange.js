import express from 'express'
import SkillExchange from '../models/SkillExchange.js'
import Profile from '../models/UserProfile.js'   // ✅ NEW: for auto stats update
import { generateMatchInsights } from '../services/aiService.js'

const router = express.Router()

// ✅ GET /api/skill-exchange/recommendations → get top matched profiles with AI insights
router.get('/recommendations', async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({ message: 'Email is required to fetch recommendations' })
    }

    // 1. Get the current user's profile
    const currentUserProfile = await SkillExchange.findOne({ email }).sort({ createdAt: -1 })
    
    if (!currentUserProfile) {
      // User hasn't created a profile yet
      return res.status(200).json([])
    }

    // 2. Get other users, sort by matchScore
    const potentialMatches = await SkillExchange.find({ email: { $ne: email } })
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
      email,          // 👈 this is the logged-in user's email
      skillOffered,
      skillWanted,
      location,
      matchScore,
    } = req.body

    console.log('POST /api/skill-exchange body:', req.body)

    const entry = await SkillExchange.create({
      name,
      email,
      skillOffered,
      skillWanted,
      location,
      matchScore: matchScore ?? 80,
    })

    // ✅ AUTO-INCREMENT skillExchanges in Profile
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

    res.status(201).json(entry)
  } catch (error) {
    console.error('Error creating skill exchange entry:', error)
    res
      .status(500)
      .json({ message: 'Failed to create skill exchange entry' })
  }
})

// ✅ GET /api/skill-exchange → list all entries
router.get('/', async (req, res) => {
  try {
    const entries = await SkillExchange.find().sort({ createdAt: -1 })
    res.json(entries)
  } catch (error) {
    console.error('Error fetching skill exchange entries:', error)
    res
      .status(500)
      .json({ message: 'Failed to fetch skill exchange entries' })
  }
})

export default router
