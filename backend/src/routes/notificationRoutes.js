import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.put('/archive', archiveNotifications);

export default router;
