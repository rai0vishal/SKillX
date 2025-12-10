import express from 'express'
import Gig from '../models/Gig.js'
import Profile from '../models/UserProfile.js' // 👈 NEW: to update user stats

const router = express.Router()

// POST /api/gigs → create gig
router.post('/', async (req, res) => {
  try {
    const {
      title,
      category,
      type,
      skills,
      description,
      budget,
      duration,
      location,
      postedBy, // 👈 should be the user's email
    } = req.body

    const gig = await Gig.create({
      title,
      category,
      type,
      skills,
      description,
      budget,
      duration,
      location,
      postedBy,
    })

    // 🔁 Increment gigsPosted in Profile for this user
    try {
      if (postedBy) {
        await Profile.findOneAndUpdate(
          { email: postedBy },
          { $inc: { 'stats.gigsPosted': 1 } },
          { upsert: true } // create profile if it doesn't exist yet
        )
      }
    } catch (err) {
      console.error('Error updating profile stats (gigsPosted +1):', err)
      // don't fail the request; gig is already created
    }

    res.status(201).json(gig)
  } catch (error) {
    console.error('Error creating gig:', error)
    res.status(500).json({ message: 'Failed to create gig' })
  }
})

// GET /api/gigs → list all gigs
router.get('/', async (req, res) => {
  try {
    const gigs = await Gig.find().sort({ createdAt: -1 })
    res.json(gigs)
  } catch (error) {
    console.error('Error fetching gigs:', error)
    res.status(500).json({ message: 'Failed to fetch gigs' })
  }
})

// GET /api/gigs/:id → single gig
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
    if (!gig) return res.status(404).json({ message: 'Gig not found' })
    res.json(gig)
  } catch (error) {
    console.error('Error fetching gig:', error)
    res.status(500).json({ message: 'Failed to fetch gig' })
  }
})

// DELETE /api/gigs/:id → delete gig
router.delete('/:id', async (req, res) => {
  try {
    const gig = await Gig.findByIdAndDelete(req.params.id)
    if (!gig) return res.status(404).json({ message: 'Gig not found' })

    // 🔁 Decrement gigsPosted for that user
    try {
      if (gig.postedBy) {
        await Profile.findOneAndUpdate(
          { email: gig.postedBy },
          { $inc: { 'stats.gigsPosted': -1 } }
        )
      }
    } catch (err) {
      console.error('Error updating profile stats (gigsPosted -1):', err)
      // don't block delete because of stats
    }

    res.json({ message: 'Gig deleted successfully' })
  } catch (error) {
    console.error('Error deleting gig:', error)
    res.status(500).json({ message: 'Failed to delete gig' })
  }
})

export default router
