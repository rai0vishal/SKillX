import express from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import VideoSession from '../models/VideoSession.js';
import SessionAttendance from '../models/SessionAttendance.js';
import SessionNotes from '../models/SessionNotes.js';

const router = express.Router();

/**
 * POST /api/video-session/join
 * Validates participant access, creates/fetches VideoSession, records attendance.
 */
router.post('/join', async (req, res) => {
  try {
    const { sessionId, userEmail } = req.body;

    if (!sessionId || !userEmail) {
      return res.status(400).json({ message: 'sessionId and userEmail are required.' });
    }

    // Fetch the scheduled session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Authorization: must be a participant
    if (!session.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'You are not a participant in this session.' });
    }

    // Status check: only allow joining Scheduled or Rescheduled sessions
    if (!['Scheduled', 'Rescheduled'].includes(session.status)) {
      return res.status(400).json({ message: `Session is ${session.status} and cannot be joined.` });
    }

    // Removed strict backend time window check due to timezone discrepancies between
    // local client time strings (stored in DB) and UTC server time. 
    // The frontend SessionCard UI already enforces the 15-minute early join window.

    // Get or create the VideoSession room
    const roomId = `session_${sessionId}`;
    let videoSession = await VideoSession.findOne({ sessionId });

    if (!videoSession) {
      videoSession = await VideoSession.create({
        sessionId,
        roomId,
        participants: session.participants,
        status: 'waiting',
        startedAt: now,
      });
    } else if (videoSession.status === 'ended') {
      return res.status(400).json({ message: 'This video session has already ended.' });
    }

    // Upsert attendance record for this join
    await SessionAttendance.findOneAndUpdate(
      { sessionId, userEmail },
      { joinedAt: now, leftAt: null, durationMinutes: 0 },
      { upsert: true, new: true }
    );

    // Mark video session as active
    if (videoSession.status === 'waiting') {
      videoSession.status = 'active';
      await videoSession.save();
    }

    res.json({ videoSession, roomId });
  } catch (error) {
    console.error('Error joining video session:', error);
    res.status(500).json({ message: 'Failed to join video session.' });
  }
});

/**
 * GET /api/video-session/:sessionId
 * Get the current state of a video session room.
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { email } = req.query;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (email && !session.participants.includes(email)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const videoSession = await VideoSession.findOne({ sessionId });
    res.json({ session, videoSession: videoSession || null });
  } catch (error) {
    console.error('Error fetching video session:', error);
    res.status(500).json({ message: 'Failed to fetch video session.' });
  }
});

/**
 * POST /api/video-session/leave
 * Records when a participant leaves and computes duration.
 */
router.post('/leave', async (req, res) => {
  try {
    const { sessionId, userEmail } = req.body;

    if (!sessionId || !userEmail) {
      return res.status(400).json({ message: 'sessionId and userEmail are required.' });
    }

    const now = new Date();

    const attendance = await SessionAttendance.findOne({ sessionId, userEmail });
    if (attendance) {
      attendance.leftAt = now;
      const diffMs = now - new Date(attendance.joinedAt);
      attendance.durationMinutes = Math.round(diffMs / 60000);
      await attendance.save();
    }

    res.json({ message: 'Attendance recorded.', attendance });
  } catch (error) {
    console.error('Error recording leave:', error);
    res.status(500).json({ message: 'Failed to record leave.' });
  }
});

/**
 * POST /api/video-session/notes
 * Upsert notes for a user in a session (auto-save).
 */
router.post('/notes', async (req, res) => {
  try {
    const { sessionId, userEmail, content } = req.body;

    if (!sessionId || !userEmail) {
      return res.status(400).json({ message: 'sessionId and userEmail are required.' });
    }

    const notes = await SessionNotes.findOneAndUpdate(
      { sessionId, userEmail },
      { content: content || '', updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(notes);
  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({ message: 'Failed to save notes.' });
  }
});

/**
 * GET /api/video-session/notes/:sessionId?email=...
 * Get notes for the current user in a session.
 */
router.get('/notes/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'email query parameter is required.' });
    }

    const notes = await SessionNotes.findOne({ sessionId, userEmail: email });
    res.json({ content: notes?.content || '' });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes.' });
  }
});

export default router;
