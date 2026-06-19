const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationsController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// GET /api/recommendations?role=...
// GET /api/recommendations?roles=true  (list of all roles)
// Allow guest access for browsing roles, but still identify authenticated users
router.get('/', firebaseAuth(true), getRecommendations);

module.exports = router;
