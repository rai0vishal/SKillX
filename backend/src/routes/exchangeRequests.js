import express from 'express'
import ExchangeRequest from '../models/ExchangeRequest.js'
import Profile from '../models/UserProfile.js'
import ChatRoom from '../models/ChatRoom.js'
const router = express.Router()

// POST /api/exchange-requests → create a new request
router.post('/', async (req, res) => {
  try {
    const { fromEmail, toEmail, message } = req.body

    if (!fromEmail || !toEmail) {
      return res
        .status(400)
        .json({ message: 'fromEmail and toEmail are required' })
    }

    const request = await ExchangeRequest.create({
      fromEmail,
      toEmail,
      message,
      status: 'pending',
    })

    // ✅ Increment "skillExchanges" for the sender (fromEmail)
    try {
      await Profile.findOneAndUpdate(
        { email: fromEmail },
        { $inc: { 'stats.skillExchanges': 1 } },
        { upsert: true }
      )
    } catch (err) {
      console.error(
        'Error updating profile stats (skillExchanges +1 for sender):',
        err
      )
    }

    res.status(201).json(request)
  } catch (error) {
    console.error('Error creating exchange request:', error)
    res.status(500).json({ message: 'Failed to create exchange request' })
  }
})

// GET /api/exchange-requests?email=someone@gmail.com
// Returns { received: [...], sent: [...] }
router.get('/', async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      const all = await ExchangeRequest.find().sort({ createdAt: -1 })
      return res.json({ received: [], sent: [], all })
    }

    const [received, sent] = await Promise.all([
      // only requests from OTHER people to you
      ExchangeRequest.find({
        toEmail: email,
        fromEmail: { $ne: email },
      }).sort({ createdAt: -1 }),
      ExchangeRequest.find({ fromEmail: email }).sort({ createdAt: -1 }),
    ])

    res.json({ received, sent })
  } catch (error) {
    console.error('Error fetching exchange requests:', error)
    res.status(500).json({ message: 'Failed to fetch exchange requests' })
  }
})

// PATCH /api/exchange-requests/:id → update request status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body

    const allowed = ['pending', 'accepted', 'rejected']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    // 👇 Get the existing request to know previous status + emails
    const existing = await ExchangeRequest.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Request not found' })
    }

    const previousStatus = existing.status
    existing.status = status
    await existing.save()

    // ✅ If status becomes "accepted" (and was not accepted before)
    if (previousStatus !== 'accepted' && status === 'accepted') {
      try {
        await Profile.findOneAndUpdate(
          { email: existing.toEmail },
          { $inc: { 'stats.skillExchangesCompleted': 1 } },
          { upsert: true }
        )
        
        // Auto-create chat room
        const room = await ChatRoom.findOne({ referenceId: existing._id })
        if (!room) {
          await ChatRoom.create({
            participants: [existing.fromEmail, existing.toEmail],
            referenceId: existing._id,
            referenceType: 'exchange',
            title: 'Skill Exchange'
          })
        }
      } catch (err) {
        console.error('Error on exchange request accept:', err)
      }
    }

    res.json(existing)
  } catch (error) {
    console.error('Error updating exchange request:', error)
    res.status(500).json({ message: 'Failed to update exchange request' })
  }
})

export default router
