const UserProfile = require('../models/UserProfile');

/**
 * Plan limits per feature.
 * 'pro' users get unlimited (Infinity).
 * 'free' users are capped per calendar month.
 */
const PLAN_LIMITS = {
    jd_analysis: { free: 3,  pro: Infinity },
    interview:   { free: 2,  pro: Infinity },
    report:      { free: 3,  pro: Infinity }
};

/**
 * Middleware factory: checks the user's plan & monthly usage before allowing
 * access to a rate-limited AI feature.
 *
 * Usage:
 *   router.post('/analyze', firebaseAuth(), requirePlan('jd_analysis'), controller)
 *
 * On success: increments usage counter and calls next().
 * On limit reached: returns 403 with upgrade message.
 *
 * @param {'jd_analysis' | 'interview' | 'report'} feature
 */
function requirePlan(feature) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.uid) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const profile = await UserProfile.findOne({ uid: req.user.uid });
            if (!profile) {
                return res.status(404).json({ error: 'User profile not found. Please complete onboarding.' });
            }

            const plan = profile.plan || 'free';
            const limit = PLAN_LIMITS[feature]?.[plan];

            if (limit == null) {
                // Unknown feature — allow through (don't block)
                return next();
            }

            // Pro users bypass all limits
            if (limit === Infinity) {
                return next();
            }

            // Reset usage counters if we're in a new month
            const now = new Date();
            const resetDate = profile.usage?.resetDate || new Date(0);
            const needsReset = now.getMonth() !== resetDate.getMonth() ||
                               now.getFullYear() !== resetDate.getFullYear();

            if (needsReset) {
                profile.usage = {
                    jd_analysis: 0,
                    interview: 0,
                    report: 0,
                    resetDate: now
                };
                await profile.save();
            }

            const currentUsage = profile.usage?.[feature] || 0;

            if (currentUsage >= limit) {
                return res.status(403).json({
                    error: 'Monthly limit reached',
                    message: `You've used all ${limit} free ${feature.replace('_', ' ')} requests this month. Upgrade to Pro for unlimited access.`,
                    plan,
                    feature,
                    used: currentUsage,
                    limit,
                    upgrade_needed: true
                });
            }

            // Increment usage counter
            const usageKey = `usage.${feature}`;
            await UserProfile.updateOne(
                { uid: req.user.uid },
                { $inc: { [usageKey]: 1 } }
            );

            next();
        } catch (err) {
            console.error('[planGate] Error:', err.message);
            // On error, allow through rather than blocking the user
            next();
        }
    };
}

module.exports = { requirePlan, PLAN_LIMITS };
