const UserProfile = require('../models/UserProfile');
const { downloadResumePdf, deleteResumePdf } = require('../utils/gridfsStorage');

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

        // Delete GridFS file if it exists
        const existing = await UserProfile.findOne({ uid }).lean();
        if (existing && existing.resume_pdf_file_id) {
            try {
                await deleteResumePdf(existing.resume_pdf_file_id);
            } catch (e) {
                console.warn('[clearResume] Could not delete GridFS file:', e.message);
            }
        }

        await UserProfile.findOneAndUpdate(
            { uid },
            { 
                $set: { 
                    resume_text: '', 
                    extracted_skills: [],
                    collegeDetails: { collegeName: '', degree: '', gradYear: '', gpa: '' },
                    projects: [],
                    certifications: [],
                    internships: [],
                    resume_pdf_data: '',
                    resume_pdf_name: '',
                    resume_pdf_mime: '',
                    resume_pdf_file_id: null
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

/**
 * GET /api/profile/resume/download
 * Downloads student's own uploaded resume PDF.
 */
async function downloadResume(req, res) {
    try {
        const uid = req.user.uid;
        const profile = await UserProfile.findOne({ uid }).lean();

        if (!profile) {
            return res.status(404).json({ error: 'No resume PDF available for download.' });
        }

        const filename = profile.resume_pdf_name || 'resume.pdf';
        const mime = profile.resume_pdf_mime || 'application/pdf';

        // Prefer GridFS if available
        if (profile.resume_pdf_file_id) {
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            const stream = await downloadResumePdf(profile.resume_pdf_file_id);
            stream.on('error', (err) => {
                console.error('GridFS stream error:', err.message);
                res.status(500).json({ error: 'Failed to stream resume from storage' });
            });
            return stream.pipe(res);
        }

        // Legacy fallback: base64 in document
        if (profile.resume_pdf_data) {
            const pdfBuffer = Buffer.from(profile.resume_pdf_data, 'base64');
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(pdfBuffer);
        }

        return res.status(404).json({ error: 'No resume PDF available for download.' });
    } catch (err) {
        console.error('downloadResume error:', err.message);
        res.status(500).json({ error: 'Failed to download resume', details: err.message });
    }
}

module.exports = { getProfile, updateProfile, clearResume, downloadResume };
