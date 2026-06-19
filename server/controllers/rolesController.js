const { recommendRolesAI } = require('../services/rolesService');

async function recommendRoles(req, res) {
    try {
        const { resumeText, skills } = req.body;
        
        if (!resumeText) {
            return res.status(400).json({ error: "Missing resumeText" });
        }
        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({ error: "Missing or invalid skills array" });
        }
        
        const recommendedRoles = await recommendRolesAI(resumeText, skills);
        res.json({ recommended_roles: recommendedRoles });
    } catch (err) {
        console.error('Recommend roles error:', err.message);
        res.status(500).json({ error: 'Failed to generate recommended roles', details: err.message });
    }
}

module.exports = { recommendRoles };
