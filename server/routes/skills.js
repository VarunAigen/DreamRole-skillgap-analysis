const express = require('express');
const router = express.Router();
const { extractSkillsController } = require('../controllers/skillsController');

// POST /api/skills/extract
router.post('/extract', extractSkillsController);

module.exports = router;
