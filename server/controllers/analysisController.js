const { fullAnalysis } = require('../services/analysisService');
const { generateFeedback, generateActionableFeedback } = require('../services/openaiService');
const { getRequiredSkills, getRoleNames } = require('../services/dataService');
const { saveProgress } = require('../services/dataService');

async function analyzeSkillGap(req, res) {
    try {
        const { resume_skills, role, user_id, resume_text } = req.body;

        if (!resume_skills || !Array.isArray(resume_skills)) {
            return res.status(400).json({ error: 'resume_skills must be an array' });
        }
        if (!role) {
            return res.status(400).json({ error: 'role is required' });
        }

        // Get required skills from dataset
        let required_skills = await getRequiredSkills(role);
        let resolvedRole = role;

        if (!required_skills) {
            // Role not found - try fuzzy match (word-by-word)
            const allRoles = await getRoleNames();
            const roleWords = role.toLowerCase().split(/\s+/);
            const match = allRoles.find(r => {
                const rLower = r.toLowerCase();
                return rLower.includes(roleWords[0]) || rLower.includes(roleWords[1] || '') ||
                    roleWords.some(word => word.length > 3 && rLower.includes(word));
            });
            if (!match) {
                return res.status(404).json({
                    error: `Role "${role}" not found in dataset`,
                    available_roles: allRoles.slice(0, 15)
                });
            }
            // Use the matched role's skills
            resolvedRole = match;
            required_skills = await getRequiredSkills(match);
        }

        const skillsForRole = required_skills || [];
        const { matched, missing, alignment_stage } = fullAnalysis(resume_skills, skillsForRole);

        // Generate AI feedback
        let feedback = '';
        let weak_areas = [];
        let resume_improvements = [];

        try {
            feedback = await generateFeedback(matched, missing, resolvedRole, resume_text || '');
            const actionable = await generateActionableFeedback(matched, missing, resolvedRole, resume_text || '');
            weak_areas = actionable.weak_areas || [];
            resume_improvements = actionable.resume_improvements || [];
        } catch (aiErr) {
            console.warn('AI feedback failed, using default:', aiErr.message);
            feedback = `You have demonstrated ${matched.length} skills relevant to the ${resolvedRole} role. ${missing.length > 0 ? `Focus on developing ${missing.slice(0, 3).join(', ')} to strengthen your profile.` : 'Great job – you are well aligned!'}`;
            weak_areas = missing.slice(0, 3);
            resume_improvements = ["Add more specific projects demonstrating missing skills."];
        }

        // Save progress
        if (user_id) {
            try {
                saveProgress({ user_id, role: resolvedRole, alignment_stage, missing_skills: missing, matched_skills: matched });
            } catch (e) {
                console.warn('Progress save failed:', e.message);
            }
        }

        res.json({
            success: true,
            role: resolvedRole,
            requested_role: role,
            matched_skills: matched,
            missing_skills: missing,
            alignment_stage,
            feedback,
            weak_areas,
            resume_improvements,
            required_skills: skillsForRole,
            total_required: skillsForRole.length,
            total_matched: matched.length,
            total_missing: missing.length
        });
    } catch (err) {
        console.error('Analysis error:', err.message);
        res.status(500).json({ error: 'Analysis failed', details: err.message });
    }
}

module.exports = { analyzeSkillGap };
