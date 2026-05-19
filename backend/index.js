import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import gigsRouter from './src/routes/gigs.js';
import skillExchangeRouter from './src/routes/SkillExchange.js';
import profileRouter from './src/routes/profile.js';
import dashboardRouter from './src/routes/dashboard.js';
import exchangeRequestsRouter from './src/routes/exchangeRequests.js';
import gigApplicationsRouter from './src/routes/gigApplications.js';
import chatRouter from './src/routes/chat.js';
import roadmapRouter from './src/routes/roadmapRoutes.js';
import sessionRouter from './src/routes/sessionRoutes.js';
import reviewRouter from './src/routes/reviewRoutes.js';
import analyticsRouter from './src/routes/analyticsRoutes.js';
import videoSessionRouter from './src/routes/videoSessionRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import Message from './src/models/Message.js';
dotenv.config();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
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

const onlineUsers = new Map(); // socket.id -> email

io.on('connection', (socket) => {
  console.log('✅ A user connected via Socket.io:', socket.id);

  // User logs in and maps their socket to their email
  socket.on('registerUser', (email) => {
    onlineUsers.set(socket.id, email);
    // Broadcast to everyone that this user is online
    io.emit('userStatusChange', { email, isOnline: true });
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { chatRoomId, senderEmail, text } = data;
      // Save message to database
      const newMessage = await Message.create({ chatRoomId, senderEmail, text });
      
      // Emit to everyone in the room
      io.to(chatRoomId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Typing indicators
  socket.on('typing', ({ chatRoomId, email }) => {
    socket.to(chatRoomId).emit('userTyping', { email });
  });

  socket.on('stopTyping', ({ chatRoomId, email }) => {
    socket.to(chatRoomId).emit('userStoppedTyping', { email });
  });

  // ─── WebRTC Signaling ────────────────────────────────────────────────────

  // User joins a video room
  socket.on('rtc:join-room', ({ roomId, userEmail }) => {
    socket.join(roomId);
    socket.data.rtcRoom = roomId;
    socket.data.rtcEmail = userEmail;
    // Notify everyone else in the room that a new peer arrived
    socket.to(roomId).emit('rtc:peer-joined', { userEmail, socketId: socket.id });
    console.log(`[RTC] ${userEmail} joined room ${roomId}`);
  });

  // Relay SDP offer to a specific peer
  socket.on('rtc:offer', ({ roomId, offer, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:offer', { offer, fromSocketId: socket.id });
  });

  // Relay SDP answer back to the offerer
  socket.on('rtc:answer', ({ answer, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:answer', { answer, fromSocketId: socket.id });
  });

  // Relay ICE candidates between peers
  socket.on('rtc:ice-candidate', ({ candidate, targetSocketId }) => {
    socket.to(targetSocketId).emit('rtc:ice-candidate', { candidate, fromSocketId: socket.id });
  });

  // User leaves the video room
  socket.on('rtc:leave-room', ({ roomId, userEmail }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('rtc:peer-left', { userEmail, socketId: socket.id });
    console.log(`[RTC] ${userEmail} left room ${roomId}`);
  });

  // In-session chat message (separate from main chat rooms)
  socket.on('rtc:chat-message', ({ roomId, senderEmail, text, timestamp }) => {
    io.to(roomId).emit('rtc:chat-message', { senderEmail, text, timestamp });
  });

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
    const email = onlineUsers.get(socket.id);
    if (email) {
      onlineUsers.delete(socket.id);
      // Check if user has other open tabs/sockets before marking offline
      const hasOtherSockets = Array.from(onlineUsers.values()).includes(email);
      if (!hasOtherSockets) {
        io.emit('userStatusChange', { email, isOnline: false });
      }
    }
    // Notify any RTC room this socket was in
    if (socket.data.rtcRoom) {
      socket.to(socket.data.rtcRoom).emit('rtc:peer-left', {
        userEmail: socket.data.rtcEmail,
        socketId: socket.id,
      });
    }
  });
});
// Middlewares
app.use(
  cors({
    origin: allowedOrigins, // support multiple local dev origins
    credentials: true,
  })
);
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('SkillX backend is running ✅');
});

// Routes
app.use('/api/gigs', gigsRouter);
app.use('/api/skill-exchange', skillExchangeRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter); 
app.use('/api/exchange-requests', exchangeRequestsRouter);
app.use('/api/gig-applications', gigApplicationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/roadmap', roadmapRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/video-session', videoSessionRouter);
// DB + server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillx';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
