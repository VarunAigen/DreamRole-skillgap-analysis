const express = require('express');
const router = express.Router();
const { getProgressController, saveProgressController } = require('../controllers/progressController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// GET /api/progress?user_id=...
router.get('/', firebaseAuth(), getProgressController);

// POST /api/progress
router.post('/', firebaseAuth(), saveProgressController);

module.exports = router;
