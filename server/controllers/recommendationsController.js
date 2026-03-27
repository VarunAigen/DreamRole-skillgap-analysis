const { getProjects, getCertifications, getRoleNames, getDomainsAndRoles } = require('../services/dataService');

async function getRecommendations(req, res) {
    try {
        const { role } = req.query;

        if (req.query.grouped === 'true') {
            const data = await getDomainsAndRoles();
            return res.json({ success: true, ...data });
        }

        // If just requesting role list
        if (req.query.roles === 'true') {
            const roles = await getRoleNames();
            return res.json({ success: true, roles });
        }

        if (!role) {
            const roles = await getRoleNames();
            return res.json({ success: true, roles });
        }

        const [projects, certifications] = await Promise.all([
            getProjects(role),
            getCertifications(role)
        ]);

        res.json({
            success: true,
            role,
            projects,
            certifications
        });
    } catch (err) {
        console.error('Recommendations error:', err.message);
        res.status(500).json({ error: 'Failed to fetch recommendations', details: err.message });
    }
}

module.exports = { getRecommendations };
