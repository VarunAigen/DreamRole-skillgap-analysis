const express = require('express');
const router = express.Router();
const { firebaseAuth } = require('../middleware/firebaseAuth');

// GET /api/auth/me — returns the authenticated user's profile (uid, email, role)
router.get('/me', firebaseAuth(), async (req, res) => {
    try {
        res.json({
            success: true,
            uid: req.user.uid,
            email: req.user.email,
            name: req.user.name || '',
            role: req.user.role || 'student'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
