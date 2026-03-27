const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../services/openaiService');

/**
 * POST /api/interview/generate
 * Generate open-ended interview questions from resume text.
 */
async function generateInterviewQuestionsController(req, res) {
    try {
        const { resume_text, role, count = 7 } = req.body;

        if (!resume_text) {
            return res.status(400).json({ error: 'resume_text is required' });
        }
        if (!role) {
            return res.status(400).json({ error: 'role is required' });
        }

        const questions = await generateInterviewQuestions(resume_text, role, Math.min(count, 10));

        if (!questions || questions.length === 0) {
            return res.status(422).json({ error: 'Could not generate interview questions. Please try again.' });
        }

        res.json({
            success: true,
            role,
            question_count: questions.length,
            questions
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
        const { question, answer, role, category } = req.body;

        if (!question || !role) {
            return res.status(400).json({ error: 'question and role are required' });
        }

        const evaluation = await evaluateInterviewAnswer(
            question,
            answer || '',
            role,
            category || 'General'
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

module.exports = { generateInterviewQuestionsController, evaluateInterviewAnswerController };
