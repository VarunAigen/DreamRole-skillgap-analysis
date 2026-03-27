const { getProgress, saveProgress } = require('../services/dataService');

function getProgressController(req, res) {
    try {
        const { user_id } = req.query;
        const records = getProgress(user_id || null);

        // Filter out the placeholder entry
        const realRecords = records.filter(r => r.user_id && r.user_id !== null);

        res.json({
            success: true,
            count: realRecords.length,
            progress: realRecords
        });
    } catch (err) {
        console.error('Progress fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress', details: err.message });
    }
}

function saveProgressController(req, res) {
    try {
        const { user_id, role, alignment_stage, missing_skills, matched_skills } = req.body;

        if (!user_id || !role || !alignment_stage) {
            return res.status(400).json({ error: 'user_id, role, and alignment_stage are required' });
        }

        const saved = saveProgress({ user_id, role, alignment_stage, missing_skills, matched_skills });

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
