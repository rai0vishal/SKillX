import express from 'express'
import ExchangeRequest from '../models/ExchangeRequest.js'
import Profile from '../models/UserProfile.js'
import ChatRoom from '../models/ChatRoom.js'
import admin from '../config/firebaseAdmin.js'

// ExchangeRequest routes — secured by the global authenticate middleware
const router = express.Router()

/**
 * POST /api/exchange-requests
 * Initiates a new skill exchange request and increments the sender's skill exchanges metric.
 */
router.post('/', async (req, res) => {
  try {
    const { fromUserId, toUserId, exchangeId, message, fromEmail, toEmail } = req.body

    if (!fromUserId || !toUserId) {
      return res
        .status(400)
        .json({ message: 'fromUserId and toUserId are required' })
    }

    let resolvedFromEmail = fromEmail || ''
    let resolvedToEmail = toEmail || ''

    if (!resolvedFromEmail && fromUserId) {
      try {
        const userRecord = await admin.auth().getUser(fromUserId)
        resolvedFromEmail = userRecord.email || ''
      } catch (e) {
        console.warn(`Could not resolve fromEmail for ${fromUserId}:`, e.message)
      }
    }

    if (!resolvedToEmail && toUserId) {
      try {
        const userRecord = await admin.auth().getUser(toUserId)
        resolvedToEmail = userRecord.email || ''
      } catch (e) {
        console.warn(`Could not resolve toEmail for ${toUserId}:`, e.message)
      }
    }

    const request = await ExchangeRequest.create({
      fromUserId,
      toUserId,
      exchangeId,
      message,
      fromEmail: resolvedFromEmail,
      toEmail: resolvedToEmail,
      status: 'pending',
    })
    try {
      if (fromEmail) {
        await Profile.findOneAndUpdate(
          { email: fromEmail },
          { $inc: { 'stats.skillExchanges': 1 } },
          { upsert: true }
        )
      }
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

/**
 * GET /api/exchange-requests
 * Fetches requests either received or sent by the user.
 */
router.get('/', async (req, res) => {
  try {
    const { userId, email } = req.query

    if (!userId && !email) {
      const all = await ExchangeRequest.find().sort({ createdAt: -1 })
      return res.json({ received: [], sent: [], all })
    }

    let receivedQuery = {};
    let sentQuery = {};

    if (email) {
      receivedQuery = { toEmail: email, fromEmail: { $ne: email } };
      sentQuery = { fromEmail: email };
    } else {
      receivedQuery = { toUserId: userId, fromUserId: { $ne: userId } };
      sentQuery = { fromUserId: userId };
    }

    const [received, sent] = await Promise.all([
      ExchangeRequest.find(receivedQuery).sort({ createdAt: -1 }),
      ExchangeRequest.find(sentQuery).sort({ createdAt: -1 }),
    ])

    res.json({ received, sent })
  } catch (error) {
    console.error('Error fetching exchange requests:', error)
    res.status(500).json({ message: 'Failed to fetch exchange requests' })
  }
})

/**
 * PATCH /api/exchange-requests/:id
 * Updates request status. On acceptance, increments completed metrics and creates a ChatRoom.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body

    const allowed = ['pending', 'accepted', 'rejected']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const existing = await ExchangeRequest.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Request not found' })
    }

    const previousStatus = existing.status
    existing.status = status
    await existing.save()

    if (previousStatus !== 'accepted' && status === 'accepted') {
      try {
        await Profile.findOneAndUpdate(
          { email: existing.toEmail },
          { $inc: { 'stats.skillExchangesCompleted': 1 } },
          { upsert: true }
        )
        // Resolve any missing emails from Firebase Admin before creating room
        if (!existing.fromEmail && existing.fromUserId) {
          try {
            const userRecord = await admin.auth().getUser(existing.fromUserId)
            existing.fromEmail = userRecord.email || ''
            if (existing.fromEmail) await existing.save()
            console.log(`Resolved fromEmail: ${existing.fromEmail}`)
          } catch (e) {
            console.warn(`Could not resolve fromEmail for userId ${existing.fromUserId}:`, e.message)
          }
        }

        if (!existing.toEmail && existing.toUserId) {
          try {
            const userRecord = await admin.auth().getUser(existing.toUserId)
            existing.toEmail = userRecord.email || ''
            if (existing.toEmail) await existing.save()
            console.log(`Resolved toEmail: ${existing.toEmail}`)
          } catch (e) {
            console.warn(`Could not resolve toEmail for userId ${existing.toUserId}:`, e.message)
          }
        }

        if (!existing.fromEmail || !existing.toEmail) {
          console.warn(`Skipping chat room — could not resolve emails for request ${existing._id}`)
        } else {
          let chatRoom = await ChatRoom.findOne({ referenceId: existing._id })
          if (!chatRoom) {
            chatRoom = await ChatRoom.create({
              participants: [existing.fromEmail, existing.toEmail],
              referenceId: existing._id,
              referenceType: 'exchange',
              title: 'Skill Exchange'
            })
          }
          existing.chatRoomId = chatRoom._id.toString()
          await existing.save()
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
