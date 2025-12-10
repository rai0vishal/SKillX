// src/routes/gigApplications.js
import express from 'express'
import GigApplication from '../models/GigApplication.js'

const router = express.Router()

// POST /api/gig-applications  → create application
router.post('/', async (req, res) => {
  try {
    const { gigId, applicantEmail, message } = req.body

    if (!gigId || !applicantEmail) {
      return res
        .status(400)
        .json({ message: 'gigId and applicantEmail are required' })
    }

    const app = await GigApplication.create({
      gigId,
      applicantEmail,
      message,
    })

    res.status(201).json(app)
  } catch (error) {
    console.error('Error creating gig application:', error)
    res.status(500).json({ message: 'Failed to create gig application' })
  }
})

// GET /api/gig-applications?gigId=...  or ?email=...
router.get('/', async (req, res) => {
  try {
    const { gigId, email } = req.query

    if (gigId) {
      const apps = await GigApplication.find({ gigId }).sort({
        createdAt: -1,
      })
      return res.json(apps)
    }

    if (email) {
      const apps = await GigApplication.find({
        applicantEmail: email,
      }).sort({ createdAt: -1 })
      return res.json(apps)
    }

    const all = await GigApplication.find().sort({ createdAt: -1 })
    res.json(all)
  } catch (error) {
    console.error('Error fetching gig applications:', error)
    res.status(500).json({ message: 'Failed to fetch gig applications' })
  }
})

// PATCH /api/gig-applications/:id  → update status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['pending', 'accepted', 'rejected']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const updated = await GigApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: 'Application not found' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating gig application:', error)
    res
      .status(500)
      .json({ message: 'Failed to update gig application' })
  }
})

export default router
