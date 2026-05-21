import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './src/models/Session.js';
import VideoSession from './src/models/VideoSession.js';
import SessionAttendance from './src/models/SessionAttendance.js';

dotenv.config();

async function testJoin() {
  try {
    console.log('Connecting to DB...', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const sessionId = '6a0c5b21705f21c0f47e51cd';
    const userEmail = 'test@example.com'; // We might get unauthorized if this user isn't in the session

    // 1. Fetch session
    console.log('Finding session...');
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('Session not found!');
      process.exit(1);
    }
    console.log('Found session:', session);

    // 2. Auth
    if (!session.participants.includes(userEmail)) {
       console.log('Unauthorized (expected if test email is not in participants)');
       // Let's pretend we are authorized by using the first participant
       userEmail = session.participants[0];
    }
    const actualUser = session.participants[0];

    // 3. Room creation
    const roomId = `session_${sessionId}`;
    const now = new Date();
    
    console.log('Finding video session...');
    let videoSession = await VideoSession.findOne({ sessionId });
    
    if (!videoSession) {
      console.log('Creating video session...');
      videoSession = await VideoSession.create({
        sessionId,
        roomId,
        participants: session.participants,
        status: 'waiting',
        startedAt: now,
      });
      console.log('Created:', videoSession);
    } else {
      console.log('Found existing video session:', videoSession);
    }

    // 4. Attendance
    console.log('Updating attendance...');
    await SessionAttendance.findOneAndUpdate(
      { sessionId, userEmail: actualUser },
      { joinedAt: now, leftAt: null, durationMinutes: 0 },
      { upsert: true, new: true }
    );
    console.log('Attendance updated.');
    
    console.log('SUCCESS');
    process.exit(0);
  } catch (error) {
    console.error('ERROR THROWN:', error);
    process.exit(1);
  }
}

testJoin();
