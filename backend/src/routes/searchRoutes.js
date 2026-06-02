import express from 'express';
import { searchUsers, searchGigs, getSearchSuggestions } from '../controllers/searchController.js';

// Search routes — relies on client-provided identifiers for auth in this MVP
const router = express.Router();

/** GET /api/search/users - Search users by name, skills, or location */
router.get('/users', searchUsers);

/** GET /api/search/gigs - Search gigs by title, description, or tags */
router.get('/gigs', searchGigs);

/** GET /api/search/suggestions - Get autocomplete suggestions for search queries */
router.get('/suggestions', getSearchSuggestions);

export default router;
