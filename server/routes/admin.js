const express = require('express');
const router = express.Router();
const { firebaseAuth, requireAdmin, admin } = require('../middleware/firebaseAuth');
const ApiLog = require('../models/ApiLog');
const InterviewSession = require('../models/InterviewSession');
const Mentor = require('../models/Mentor');
const { getCacheStats, flushCache } = require('../services/openaiService');

// All admin routes require Firebase auth + admin role
router.use(firebaseAuth());
router.use(requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Overview numbers: users, sessions, API calls today, estimated cost today
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalSessions, todayLogs, allTimeLogs, stageAgg] = await Promise.all([
            InterviewSession.countDocuments(),
            ApiLog.countDocuments({ createdAt: { $gte: today } }),
            ApiLog.find({}, 'tokensUsed estimatedCostUSD openaiModel').lean(),
            InterviewSession.aggregate([
                { $group: { _id: '$overallStage', count: { $sum: 1 } } }
            ])
        ]);

        const totalTokens = allTimeLogs.reduce((s, l) => s + (l.tokensUsed || 0), 0);
        const totalCost   = allTimeLogs.reduce((s, l) => s + (l.estimatedCostUSD || 0), 0);
        const todayCost   = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: today } } },
            { $group: { _id: null, cost: { $sum: '$estimatedCostUSD' }, tokens: { $sum: '$tokensUsed' } } }
        ]);

        const stageDistribution = {};
        stageAgg.forEach(s => { stageDistribution[s._id || 'Unknown'] = s.count; });

        res.json({
            success: true,
            totalSessions,
            apiCallsToday: todayLogs,
            totalTokensAllTime: totalTokens,
            totalCostAllTime: parseFloat(totalCost.toFixed(4)),
            todayCostUSD: todayCost[0]?.cost ? parseFloat(todayCost[0].cost.toFixed(4)) : 0,
            todayTokens: todayCost[0]?.tokens || 0,
            stageDistribution,
            cacheStats: getCacheStats()
        });
    } catch (err) {
        console.error('Admin stats error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// List Firebase users (up to 1000), merge with MongoDB session counts
router.get('/users', async (req, res) => {
    try {
        // Fetch up to 1000 users from Firebase Auth
        const listResult = await admin.auth().listUsers(1000);
        const firebaseUsers = listResult.users.map(u => ({
            uid: u.uid,
            email: u.email || '',
            name: u.displayName || '',
            photoURL: u.photoURL || null,
            role: u.customClaims?.role || 'student',
            createdAt: u.metadata.creationTime,
            lastSignIn: u.metadata.lastSignInTime,
            disabled: u.disabled
        }));

        // Get session counts per user from MongoDB
        const sessionCounts = await InterviewSession.aggregate([
            { $group: { _id: '$uid', sessions: { $sum: 1 }, lastSession: { $max: '$createdAt' } } }
        ]);
        const sessionMap = {};
        sessionCounts.forEach(s => { sessionMap[s._id] = { sessions: s.sessions, lastSession: s.lastSession }; });

        // Merge
        const users = firebaseUsers.map(u => ({
            ...u,
            sessions: sessionMap[u.uid]?.sessions || 0,
            lastSession: sessionMap[u.uid]?.lastSession || null
        }));

        res.json({ success: true, count: users.length, users });
    } catch (err) {
        console.error('Admin users error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/api-usage ─────────────────────────────────────────────────
// Per-endpoint breakdown: call count, total tokens, estimated cost
router.get('/api-usage', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const usage = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: {
                _id: '$endpoint',
                calls: { $sum: 1 },
                tokens: { $sum: '$tokensUsed' },
                cost: { $sum: '$estimatedCostUSD' },
                errors: { $sum: { $cond: ['$isError', 1, 0] } },
                avgLatencyMs: { $avg: '$latencyMs' }
            }},
            { $sort: { calls: -1 } }
        ]);

        // Daily trend for chart
        const dailyTrend = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                calls: { $sum: 1 },
                cost: { $sum: '$estimatedCostUSD' }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, usage, dailyTrend, days: parseInt(days) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/logs ───────────────────────────────────────────────────────
// Recent API logs (last 100)
router.get('/logs', async (req, res) => {
    try {
        const logs = await ApiLog.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/cache/flush ───────────────────────────────────────────────
// Clear the OpenAI response cache
router.post('/cache/flush', (req, res) => {
    flushCache();
    res.json({ success: true, message: 'Cache flushed successfully' });
});

// ── PATCH /api/admin/user/:uid/role ──────────────────────────────────────────
// Set custom role claim on a Firebase user
router.patch('/user/:uid/role', async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;
        if (!['student', 'mentor', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be student, mentor, or admin.' });
        }
        await admin.auth().setCustomUserClaims(uid, { role });
        res.json({ success: true, message: `User ${uid} role set to ${role}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/mentors ───────────────────────────────────────────────────
// Retrieve all real mentors added by the admin
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await Mentor.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: mentors.length, mentors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/mentor ───────────────────────────────────────────────────
// Create a new real mentor user (Firebase auth + MongoDB record)
router.post('/mentor', async (req, res) => {
    try {
        const { name, email, password, designation, company, skills, profileInfo } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // 1. Create User in Firebase Auth
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().createUser({
                email,
                password,
                displayName: name,
                emailVerified: true
            });
        } catch (authErr) {
            return res.status(400).json({ error: `Firebase user creation failed: ${authErr.message}` });
        }

        // 2. Set Custom Claim role = 'mentor'
        await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'mentor' });

        // 3. Save to MongoDB Mentor Collection
        const mentorId = 'MTR-' + Math.floor(100000 + Math.random() * 900000);
        const newMentor = new Mentor({
            uid: firebaseUser.uid,
            mentorId,
            name,
            email,
            designation: designation || '',
            company: company || '',
            skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
            profileInfo: profileInfo || ''
        });

        await newMentor.save();

        // 4. Save to MongoDB Firestore users collection for profile listing consistency
        try {
            const db = admin.firestore();
            await db.collection('users').doc(firebaseUser.uid).set({
                name,
                email,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                photo_url: '',
                role: 'mentor'
            }, { merge: true });
        } catch (dbErr) {
            console.warn('Firestore doc save failed for new mentor:', dbErr.message);
        }

        res.json({ success: true, message: `Mentor ${name} added successfully!`, mentor: newMentor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/mentor/:uid ─────────────────────────────────────────────
// Delete a real mentor from Firebase Auth & MongoDB
router.delete('/mentor/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        // 1. Delete from Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
        } catch (authErr) {
            console.warn(`Firebase Auth user deletion warning (user might already be deleted): ${authErr.message}`);
        }

        // 2. Delete from MongoDB Mentor collection
        await Mentor.deleteOne({ uid });

        // 3. Delete Firestore profile doc
        try {
            const db = admin.firestore();
            await db.collection('users').doc(uid).delete();
        } catch (dbErr) {
            console.warn('Firestore doc deletion failed for mentor:', dbErr.message);
        }

        res.json({ success: true, message: 'Mentor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
