import express from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import VideoSession from '../models/VideoSession.js';
import SessionAttendance from '../models/SessionAttendance.js';
import SessionNotes from '../models/SessionNotes.js';
import { emitNotification } from '../socket/notificationSocket.js';

const router = express.Router();

/**
 * POST /api/video-session/join
 * Validates participant access, creates/fetches VideoSession, records attendance.
 */
router.post('/join', async (req, res) => {
  try {
    const { sessionId, userEmail } = req.body;

    console.log(`[Video Session] Join Request - SessionId: ${sessionId}, UserEmail: ${userEmail}`);

    if (!sessionId || !userEmail) {
      console.warn(`[Video Session] Join Failed: Missing parameters. sessionId=${sessionId}, userEmail=${userEmail}`);
      return res.status(400).json({ message: 'sessionId and userEmail are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.warn(`[Video Session] Join Failed: Invalid sessionId format (${sessionId}).`);
      return res.status(400).json({ message: 'Invalid session ID format.' });
    }

    // Fetch the scheduled session
    const session = await Session.findById(sessionId);
    if (!session) {
      console.warn(`[Video Session] Join Failed: Session ${sessionId} not found in DB.`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    console.log(`[Video Session] Found Session: status=${session.status}, mode=${session.mode}`);

    // Authorization: must be a participant
    if (!session.participants.includes(userEmail)) {
      console.warn(`[Video Session] Join Failed: Unauthorized user. ${userEmail} is not in participants list:`, session.participants);
      return res.status(403).json({ message: 'You are not a participant in this session.' });
    }

    // Status check: only allow joining Scheduled or Rescheduled sessions
    if (!['Scheduled', 'Rescheduled'].includes(session.status)) {
      console.warn(`[Video Session] Join Failed: Invalid status (${session.status}). Only Scheduled or Rescheduled are allowed.`);
      return res.status(400).json({ message: `Session is ${session.status} and cannot be joined.` });
    }

    // Removed strict backend time window check due to timezone discrepancies between
    // local client time strings (stored in DB) and UTC server time. 
    // The frontend SessionCard UI already enforces the 15-minute early join window.

    // Get or create the VideoSession room atomically to prevent race condition 500 errors
    const roomId = session.roomId || `session_${sessionId}`;
    const now = new Date();

    let videoSession = await VideoSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          roomId,
          participants: session.participants,
          status: 'waiting',
          startedAt: now,
        }
      },
      { upsert: true, new: true }
    );

    if (videoSession.status === 'ended') {
      console.warn(`[Video Session] Join Failed: Room ${roomId} has already ended.`);
      return res.status(400).json({ message: 'This video session has already ended.' });
    }

    console.log(`[Video Session] Room accessed: ${roomId}, status: ${videoSession.status}`);

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
      console.log(`[Video Session] Room ${roomId} status changed to 'active'`);
    }

    // Send join notification to the other participant
    const otherUserEmail = session.participants.find(p => p !== userEmail);
    if (otherUserEmail) {
      emitNotification(otherUserEmail, {
        _id: new mongoose.Types.ObjectId().toString(),
        type: 'session_joined',
        title: 'Session Started',
        message: `${userEmail.split('@')[0]} has joined the session.`,
        link: `/session/${session._id}`,
        createdAt: now,
        isRead: false
      });
    }

    console.log(`[Video Session] Join Successful: roomId=${roomId}`);
    res.json({ videoSession, roomId });
  } catch (error) {
    console.error('[Video Session] Exception caught during join:', error);
    res.status(500).json({
      message: 'Failed to join video session.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
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
    
    // Count active participants based on attendance that haven't left
    const activeParticipantCount = await SessionAttendance.countDocuments({
      sessionId,
      joinedAt: { $ne: null },
      leftAt: null
    });

    res.json({ session, videoSession: videoSession || null, activeParticipantCount });
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
