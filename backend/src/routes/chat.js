import express from 'express';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';

const router = express.Router();

/**
 * POST /api/chat/create
 * Create or get a direct chat room between two users
 */
router.post('/create', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ message: 'Two participants are required' });
    }

    // Check if a direct room already exists with exact participants
    let room = await ChatRoom.findOne({
      participants: { $all: participants, $size: 2 },
      referenceType: 'direct'
    });

    // If not, create a new one
    if (!room) {
      room = await ChatRoom.create({
        participants,
        referenceType: 'direct'
      });
    }

    res.json(room);
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

/**
 * GET /api/chat/:email
 * Get all chat rooms for a specific user
 */
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const rooms = await ChatRoom.find({ participants: email }).sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Failed to fetch chat rooms' });
  }
});

/**
 * GET /api/chat/messages/:roomId
 * Get all messages for a specific chat room
 */
router.get('/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoomId: roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

export default router;
