const express = require('express');
const router = express.Router();
const { analyzeSkillGap } = require('../controllers/analysisController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/analysis — requires authentication (calls OpenAI)
router.post('/', firebaseAuth(), analyzeSkillGap);

module.exports = router;
