import express from 'express'
import SkillExchange from '../models/SkillExchange.js'
import Profile from '../models/UserProfile.js'   // ✅ NEW: for auto stats update

const router = express.Router()

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
