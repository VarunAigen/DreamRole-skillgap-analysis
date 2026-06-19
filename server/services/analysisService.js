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
 * Full analysis combining gap analysis + stage classification using categorized weighted scores.
 * @param {string[]} resumeSkills
 * @param {string[]} requiredSkills
 * @param {Object} categorizedSkills
 */
function fullAnalysis(resumeSkills, requiredSkills, categorizedSkills = null) {
    const { matched, missing } = analyzeGap(resumeSkills, requiredSkills);
    
    let alignment_stage = 'Foundation Stage';
    let category_breakdown = {};

    if (categorizedSkills) {
        // Base weights for the scoring engine
        const weights = {
            core_skills: 0.25,
            programming_languages: 0.15,
            frameworks_and_libraries: 0.15,
            tools_and_technologies: 0.10,
            platforms_and_cloud: 0.10,
            methodologies_and_practices: 0.15,
            soft_skills: 0.10
        };

        let activeWeightsSum = 0;
        let weightedScore = 0;

        for (const [category, skills] of Object.entries(categorizedSkills)) {
            // We ignore optional_advanced_skills in the core score calculation
            if (category === 'optional_advanced_skills') continue;
            
            const total = skills.length;
            const matchedSkills = analyzeGap(resumeSkills, skills).matched;
            const matchedCount = matchedSkills.length;
            
            category_breakdown[category] = {
                total,
                matched: matchedCount,
                matched_skills: matchedSkills,
                missing_skills: skills.filter(s => !matchedSkills.includes(s)),
                percentage: total > 0 ? Math.round((matchedCount / total) * 100) : 0
            };

            if (total > 0 && weights[category]) {
                activeWeightsSum += weights[category];
                weightedScore += (matchedCount / total) * weights[category];
            }
        }

        // Normalize the score in case some categories had 0 required skills (e.g. no programming languages)
        const finalScorePercentage = activeWeightsSum > 0 ? (weightedScore / activeWeightsSum) * 100 : 0;
        alignment_stage = getAlignmentStage(finalScorePercentage, true);
    } else {
        alignment_stage = getAlignmentStage(matched.length, requiredSkills.length, false);
    }

    return { matched, missing, alignment_stage, category_breakdown };
}

module.exports = { analyzeGap, fullAnalysis };
