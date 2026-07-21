const { generateInterviewQuestions, evaluateInterviewAnswer, transcribeAudio, generateTTS } = require('../services/openaiService');
const { getRequiredSkillsCategorized } = require('../services/dataService');

// In-memory store for model answer points (keyed by session) - not exposed to frontend
const modelAnswerStore = new Map();

/**
 * POST /api/interview/generate
 * Generate open-ended interview questions from resume text.
 * Now injects role-specific skills from dataset for grounded questions.
 */
async function generateInterviewQuestionsController(req, res) {
    try {
        const { resume_text, role, count = 7, user_name } = req.body;

        if (!resume_text) {
            return res.status(400).json({ error: 'resume_text is required' });
        }
        if (!role) {
            return res.status(400).json({ error: 'role is required' });
        }

        // Fetch role's categorized skills from dataset for grounded questions
        let categorizedSkills = null;
        try {
            categorizedSkills = await getRequiredSkillsCategorized(role);
        } catch (e) {
            console.warn('[Interview] Could not fetch categorized skills:', e.message);
        }

        const questions = await generateInterviewQuestions(
            resume_text, role, Math.min(count, 10), user_name, categorizedSkills
        );

        if (!questions || questions.length === 0) {
            return res.status(422).json({ error: 'Could not generate interview questions. Please try again.' });
        }

        // Store model_answer_points server-side (keyed by uid or session hash)
        // IDOR fix: use verified Firebase token uid only
        const uid = req.user?.uid || 'anonymous';
        const storeKey = `${uid}:${role}`;
        const questionsWithModelAnswers = questions.map(q => ({
            ...q,
            model_answer_points: q.model_answer_points || []
        }));
        modelAnswerStore.set(storeKey, questionsWithModelAnswers);

        // Strip model_answer_points from the frontend response (prevent cheating)
        const questionsForClient = questions.map(({ model_answer_points, ...rest }) => rest);

        res.json({
            success: true,
            role,
            question_count: questionsForClient.length,
            questions: questionsForClient
        });
    } catch (err) {
        console.error('Interview generate error:', err.message);
        res.status(500).json({ error: 'Failed to generate interview questions', details: err.message });
    }
}

/**
 * POST /api/interview/evaluate
 * Evaluate a single interview answer using AI.
 */
async function evaluateInterviewAnswerController(req, res) {
    try {
        const { question, answer, role, category, user_name } = req.body;

        if (!question || !role) {
            return res.status(400).json({ error: 'question and role are required' });
        }

        const evaluation = await evaluateInterviewAnswer(
            question,
            answer || '',
            role,
            category || 'General',
            user_name
        );

        res.json({
            success: true,
            evaluation
        });
    } catch (err) {
        console.error('Interview evaluate error:', err.message);
        res.status(500).json({ error: 'Evaluation failed', details: err.message });
    }
}

/**
 * POST /api/interview/transcribe
 * Transcribe uploaded audio file using OpenAI Whisper.
 */
async function transcribeAudioController(req, res) {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'Audio file is required' });
        }

        const text = await transcribeAudio(req.file.buffer, req.file.originalname || 'speech.webm');
        res.json({ success: true, text });
    } catch (err) {
        console.error('Whisper transcription error:', err.message);
        res.status(500).json({ error: 'Transcription failed', details: err.message });
    }
}

/**
 * POST /api/interview/tts
 * Convert question/text into natural MP3 audio using OpenAI Speech API.
 */
async function generateTTSController(req, res) {
    try {
        const { text, voice = 'nova' } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required for TTS' });
        }

        const audioBuffer = await generateTTS(text, voice);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (err) {
        console.error('TTS generation error:', err.message);
        res.status(500).json({ error: 'TTS generation failed', details: err.message });
    }
}

module.exports = {
    generateInterviewQuestionsController,
    evaluateInterviewAnswerController,
    transcribeAudioController,
    generateTTSController,
    modelAnswerStore
};

