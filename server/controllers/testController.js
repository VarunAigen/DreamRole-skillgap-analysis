const { generateTest } = require('../services/openaiService');

async function generateTestController(req, res) {
    try {
        const { role, missing_skills, resume_text, count = 5 } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'role is required' });
        }

        const skills = missing_skills && Array.isArray(missing_skills) ? missing_skills : [];
        const questions = await generateTest(role, skills, resume_text || '', Math.min(count, 10));

        res.json({
            success: true,
            role,
            question_count: questions.length,
            questions
        });
    } catch (err) {
        console.error('Test generation error:', err.message);
        res.status(500).json({ error: 'Test generation failed', details: err.message });
    }
}

module.exports = { generateTestController };
