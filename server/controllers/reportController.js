const { generatePDFReport } = require('../services/reportService');

async function generateReport(req, res) {
    try {
        const {
            role,
            alignment_stage,
            detected_skills,
            missing_skills,
            matched_skills,
            feedback,
            projects,
            certifications
        } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'role is required' });
        }

        const pdfBuffer = await generatePDFReport({
            role,
            alignment_stage,
            detected_skills: detected_skills || [],
            missing_skills: missing_skills || [],
            matched_skills: matched_skills || [],
            feedback,
            projects: projects || [],
            certifications: certifications || [],
            date: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="DreamRole_Report_${role.replace(/\s+/g, '_')}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Report generation error:', err.message);
        res.status(500).json({ error: 'PDF generation failed', details: err.message });
    }
}

module.exports = { generateReport };
