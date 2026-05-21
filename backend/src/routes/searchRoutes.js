import express from 'express';
import { searchUsers, searchGigs, getSearchSuggestions } from '../controllers/searchController.js';

const router = express.Router();

router.get('/users', searchUsers);
router.get('/gigs', searchGigs);
router.get('/suggestions', getSearchSuggestions);

export default router;
