const { extractSkills } = require('../services/openaiService');

async function extractSkillsController(req, res) {
    try {
        const { resume_text } = req.body;
        if (!resume_text) {
            return res.status(400).json({ error: 'resume_text is required in request body' });
        }

        const skills = await extractSkills(resume_text);

        res.json({
            success: true,
            skills,
            count: skills.length
        });
    } catch (err) {
        console.error('Skill extraction error:', err.message);
        res.status(500).json({ error: 'Skill extraction failed', details: err.message });
    }
}

module.exports = { extractSkillsController };
