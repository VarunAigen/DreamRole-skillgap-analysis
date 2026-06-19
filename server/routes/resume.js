const express = require('express');
const router = express.Router();
const { uploadResume } = require('../controllers/resumeController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// POST /api/resume/upload — requires authentication
router.post('/upload', firebaseAuth(), ...uploadResume);

module.exports = router;
