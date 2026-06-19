const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    user_id: {
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
        required: true
    },
    missing_skills: {
        type: [String],
        default: []
    },
    matched_skills: {
        type: [String],
        default: []
    },
    evaluation_status: {
        type: String,
        enum: ['completed', 'skipped', 'pending'],
        default: 'pending'
    },
    category_breakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Progress', ProgressSchema);
