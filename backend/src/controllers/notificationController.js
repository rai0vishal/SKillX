import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res) => {
  try {
    // Assuming email is passed in headers for simple auth (like the rest of the app)
    const email = req.headers['user-email'];
    if (!email) return res.status(401).json({ message: 'Unauthorized' });

    const notifications = await notificationService.getUserNotifications(email);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(401).json({ message: 'Unauthorized' });

    const count = await notificationService.getUnreadCount(email);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch count', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(401).json({ message: 'Unauthorized' });

    await notificationService.markAllAsRead(email);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
};

export const archiveNotifications = async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(401).json({ message: 'Unauthorized' });

    await notificationService.archiveAll(email);
    res.status(200).json({ message: 'Notifications archived' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive notifications', error: error.message });
  }
};
