const express = require('express');
const router = express.Router();
const { firebaseAuth, admin } = require('../middleware/firebaseAuth');
const Message = require('../models/Message');
const Mentor = require('../models/Mentor');
const UserProfile = require('../models/UserProfile');

// All chat routes require authentication
router.use(firebaseAuth());

// ── GET /api/chat/messages ───────────────────────────────────────────────────
// Get chat history between current user and recipient
router.get('/messages', async (req, res) => {
    try {
        const { recipientId } = req.query;
        if (!recipientId) {
            return res.status(400).json({ error: 'recipientId is required' });
        }

        const myUid = req.user.uid;

        const messages = await Message.find({
            $or: [
                { senderId: myUid, receiverId: recipientId },
                { senderId: recipientId, receiverId: myUid }
            ]
        }).sort({ createdAt: 1 }).lean();

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/chat/message ───────────────────────────────────────────────────
// Send a new message
router.post('/message', async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        if (!receiverId || !text || !text.trim()) {
            return res.status(400).json({ error: 'receiverId and non-empty text are required' });
        }

        const newMessage = new Message({
            senderId: req.user.uid,
            receiverId,
            text: text.trim()
        });

        await newMessage.save();

        res.json({ success: true, message: newMessage });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/chat/conversations ──────────────────────────────────────────────
// Get list of active conversations with last message metadata
router.get('/conversations', async (req, res) => {
    try {
        const myUid = req.user.uid;

        // Find all messages involving current user, sorted newest first
        const messages = await Message.find({
            $or: [{ senderId: myUid }, { receiverId: myUid }]
        }).sort({ createdAt: -1 }).lean();

        const chatPartners = new Set();
        const lastMessagesMap = {};

        messages.forEach(m => {
            const partner = m.senderId === myUid ? m.receiverId : m.senderId;
            if (!chatPartners.has(partner)) {
                chatPartners.add(partner);
                lastMessagesMap[partner] = m;
            }
        });

        const partnersArray = Array.from(chatPartners);
        const resolvedPartners = [];
        const db = admin.firestore();

        for (const partnerUid of partnersArray) {
            let name = '';
            let email = '';
            let role = 'student';

            // 1. Check if the partner is a Mentor
            const mentorDoc = await Mentor.findOne({ uid: partnerUid }).lean();
            if (mentorDoc) {
                name = mentorDoc.name;
                email = mentorDoc.email;
                role = 'mentor';
            } else {
                // 2. Resolve via Firestore
                try {
                    const docSnap = await db.collection('users').doc(partnerUid).get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        name = data.name || data.email || '';
                        email = data.email || '';
                        role = data.role || 'student';
                    }
                } catch (e) {
                    console.warn(`Firestore user lookup failed during conversation load for ${partnerUid}:`, e.message);
                }
            }

            resolvedPartners.push({
                uid: partnerUid,
                name: name || email || 'User',
                email,
                role,
                lastMessage: lastMessagesMap[partnerUid]?.text || '',
                lastMessageAt: lastMessagesMap[partnerUid]?.createdAt || null
            });
        }

        res.json({ success: true, conversations: resolvedPartners });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
