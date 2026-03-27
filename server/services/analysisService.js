const { getAlignmentStage } = require('../utils/stageClassifier');

/**
 * Compare resume skills against required role skills.
 * Case-insensitive comparison.
 * @param {string[]} resumeSkills
 * @param {string[]} requiredSkills
 * @returns {{ matched: string[], missing: string[] }}
 */
function analyzeGap(resumeSkills, requiredSkills) {
    const normalizedResume = resumeSkills.map(s => s.toLowerCase().trim());

    const matched = requiredSkills.filter(skill =>
        normalizedResume.some(rs => rs.includes(skill.toLowerCase().trim()) ||
            skill.toLowerCase().trim().includes(rs))
    );

    const missing = requiredSkills.filter(skill => !matched.includes(skill));

    return { matched, missing };
}

/**
 * Full analysis combining gap analysis + stage classification.
 * @param {string[]} resumeSkills
 * @param {string[]} requiredSkills
 * @returns {{ matched: string[], missing: string[], alignment_stage: string }}
 */
function fullAnalysis(resumeSkills, requiredSkills) {
    const { matched, missing } = analyzeGap(resumeSkills, requiredSkills);
    const alignment_stage = getAlignmentStage(matched.length, requiredSkills.length);

    return { matched, missing, alignment_stage };
}

module.exports = { analyzeGap, fullAnalysis };
