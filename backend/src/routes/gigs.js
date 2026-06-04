// src/routes/gigs.js
import express from 'express';
import Gig from '../models/Gig.js';
import Profile from '../models/UserProfile.js';
import { enhanceGigDescription } from '../services/aiService.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

// Gig routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * POST /api/gigs/enhance
 * Uses AI to generate a professional gig description based on basic inputs.
 */
router.post('/enhance', aiLimiter, async (req, res) => {
  try {
    const { title, category, skills, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Gig title is required for AI generation.' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required for AI generation.' });
    }

    // Normalize skills to ensure at least one is provided
    const skillsList = Array.isArray(skills)
      ? skills.filter(Boolean)
      : (skills || '').split(',').map((s) => s.trim()).filter(Boolean);

    if (skillsList.length === 0) {
      return res.status(400).json({ message: 'At least one skill is required for AI generation.' });
    }

    const enhanced = await enhanceGigDescription({
      title: title.trim(),
      category: category.trim(),
      skills: skillsList,
      description: description || '',
    });

    res.status(200).json({ enhanced });
  } catch (error) {
    console.error('Error enhancing gig description:', error);
    res.status(500).json({ message: error.message || 'Failed to generate description.' });
  }
});

/**
 * POST /api/gigs
 * Creates a new Gig and increments the user's gigsPosted stat.
 */
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
      postedBy,
    } = req.body;

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
    });

    try {
      if (postedBy) {
        await Profile.findOneAndUpdate(
          { email: postedBy },
          { $inc: { 'stats.gigsPosted': 1 } },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.error('Error updating profile stats (gigsPosted +1):', err);
      // non-blocking – gig is still created
    }

    res.status(201).json(gig);
  } catch (error) {
    console.error('Error creating gig:', error);
    res.status(500).json({ message: 'Failed to create gig' });
  }
});

/**
 * GET /api/gigs
 * Fetches all gigs sorted by newest first.
 */
router.get('/', async (req, res) => {
  try {
    const gigs = await Gig.find().sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ message: 'Failed to fetch gigs' });
  }
});

/**
 * GET /api/gigs/:id
 * Fetches a single gig by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (error) {
    console.error('Error fetching gig:', error);
    res.status(500).json({ message: 'Failed to fetch gig' });
  }
});

/**
 * DELETE /api/gigs/:id
 * Deletes a gig by ID.
 */
router.delete('/:id', async (req, res) => {
  try {
    const gig = await Gig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error deleting gig:', error);
    res.status(500).json({ message: 'Failed to delete gig' });
  }
});

export default router;
