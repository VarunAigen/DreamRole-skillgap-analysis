/**
 * Determines alignment stage from matched/required skill counts.
 * Percentage is computed internally and never exposed to the client.
 *
 * Stages:
 *   0–29%  → Foundation Stage
 *  30–54%  → Developing Stage
 *  55–79%  → Skilled Stage
 *  80–100% → Role Ready Stage
 */
function getAlignmentStage(matchedCount, requiredCount) {
    if (!requiredCount || requiredCount === 0) return 'Foundation Stage';

    const pct = (matchedCount / requiredCount) * 100;

    if (pct >= 80) return 'Role Ready Stage';
    if (pct >= 55) return 'Skilled Stage';
    if (pct >= 30) return 'Developing Stage';
    return 'Foundation Stage';
}

module.exports = { getAlignmentStage };
