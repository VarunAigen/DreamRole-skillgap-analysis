const mongoose = require('mongoose');

/**
 * AnalysisResult — stores the full categorized skill gap analysis result per user per role.
 * Replaces the flat skill list stored in Progress with the full weighted breakdown.
 */
const CategoryBreakdownSchema = new mongoose.Schema({
    total: { type: Number, default: 0 },
    matched: { type: Number, default: 0 },
    matched_skills: { type: [String], default: [] },
    missing_skills: { type: [String], default: [] },
    percentage: { type: Number, default: 0 }
}, { _id: false });

const AnalysisResultSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        required: true
    },
    alignment_stage: {
        type: String,
        enum: ['Foundation Stage', 'Developing Stage', 'Skilled Stage', 'Role Ready Stage'],
        required: true
    },
    matched_skills: { type: [String], default: [] },
    missing_skills: { type: [String], default: [] },
    total_required: { type: Number, default: 0 },
    total_matched: { type: Number, default: 0 },
    category_breakdown: {
        core_skills: CategoryBreakdownSchema,
        programming_languages: CategoryBreakdownSchema,
        frameworks_and_libraries: CategoryBreakdownSchema,
        tools_and_technologies: CategoryBreakdownSchema,
        platforms_and_cloud: CategoryBreakdownSchema,
        methodologies_and_practices: CategoryBreakdownSchema,
        soft_skills: CategoryBreakdownSchema
    },
    feedback: { type: String, default: '' },
    weak_areas: { type: [String], default: [] },
    resume_improvements: { type: [String], default: [] }
}, {
    timestamps: true
});

// One analysis result per user per role (upsert-safe)
AnalysisResultSchema.index({ uid: 1, role: 1 });
AnalysisResultSchema.index({ uid: 1, createdAt: -1 });

module.exports = mongoose.model('AnalysisResult', AnalysisResultSchema);
