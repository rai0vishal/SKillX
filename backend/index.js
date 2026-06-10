import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

import gigsRouter from './src/routes/gigs.js';
import skillExchangeRouter from './src/routes/SkillExchange.js';
import profileRouter from './src/routes/profile.js';
import profileUploadRouter from './src/routes/profileUpload.js';
import dashboardRouter from './src/routes/dashboard.js';
import exchangeRequestsRouter from './src/routes/exchangeRequests.js';
import gigApplicationsRouter from './src/routes/gigApplications.js';
import chatRouter from './src/routes/chat.js';
import roadmapRouter from './src/routes/roadmapRoutes.js';
import sessionRouter from './src/routes/sessionRoutes.js';
import reviewRouter from './src/routes/reviewRoutes.js';
import analyticsRouter from './src/routes/analyticsRoutes.js';
import videoSessionRouter from './src/routes/videoSessionRoutes.js';
import adminRouter from './src/routes/adminRoutes.js';
import notificationRouter from './src/routes/notificationRoutes.js';
import workspaceRouter from './src/routes/workspaceRoutes.js';
import searchRouter from './src/routes/searchRoutes.js';
import scheduleRouter from './src/routes/scheduleRoutes.js';
import aiRouter from './src/routes/ai.js';
import http from 'http';
import { Server } from 'socket.io';
import Message from './src/models/Message.js';
import { authenticate } from './src/middleware/authenticate.js';
import { firebaseAuth } from './src/config/firebaseAdmin.js';
import multer from 'multer';

const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
  // Also push without trailing slash if present
  const urlNoSlash = process.env.CLIENT_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(urlNoSlash)) {
    allowedOrigins.push(urlNoSlash);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

import { initNotificationSocket } from './src/socket/notificationSocket.js';

// ─── Socket.io ───────────────────────────────────────────────────────────────

const onlineUsers = new Map();
initNotificationSocket(io, onlineUsers);

// ─── Socket.io Authentication ─────────────────────────────────────────────────
// Verify Firebase ID token during handshake — reject unauthenticated connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required. Provide a Firebase ID token.'));
    }
    const decoded = await firebaseAuth.verifyIdToken(token);
    socket.user = decoded; // Attach verified identity
    next();
  } catch (error) {
    console.error('Socket auth failed:', error.code || error.message);
    next(new Error('Authentication failed. Invalid or expired token.'));
  }
});

io.on('connection', (socket) => {
  const verifiedEmail = socket.user.email;
  console.log('✅ Authenticated user connected via Socket.io:', verifiedEmail, socket.id);

  // Auto-register user using the verified email from the token (no more trusting client input)
  onlineUsers.set(socket.id, verifiedEmail);
  io.emit('userStatusChange', { email: verifiedEmail, isOnline: true });

  // Triggered when user enters a specific text chat channel
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Triggered when user navigates away from a chat channel
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  // Triggered when a new text message is submitted to a room
  socket.on('sendMessage', async (data) => {
    try {
      const { chatRoomId, senderEmail, text } = data;
      const newMessage = await Message.create({ chatRoomId, senderEmail, text });
      io.to(chatRoomId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Triggered on keypress in the chat input
  socket.on('typing', ({ chatRoomId, email }) => {
    socket.to(chatRoomId).emit('userTyping', { email });
  });

  // Triggered when chat input is blurred or after a timeout
  socket.on('stopTyping', ({ chatRoomId, email }) => {
    socket.to(chatRoomId).emit('userStoppedTyping', { email });
  });

  // Triggered when user enters a WebRTC video session page
  socket.on('rtc:join-room', ({ roomId, userEmail }) => {
    socket.join(roomId);
    socket.data.rtcRoom = roomId;
    socket.data.rtcEmail = userEmail;
    socket.to(roomId).emit('rtc:peer-joined', { userEmail, socketId: socket.id });
    console.log(`[RTC] ${userEmail} joined room ${roomId}`);
  });

  // Triggered during WebRTC signaling to propose a connection
  socket.on('rtc:offer', ({ roomId, offer, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:offer', { offer, fromSocketId: socket.id });
  });

  // Triggered during WebRTC signaling to accept a connection proposal
  socket.on('rtc:answer', ({ answer, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:answer', { answer, fromSocketId: socket.id });
  });

  // Triggered by local RTCPeerConnection to share network routing info
  socket.on('rtc:ice-candidate', ({ candidate, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:ice-candidate', { candidate, fromSocketId: socket.id });
  });

  // Triggered when user disconnects from the video call
  socket.on('rtc:leave-room', ({ roomId, userEmail }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('rtc:peer-left', { userEmail, socketId: socket.id });
    console.log(`[RTC] ${userEmail} left room ${roomId}`);
  });

  // Triggered for ephemeral chat messages inside a video session
  socket.on('rtc:chat-message', ({ roomId, senderEmail, text, timestamp }) => {
    io.to(roomId).emit('rtc:chat-message', { senderEmail, text, timestamp });
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
    const email = onlineUsers.get(socket.id);
    if (email) {
      onlineUsers.delete(socket.id);
      
      const hasOtherSockets = Array.from(onlineUsers.values()).includes(email);
      if (!hasOtherSockets) {
        io.emit('userStatusChange', { email, isOnline: false });
      }
    }
    if (socket.data.rtcRoom) {
      socket.to(socket.data.rtcRoom).emit('rtc:peer-left', {
        userEmail: socket.data.rtcEmail,
        socketId: socket.id,
      });
    }
  });
});
// ─── Middleware ────────────────────────────────────────────────────────────────
// helmet must be first — sets security headers on every response
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

// ─── Global Authentication ────────────────────────────────────────────────────
// Apply Firebase token verification to all /api/* routes.
// Exempt: POST /api/profile (first-time profile creation during signup)
app.use('/api', (req, res, next) => {
  // Allow unauthenticated access to public read routes if explicitly requested
  // Note: /api/gigs implicitly allows public read in its own router
  if (req.method === 'POST' && req.path === '/profile') {
    return next();
  }
  return authenticate(req, res, next);
});

// ─── Routes ────────────────────────────────────────────────────────────────────
// Core Gig listings and AI enhancements
app.use('/api/gigs', gigsRouter);
// Primary algorithm for skill matching and profiles
app.use('/api/skill-exchange', skillExchangeRouter);
// User profile CRUD
app.use('/api/profile', profileRouter);
app.use('/api/profile', profileUploadRouter);
// Personal metrics and aggregate stats
app.use('/api/dashboard', dashboardRouter); 
// Proposals between users for a skill swap
app.use('/api/exchange-requests', exchangeRequestsRouter);
// Bids on posted gigs
app.use('/api/gig-applications', gigApplicationsRouter);
// Real-time direct messaging between users
app.use('/api/chat', chatRouter);
// AI-generated learning roadmaps
app.use('/api/roadmap', roadmapRouter);
// Tracking and management for booked sessions
app.use('/api/sessions', sessionRouter);
// Ratings and text reviews for completed sessions
app.use('/api/reviews', reviewRouter);
// Platform-wide usage analytics (admin)
app.use('/api/analytics', analyticsRouter);
// Video call signaling and room management
app.use('/api/video-session', videoSessionRouter);
// Admin management and moderation tools
app.use('/api/admin', adminRouter);
// User alerts and real-time push events
app.use('/api/notifications', notificationRouter);
// Collaborative workspace tools (tasks, resources)
app.use('/api/workspace', workspaceRouter);
// Global search across users and gigs
app.use('/api/search', searchRouter);
// Calendar and availability management
app.use('/api/schedule', scheduleRouter);
// AI proxy — Gemini calls are made server-side using GEMINI_API_KEY (never exposed to client)
app.use('/api/ai', aiRouter);

// ─── 404 Catch-All ───────────────────────────────────────────────────────────
// Must be placed AFTER all valid routes and BEFORE the error middleware.
// Catches any request that did not match a registered route.
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── Global Error Handling ────────────────────────────────────────────────────
// 4-argument signature is required for Express to treat this as an error handler.
// Handles both operational errors (AppError) and unexpected programmer errors.
app.use((err, req, res, next) => {
  // ── Multer-specific errors (thrown before the controller body runs) ──────────
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'fail',
        message: 'File too large. Maximum allowed size is 10MB.',
      });
    }
    return res.status(400).json({
      status: 'fail',
      message: `Upload error: ${err.message}`,
    });
  }

  // ── fileFilter rejection (plain Error with our sentinel message prefix) ──────
  if (err.message && err.message.startsWith('File type not allowed')) {
    return res.status(415).json({
      status: 'fail',
      message: err.message,
    });
  }

  // ── Generic operational / unexpected errors ──────────────────────────────────
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack
    });
  }

  // Production — only send operational errors to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Non-operational (unexpected) errors — hide details from client
  console.error('UNEXPECTED ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.'
  });
});
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillx';

if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI) {
  console.error('❌ FATAL ERROR: MONGO_URI is not defined in production.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// ─── Process Crash Handlers ──────────────────────────────────────────────────
// unhandledRejection: async code threw but no .catch() was present.
// Gracefully closes the HTTP server before exiting so in-flight requests finish.
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
  server.close(() => process.exit(1));
});

// uncaughtException: synchronous throw that bubbled all the way up.
// Must exit immediately — the process is in an undefined state.
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
  process.exit(1);
});
