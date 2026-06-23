const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, clearResume, downloadResume } = require('../controllers/userProfileController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// All profile routes require auth
router.use(firebaseAuth());

// GET  /api/profile        — load user's saved state on app start
router.get('/', getProfile);

// GET  /api/profile/resume/download — download user's own resume PDF
router.get('/resume/download', downloadResume);

// PATCH /api/profile       — save role, resume, skills (partial update)
router.patch('/', updateProfile);

// DELETE /api/profile/clear — wipe resume + skills only
router.delete('/clear', clearResume);

module.exports = router;
