const express = require('express');
const router = express.Router();
const { getMentorsController } = require('../controllers/mentorController');

// GET /api/mentors?role=...
router.get('/', getMentorsController);

module.exports = router;
