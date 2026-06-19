const UserProfile = require('../models/UserProfile');

/**
 * GET /api/profile
 * Returns the current user's profile (uid, role, resume, skills)
 */
async function getProfile(req, res) {
    try {
        const uid = req.user.uid;
        const profile = await UserProfile.findOne({ uid }).lean();

        if (!profile) {
            // Return empty profile — not an error
            return res.json({
                success: true,
                profile: {
                    uid,
                    selected_role: '',
                    selected_domain: '',
                    resume_text: '',
                    extracted_skills: [],
                    last_alignment_stage: null,
                    last_analysis_role: null,
                    last_analysis_at: null,
                    onboarding_completed: false,
                    collegeDetails: { collegeName: '', degree: '', gradYear: '', gpa: '' },
                    projects: [],
                    certifications: [],
                    internships: []
                }
            });
        }

        res.json({ success: true, profile });
    } catch (err) {
        console.error('getProfile error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
    }
}

/**
 * PATCH /api/profile
 * Upserts only the fields sent in the request body.
 * Supported fields: selected_role, selected_domain, resume_text, extracted_skills,
 *                   last_alignment_stage, last_analysis_role, last_analysis_at, onboarding_completed
 */
async function updateProfile(req, res) {
    try {
        const uid = req.user.uid;

        const allowedFields = [
            'selected_role',
            'selected_domain',
            'resume_text',
            'extracted_skills',
            'last_alignment_stage',
            'last_analysis_role',
            'last_analysis_at',
            'onboarding_completed',
            'collegeDetails',
            'projects',
            'certifications',
            'internships'
        ];

        // Only pick the fields the caller explicitly provided
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided to update.' });
        }

        const profile = await UserProfile.findOneAndUpdate(
            { uid },
            { $set: updates },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, profile });
    } catch (err) {
        console.error('updateProfile error:', err.message);
        res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
}

/**
 * DELETE /api/profile/clear
 * Clears resume and skills (start fresh) but keeps role preference.
 */
async function clearResume(req, res) {
    try {
        const uid = req.user.uid;
        await UserProfile.findOneAndUpdate(
            { uid },
            { 
                $set: { 
                    resume_text: '', 
                    extracted_skills: [],
                    collegeDetails: { collegeName: '', degree: '', gradYear: '', gpa: '' },
                    projects: [],
                    certifications: [],
                    internships: []
                } 
            },
            { upsert: false }
        );
        res.json({ success: true, message: 'Resume and background data cleared.' });
    } catch (err) {
        console.error('clearResume error:', err.message);
        res.status(500).json({ error: 'Failed to clear resume', details: err.message });
    }
}

module.exports = { getProfile, updateProfile, clearResume };
