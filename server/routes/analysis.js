const express = require('express');
const router = express.Router();
const { analyzeSkillGap } = require('../controllers/analysisController');

// POST /api/analysis
router.post('/', analyzeSkillGap);

module.exports = router;
