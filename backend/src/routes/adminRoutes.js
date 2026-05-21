import express from 'express';
import { checkRole } from '../middleware/checkRole.js';
import { getAllUsers, suspendUser, activateUser, getPlatformStats } from '../controllers/adminController.js';

const router = express.Router();

// All routes in this file are protected by the checkRole(['admin']) middleware
router.use(checkRole(['admin']));

router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.get('/stats', getPlatformStats);

export default router;
