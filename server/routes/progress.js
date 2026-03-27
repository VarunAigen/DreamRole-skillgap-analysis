const express = require('express');
const router = express.Router();
const { getProgressController, saveProgressController } = require('../controllers/progressController');

// GET /api/progress?user_id=...
router.get('/', getProgressController);

// POST /api/progress
router.post('/', saveProgressController);

module.exports = router;
