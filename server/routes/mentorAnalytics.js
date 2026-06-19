const express = require('express');
const router = express.Router();
const { firebaseAuth, requireMentor } = require('../middleware/firebaseAuth');
const MentorLink = require('../models/MentorLink');
const InterviewSession = require('../models/InterviewSession');
const Mentor = require('../models/Mentor');
const UserProfile = require('../models/UserProfile');
const { admin } = require('../middleware/firebaseAuth');

router.use(firebaseAuth());

// ── GET /api/mentor/my-students ───────────────────────────────────────────────
// Returns all students linked to the authenticated mentor
router.get('/my-students', requireMentor, async (req, res) => {
    try {
        const link = await MentorLink.findOne({ mentorUid: req.user.uid }).lean();
        if (!link) return res.json({ success: true, students: [] });

        const activeStudents = link.students.filter(s => s.isActive);

        // Get last session + overall stage per student
        const sessionData = await InterviewSession.aggregate([
            { $match: { uid: { $in: activeStudents.map(s => s.uid) } } },
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$uid',
                sessions: { $sum: 1 },
                lastSession: { $first: '$createdAt' },
                lastStage: { $first: '$overallStage' },
                lastRole: { $first: '$role' }
            }}
        ]);
        const sessionMap = {};
        sessionData.forEach(s => { sessionMap[s._id] = s; });

        const students = activeStudents.map(s => ({
            ...s,
            sessionCount: sessionMap[s.uid]?.sessions || 0,
            lastSessionDate: sessionMap[s.uid]?.lastSession || null,
            lastStage: sessionMap[s.uid]?.lastStage || null,
            lastRole: sessionMap[s.uid]?.lastRole || null
        }));

        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/mentor/link-student ─────────────────────────────────────────────
// Link a student to this mentor by email
router.post('/link-student', requireMentor, async (req, res) => {
    try {
        const { studentEmail } = req.body;
        if (!studentEmail) return res.status(400).json({ error: 'studentEmail is required' });

        // Look up student in Firebase Auth by email
        let studentUser;
        try {
            studentUser = await admin.auth().getUserByEmail(studentEmail);
        } catch (e) {
            return res.status(404).json({ error: `No user found with email: ${studentEmail}` });
        }

        // Upsert MentorLink document
        const link = await MentorLink.findOneAndUpdate(
            { mentorUid: req.user.uid },
            {
                $setOnInsert: {
                    mentorEmail: req.user.email,
                    mentorName: req.user.name
                },
                $addToSet: {
                    students: {
                        uid: studentUser.uid,
                        email: studentUser.email,
                        name: studentUser.displayName || studentUser.email,
                        linkedAt: new Date(),
                        isActive: true
                    }
                }
            },
            { upsert: true, new: true }
        );

        // Update all student's existing sessions with mentorId
        await InterviewSession.updateMany(
            { uid: studentUser.uid, mentorId: null },
            { $set: { mentorId: req.user.uid, isSharedWithMentor: true } }
        );

        res.json({ success: true, message: `Student ${studentEmail} linked successfully`, link });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/mentor/unlink-student/:studentUid ─────────────────────────────
router.delete('/unlink-student/:studentUid', requireMentor, async (req, res) => {
    try {
        await MentorLink.updateOne(
            { mentorUid: req.user.uid, 'students.uid': req.params.studentUid },
            { $set: { 'students.$.isActive': false } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/mentor/student/:uid/sessions ─────────────────────────────────────
// Get all interview sessions for a student (mentor-visible)
router.get('/student/:uid/sessions', requireMentor, async (req, res) => {
    try {
        // Verify this mentor is actually linked to this student
        const link = await MentorLink.findOne({
            mentorUid: req.user.uid,
            'students.uid': req.params.uid,
            'students.isActive': true
        });
        if (!link) return res.status(403).json({ error: 'This student is not linked to your account' });

        const sessions = await InterviewSession.find({ uid: req.params.uid })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/mentor/session/:id/note ─────────────────────────────────────────
// Add or update mentor note on a specific session
router.post('/session/:id/note', requireMentor, async (req, res) => {
    try {
        const { note } = req.body;
        const session = await InterviewSession.findByIdAndUpdate(
            req.params.id,
            { $set: { mentorNote: note } },
            { new: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/mentor/profile ──────────────────────────────────────────────────
// Fetch the authenticated mentor's own profile info
router.get('/profile', requireMentor, async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ uid: req.user.uid }).lean();
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor profile not found' });
        }
        res.json({ success: true, profile: mentor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/mentor/profile ────────────────────────────────────────────────
// Update the authenticated mentor's designation, company, skills, and bio
router.patch('/profile', requireMentor, async (req, res) => {
    try {
        const { designation, company, skills, profileInfo } = req.body;
        const updates = {};
        if (designation !== undefined) updates.designation = designation;
        if (company !== undefined) updates.company = company;
        if (skills !== undefined) {
            updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        }
        if (profileInfo !== undefined) updates.profileInfo = profileInfo;

        const mentor = await Mentor.findOneAndUpdate(
            { uid: req.user.uid },
            { $set: updates },
            { new: true, upsert: true }
        );
        res.json({ success: true, profile: mentor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/mentor/mentee/:uid ──────────────────────────────────────────────
// Get detailed student profile (resume, college details, projects, certs, internships)
router.get('/mentee/:uid', requireMentor, async (req, res) => {
    try {
        // Verify this mentor is linked to this student
        const link = await MentorLink.findOne({
            mentorUid: req.user.uid,
            'students.uid': req.params.uid,
            'students.isActive': true
        });
        if (!link) {
            return res.status(403).json({ error: 'Access denied. Student is not linked to your account.' });
        }

        const profile = await UserProfile.findOne({ uid: req.params.uid }).lean();
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/mentor/mentee/:uid/resume ───────────────────────────────────────
// Download student's resume as plain text attachment
router.get('/mentee/:uid/resume', requireMentor, async (req, res) => {
    try {
        const link = await MentorLink.findOne({
            mentorUid: req.user.uid,
            'students.uid': req.params.uid,
            'students.isActive': true
        });
        if (!link) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const profile = await UserProfile.findOne({ uid: req.params.uid }).lean();
        if (!profile || !profile.resume_text) {
            return res.status(404).json({ error: 'No resume text available for download.' });
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=resume_${req.params.uid}.txt`);
        res.send(profile.resume_text);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
