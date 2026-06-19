const { getProgress, saveProgress } = require('../services/dataService');

async function getProgressController(req, res) {
    try {
        // Firebase auth sets req.user.uid; fallback to req.user.id for backward compat
        const user_id = req.user.uid || req.user.id;
        if (!user_id) {
            return res.json({ success: true, count: 0, progress: [] });
        }
        
        const records = await getProgress(user_id);

        res.json({
            success: true,
            count: records.length,
            progress: records
        });
    } catch (err) {
        console.error('Progress fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress', details: err.message });
    }
}

async function saveProgressController(req, res) {
    try {
        const { role, alignment_stage, missing_skills, matched_skills, evaluation_status } = req.body;
        // Firebase auth sets req.user.uid
        const user_id = req.user.uid || req.user.id;

        if (!user_id || !role || !alignment_stage) {
            return res.status(400).json({ error: 'user_id, role, and alignment_stage are required' });
        }

        const saved = await saveProgress({ 
            user_id, role, alignment_stage, missing_skills, matched_skills, evaluation_status 
        });

        res.json({
            success: true,
            message: 'Progress saved successfully',
            entry: saved
        });
    } catch (err) {
        console.error('Progress save error:', err.message);
        res.status(500).json({ error: 'Failed to save progress', details: err.message });
    }
}

module.exports = { getProgressController, saveProgressController };
