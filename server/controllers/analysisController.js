const { fullAnalysis } = require('../services/analysisService');
const { generateFeedback, generateActionableFeedback } = require('../services/openaiService');
const { getRequiredSkills, getRequiredSkillsCategorized, getRoleNames } = require('../services/dataService');
const { saveProgress } = require('../services/dataService');
const AnalysisResult = require('../models/AnalysisResult');
const UserProfile = require('../models/UserProfile');

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
        let categorized_skills = await getRequiredSkillsCategorized(role);
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
            categorized_skills = await getRequiredSkillsCategorized(match);
        }

        const skillsForRole = required_skills || [];
        const { matched, missing, alignment_stage, category_breakdown } = fullAnalysis(resume_skills, skillsForRole, categorized_skills);

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

        // Save progress (JSON file fallback)
        if (user_id) {
            try {
                saveProgress({ user_id, role: resolvedRole, alignment_stage, missing_skills: missing, matched_skills: matched });
            } catch (e) {
                console.warn('Progress save failed:', e.message);
            }
        }

        // Persist full analysis result to MongoDB (upsert per uid + role)
        try {
            const uid = req.user?.uid || 'anonymous';
            await AnalysisResult.findOneAndUpdate(
                { uid, role: resolvedRole },
                {
                    uid,
                    role: resolvedRole,
                    alignment_stage,
                    matched_skills: matched,
                    missing_skills: missing,
                    total_required: skillsForRole.length,
                    total_matched: matched.length,
                    category_breakdown: category_breakdown || {},
                    feedback,
                    weak_areas,
                    resume_improvements
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (dbErr) {
            // Non-fatal — app continues even if DB write fails
            console.warn('AnalysisResult DB save failed:', dbErr.message);
        }

        // Update UserProfile last_alignment_stage snapshot (non-fatal)
        try {
            const uid = req.user?.uid;
            if (uid && uid !== 'anonymous') {
                await UserProfile.findOneAndUpdate(
                    { uid },
                    { $set: {
                        last_alignment_stage: alignment_stage,
                        last_analysis_role: resolvedRole,
                        last_analysis_at: new Date()
                    }},
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
        } catch (profileErr) {
            console.warn('UserProfile snapshot update failed:', profileErr.message);
        }

        res.json({
            success: true,
            role: resolvedRole,
            requested_role: role,
            matched_skills: matched,
            missing_skills: missing,
            alignment_stage,
            category_breakdown,
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
