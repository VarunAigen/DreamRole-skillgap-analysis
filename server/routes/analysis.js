const express = require('express');
const router = express.Router();
const { analyzeSkillGap } = require('../controllers/analysisController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { validate, analyzeSchema } = require('../middleware/validation');

// POST /api/analysis — requires authentication + input validation (calls OpenAI)
router.post('/', firebaseAuth(), validate(analyzeSchema), analyzeSkillGap);

module.exports = router;
