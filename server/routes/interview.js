const express = require('express');
const router = express.Router();
const { generateInterviewQuestionsController, evaluateInterviewAnswerController, modelAnswerStore } = require('../controllers/interviewController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { batchEvaluateAnswers } = require('../services/openaiService');
const InterviewSession = require('../models/InterviewSession');

// POST /api/interview/generate  — resume-based interview questions (calls OpenAI)
router.post('/generate', firebaseAuth(), generateInterviewQuestionsController);

// POST /api/interview/evaluate  — evaluate one answer (calls OpenAI)
router.post('/evaluate', firebaseAuth(), evaluateInterviewAnswerController);

// POST /api/interview/evaluate-all  — rubric-based batch evaluation (1 GPT call)
router.post('/evaluate-all', firebaseAuth(), async (req, res) => {
    const { questions, answers, role, user_name, emotion_per_question } = req.body;
    if (!questions?.length) return res.status(400).json({ error: 'questions array is required' });
    try {
        // Retrieve server-side model_answer_points (hidden from frontend during interview)
        const uid = req.headers['x-user-uid'] || req.user?.uid || 'anonymous';
        const storeKey = `${uid}:${role || 'Software Engineer'}`;
        const storedQuestions = modelAnswerStore.get(storeKey);

        // Merge model_answer_points back into questions for the evaluator
        const questionsWithModelAnswers = questions.map((q, i) => ({
            ...q,
            model_answer_points: storedQuestions?.[i]?.model_answer_points || q.model_answer_points || []
        }));

        const result = await batchEvaluateAnswers(
            questionsWithModelAnswers,
            answers || [],
            role || 'Software Engineer',
            user_name || 'Candidate',
            emotion_per_question || null
        );

        // Clean up the store entry
        modelAnswerStore.delete(storeKey);

        // Attach token count for apiLogger middleware
        res.locals.tokensUsed = result.tokensUsed || 0;
        res.locals.openaiModel = 'gpt-4o-mini';
        res.json({ success: true, evaluations: result.evaluations || result });
    } catch (err) {
        console.error('Batch evaluate error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/interview/save-session  — persist a completed interview session
router.post('/save-session', firebaseAuth(true), async (req, res) => {
    try {
        const uid = req.user?.uid || 'anonymous';
        const { role, mode, questions, answers, evaluations, emotionTimeline, voiceMetrics, overallStage, dominantEmotions, mentorId } = req.body;

        const session = await InterviewSession.create({
            uid,
            role: role || 'Software Engineer',
            mode: mode || 'text',
            questions: questions || [],
            answers: answers || [],
            evaluations: evaluations || [],
            emotionTimeline: emotionTimeline || [],
            voiceMetrics: voiceMetrics || {},
            overallStage: overallStage || 'Developing',
            dominantEmotions: dominantEmotions || [],
            answeredCount: (answers || []).filter(a => a.text?.trim().length > 0).length,
            mentorId: mentorId || null,
            isSharedWithMentor: !!mentorId
        });

        res.json({ success: true, sessionId: session._id });
    } catch (err) {
        console.error('Save session error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interview/my-sessions  — get current user's session history
router.get('/my-sessions', firebaseAuth(), async (req, res) => {
    try {
        const sessions = await InterviewSession.find({ uid: req.user.uid })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('role mode overallStage answeredCount createdAt dominantEmotions voiceMetrics')
            .lean();
        res.json({ success: true, sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interview/session/:id  — get full session detail (owner only)
router.get('/session/:id', firebaseAuth(), async (req, res) => {
    try {
        const session = await InterviewSession.findById(req.params.id).lean();
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.uid !== req.user.uid) return res.status(403).json({ error: 'Access denied' });
        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
