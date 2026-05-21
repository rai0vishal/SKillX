import express from 'express';
import { upload } from '../config/cloudinary.js';
import {
  getWorkspace,
  updateNotes,
  uploadResource,
  addLinkResource,
  getResources,
  deleteResource,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../controllers/workspaceController.js';

const router = express.Router();

// Workspace
router.get('/:chatRoomId', getWorkspace);

// Notes
router.put('/notes/:workspaceId', updateNotes);

// Resources
router.post('/resource/upload', upload.single('file'), uploadResource);
router.post('/resource/link', addLinkResource);
router.get('/resources/:workspaceId', getResources);
router.delete('/resource/:id', deleteResource);

// Tasks
router.post('/task/create', createTask);
router.get('/tasks/:workspaceId', getTasks);
router.put('/task/:id', updateTask);
router.delete('/task/:id', deleteTask);

export default router;
