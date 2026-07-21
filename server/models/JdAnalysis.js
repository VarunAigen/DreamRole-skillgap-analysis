const mongoose = require('mongoose');

const HardRequirementFlagSchema = new mongoose.Schema({
    requirement: { type: String, required: true },
    status: { type: String, enum: ['met', 'not_met', 'unclear'], required: true },
    note: { type: String, default: '' }
}, { _id: false });

const AdjacentMatchSchema = new mongoose.Schema({
    jd_term: { type: String, required: true },
    resume_term: { type: String, required: true },
    note: { type: String, default: '' }
}, { _id: false });

const ActionableSuggestionSchema = new mongoose.Schema({
    type: { type: String, enum: ['add_section', 'rephrase_bullet', 'add_project', 'get_certification', 'fill_missing_field'], required: true },
    suggestion: { type: String, required: true },
    honesty_note: { type: String, default: '' }
}, { _id: false });

const ProjectRecommendationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, default: '' },
    tags: { type: [String], default: [] }
}, { _id: false });

const CertificationRecommendationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    platform: { type: String, default: '' },
    link: { type: String, default: '' }
}, { _id: false });

const AtsCheckSchema = new mongoose.Schema({
    score: { type: Number, required: true },
    feedback: { type: String, required: true },
    formatting_issues: { type: [String], default: [] }
}, { _id: false });

const JdAnalysisSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        index: true
    },
    job_title: {
        type: String,
        default: 'Unknown Role'
    },
    company_name: {
        type: String,
        default: 'Unknown Company'
    },
    jd_text: {
        type: String,
        required: true
    },
    resume_text: {
        type: String,
        required: true
    },
    // ── New gap-analysis fields ──
    overall_score: {
        type: Number,
        required: true
    },
    // Backward compat alias — frontend reads overall_score || match_score
    match_score: {
        type: Number,
        default: 0
    },
    hard_requirement_flags: {
        type: [HardRequirementFlagSchema],
        default: []
    },
    matched_keywords: {
        type: [String],
        default: []
    },
    adjacent_matches: {
        type: [AdjacentMatchSchema],
        default: []
    },
    missing_keywords: {
        type: [String],
        default: []
    },
    formatting_issues: {
        type: [String],
        default: []
    },
    actionable_suggestions: {
        type: [ActionableSuggestionSchema],
        default: []
    },
    shortlist_likelihood: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    shortlist_reasoning: {
        type: String,
        default: ''
    },
    // ── Legacy fields (kept for backward compat) ──
    suggested_bullet_points: {
        type: [String],
        default: []
    },
    summary_update: {
        type: String,
        default: ''
    },
    projects: {
        type: [ProjectRecommendationSchema],
        default: []
    },
    certifications: {
        type: [CertificationRecommendationSchema],
        default: []
    },
    ats_check: {
        type: AtsCheckSchema,
        default: { score: 0, feedback: '', formatting_issues: [] }
    }
}, {
    timestamps: true
});

JdAnalysisSchema.index({ uid: 1, createdAt: -1 });

module.exports = mongoose.model('JdAnalysis', JdAnalysisSchema);
