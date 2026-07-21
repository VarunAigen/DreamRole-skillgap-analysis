const JdAnalysis = require('../models/JdAnalysis');
const { generateJdMatch } = require('../services/openaiService');

async function analyzeJdMatch(req, res) {
    try {
        const { jd_text, resume_text, job_title = 'Unknown Role', company_name = 'Unknown Company' } = req.body;
        // IDOR fix: always use verified Firebase token uid
        const uid = req.user?.uid;

        if (!uid) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!jd_text || !resume_text) {
            return res.status(400).json({ error: 'Job description and resume text are required' });
        }

        // Call OpenAI to analyze the JD against the resume
        const analysisResult = await generateJdMatch(resume_text, jd_text);

        // Save to Database
        const newJdAnalysis = new JdAnalysis({
            uid,
            job_title,
            company_name,
            jd_text,
            resume_text,
            overall_score: analysisResult.overall_score || analysisResult.match_score || 0,
            match_score: analysisResult.match_score || analysisResult.overall_score || 0,
            hard_requirement_flags: analysisResult.hard_requirement_flags || [],
            matched_keywords: analysisResult.matched_keywords || [],
            adjacent_matches: analysisResult.adjacent_matches || [],
            missing_keywords: analysisResult.missing_keywords || [],
            formatting_issues: analysisResult.formatting_issues || [],
            actionable_suggestions: analysisResult.actionable_suggestions || [],
            shortlist_likelihood: analysisResult.shortlist_likelihood || 'medium',
            shortlist_reasoning: analysisResult.shortlist_reasoning || '',
            suggested_bullet_points: analysisResult.suggested_bullet_points || [],
            summary_update: analysisResult.summary_update || '',
            projects: analysisResult.projects || [],
            certifications: analysisResult.certifications || [],
            ats_check: analysisResult.ats_check || { score: 0, feedback: '', formatting_issues: [] }
        });
        const savedRecord = await newJdAnalysis.save();

        res.json({
            success: true,
            id: savedRecord._id,
            ...analysisResult
        });
    } catch (err) {
        console.error('JD Analysis error:', err.message);
        res.status(500).json({ error: 'JD Analysis failed', details: err.message });
    }
}

async function getJdHistory(req, res) {
    try {
        // IDOR fix: use verified Firebase token uid only
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const history = await JdAnalysis.find({ uid })
            .select('job_title company_name overall_score match_score shortlist_likelihood createdAt')
            .sort({ createdAt: -1 });

        res.json({ success: true, history });
    } catch (err) {
        console.error('JD History error:', err.message);
        res.status(500).json({ error: 'Failed to fetch JD history', details: err.message });
    }
}

async function getJdAnalysis(req, res) {
    try {
        const { id } = req.params;
        // IDOR fix: use verified Firebase token uid only
        const uid = req.user?.uid;
        
        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const analysis = await JdAnalysis.findOne({ _id: id, uid });
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        res.json({ success: true, analysis });
    } catch (err) {
        console.error('Fetch JD Analysis error:', err.message);
        res.status(500).json({ error: 'Failed to fetch analysis', details: err.message });
    }
}

module.exports = { analyzeJdMatch, getJdHistory, getJdAnalysis };
