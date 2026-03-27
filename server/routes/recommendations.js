const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationsController');

// GET /api/recommendations?role=...
// GET /api/recommendations?roles=true  (list of all roles)
router.get('/', getRecommendations);

module.exports = router;
