const { getPersonas, getPersonaById, getCategories, compareSkills } = require('../services/personaService');
const { generateCareerRoadmap, chatWithMentor } = require('../services/openaiService');

/**
 * GET /api/personas
 * Returns all mentor personas, optional ?category=&search=
 */
async function listPersonas(req, res) {
    try {
        const { category, domain, search } = req.query;
        const personas = await getPersonas({ category, domain, search });
        res.json({ success: true, count: personas.length, personas });
    } catch (err) {
        console.error('Persona list error:', err.message);
        res.status(500).json({ error: 'Failed to fetch personas' });
    }
}

/**
 * GET /api/personas/categories
 */
async function listCategories(req, res) {
    try {
        const categories = await getCategories();
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}

/**
 * GET /api/personas/:id
 */
async function getPersona(req, res) {
    try {
        const persona = await getPersonaById(req.params.id);
        if (!persona) return res.status(404).json({ error: 'Mentor not found' });
        res.json({ success: true, persona });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch mentor' });
    }
}

/**
 * POST /api/personas/:id/roadmap
 * Generate a step-by-step career roadmap for reaching this mentor's role.
 */
async function generateRoadmap(req, res) {
    try {
        const persona = await getPersonaById(req.params.id);
        if (!persona) return res.status(404).json({ error: 'Mentor not found' });

        const { student_skills = [] } = req.body;
        const roadmap = await generateCareerRoadmap(persona, student_skills);
        res.json({ success: true, role: persona.role, mentor: persona.name, roadmap });
    } catch (err) {
        console.error('Roadmap error:', err.message);
        res.status(500).json({ error: 'Failed to generate roadmap', details: err.message });
    }
}

/**
 * POST /api/personas/:id/skill-gap
 * Compare student's skills with mentor's skills.
 */
async function checkSkillGap(req, res) {
    try {
        const persona = await getPersonaById(req.params.id);
        if (!persona) return res.status(404).json({ error: 'Mentor not found' });

        const { student_skills = [] } = req.body;
        if (!Array.isArray(student_skills) || student_skills.length === 0) {
            return res.status(400).json({ error: 'student_skills array is required' });
        }

        const { known, missing } = compareSkills(student_skills, persona.skills);
        res.json({
            success: true,
            mentor_name: persona.name,
            mentor_role: persona.role,
            mentor_skills: persona.skills,
            student_skills,
            known_skills: known,
            missing_skills: missing,
            total_required: persona.skills.length,
            total_known: known.length,
            total_missing: missing.length
        });
    } catch (err) {
        res.status(500).json({ error: 'Skill gap check failed' });
    }
}

/**
 * POST /api/personas/:id/chat
 * Chat with the mentor persona using OpenAI + persona system prompt.
 */
async function chatWithMentorController(req, res) {
    try {
        const persona = await getPersonaById(req.params.id);
        if (!persona) return res.status(404).json({ error: 'Mentor not found' });

        const { messages = [], student_goal } = req.body;
        if (!messages.length && !student_goal) {
            return res.status(400).json({ error: 'messages or student_goal required' });
        }

        const reply = await chatWithMentor(persona, messages, student_goal);
        res.json({ success: true, reply, mentor: persona.name });
    } catch (err) {
        console.error('Mentor chat error:', err.message);
        res.status(500).json({ error: 'Chat failed', details: err.message });
    }
}

module.exports = { listPersonas, listCategories, getPersona, generateRoadmap, checkSkillGap, chatWithMentor: chatWithMentorController };
