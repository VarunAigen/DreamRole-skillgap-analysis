const express = require('express');
const router = express.Router();
const { extractSkillsController } = require('../controllers/skillsController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/skills/extract — requires authentication (calls OpenAI)
router.post('/extract', firebaseAuth(), extractSkillsController);

module.exports = router;
