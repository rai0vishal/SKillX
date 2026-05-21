import express from 'express';
import {
  getUserAvailability,
  updateUserAvailability,
  checkSessionConflict,
  getSuggestions,
  scheduleSession
} from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/availability/:email', getUserAvailability);
router.post('/availability/save', updateUserAvailability);
router.post('/session/check-conflict', checkSessionConflict);
router.post('/session/suggestions', getSuggestions);
router.post('/session/schedule', scheduleSession);

export default router;
