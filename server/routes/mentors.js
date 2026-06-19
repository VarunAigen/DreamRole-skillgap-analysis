const express = require('express');
const router = express.Router();
const { getMentorsController } = require('../controllers/mentorController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const Mentor = require('../models/Mentor');
const MentorLink = require('../models/MentorLink');

// GET /api/mentors?role=...
// Allow guest access for browsing simulated AI chatbot mentors
router.get('/', firebaseAuth(true), getMentorsController);

// GET /api/mentors/real
// Fetch real industry mentors added by the admin
router.get('/real', firebaseAuth(true), async (req, res) => {
    try {
        const mentors = await Mentor.find().sort({ name: 1 }).lean();
        res.json({ success: true, count: mentors.length, mentors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/mentors/connect
// Establish a relationship between the logged-in student and a real mentor
router.post('/connect', firebaseAuth(), async (req, res) => {
    try {
        const { mentorUid } = req.body;
        if (!mentorUid) {
            return res.status(400).json({ error: 'mentorUid is required' });
        }

        const mentor = await Mentor.findOne({ uid: mentorUid });
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found in database' });
        }

        const studentUid = req.user.uid;
        const studentEmail = req.user.email;
        const studentName = req.user.name || req.user.email;

        // Upsert connection in MentorLink
        const link = await MentorLink.findOneAndUpdate(
            { mentorUid: mentor.uid },
            {
                $setOnInsert: {
                    mentorEmail: mentor.email,
                    mentorName: mentor.name
                },
                $addToSet: {
                    students: {
                        uid: studentUid,
                        email: studentEmail,
                        name: studentName,
                        linkedAt: new Date(),
                        isActive: true
                    }
                }
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: `Successfully connected with ${mentor.name}!`, link });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
