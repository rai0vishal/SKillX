// src/routes/gigApplications.js
import express from 'express';
import GigApplication from '../models/GigApplication.js';
import Gig from '../models/Gig.js';

const router = express.Router();

/**
 * POST /api/gig-applications
 * Body: { gigId, applicantEmail, message }
 */
router.post('/', async (req, res) => {
  try {
    const { gigId, applicantEmail, message } = req.body;

    if (!gigId || !applicantEmail) {
      return res
        .status(400)
        .json({ message: 'gigId and applicantEmail are required' });
    }

    // find gig to get owner + title
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // prevent owner from applying to own gig (optional)
    if (gig.postedBy === applicantEmail) {
      return res
        .status(400)
        .json({ message: 'You cannot apply to your own gig.' });
    }

    // optional: prevent duplicate applications for same gig from same user
    const existing = await GigApplication.findOne({
      gigId,
      applicantEmail,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'You have already applied to this gig.' });
    }

    const app = await GigApplication.create({
      gigId,
      gigTitle: gig.title,
      gigOwnerEmail: gig.postedBy,
      applicantEmail,
      message,
      status: 'pending',
    });

    res.status(201).json(app);
  } catch (error) {
    console.error('Error creating gig application:', error);
    res.status(500).json({ message: 'Failed to apply for gig' });
  }
});

/**
 * GET /api/gig-applications?email=abc@gmail.com
 * Returns { received: [...], sent: [...] }
 *
 * received → people applying to your gigs
 * sent → gigs you have applied to
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      // if needed, you could also return all applications
      const all = await GigApplication.find().sort({ createdAt: -1 });
      return res.json({ received: [], sent: [], all });
    }

    const [received, sent] = await Promise.all([
      GigApplication.find({ gigOwnerEmail: email }).sort({ createdAt: -1 }),
      GigApplication.find({ applicantEmail: email }).sort({ createdAt: -1 }),
    ]);

    res.json({ received, sent });
  } catch (error) {
    console.error('Error fetching gig applications:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch gig applications' });
  }
});

/**
 * PATCH /api/gig-applications/:id
 * Body: { status }
 * status in: 'pending' | 'accepted' | 'rejected'
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await GigApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // (optional) here you could also update profile stats, e.g.
    // if (status === 'accepted') increment gigsCompleted for owner or applicant

    res.json(updated);
  } catch (error) {
    console.error('Error updating gig application:', error);
    res
      .status(500)
      .json({ message: 'Failed to update gig application' });
  }
});

export default router;
