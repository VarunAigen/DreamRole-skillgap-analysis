const { getMentors } = require('../services/dataService');

function getMentorsController(req, res) {
    try {
        const { role } = req.query;
        const mentors = getMentors(role || null);

        res.json({
            success: true,
            count: mentors.length,
            mentors
        });
    } catch (err) {
        console.error('Mentors error:', err.message);
        res.status(500).json({ error: 'Failed to fetch mentors', details: err.message });
    }
}

module.exports = { getMentorsController };
