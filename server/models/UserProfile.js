const mongoose = require('mongoose');

/**
 * UserProfile — persists resume and career preferences per user.
 * Linked to Firebase UID. One document per user (upsert).
 */
const UserProfileSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Career preferences
    selected_role: { type: String, default: '' },
    selected_domain: { type: String, default: '' },

    // Last resume data
    resume_text: { type: String, default: '' },
    extracted_skills: { type: [String], default: [] },

    // Last analysis snapshot (lightweight summary for dashboard)
    last_alignment_stage: { type: String, default: null },
    last_analysis_role: { type: String, default: null },
    last_analysis_at: { type: Date, default: null },

    // Onboarding
    onboarding_completed: { type: Boolean, default: false },

    // Student background details for human mentors
    collegeDetails: {
        collegeName: { type: String, default: '' },
        degree: { type: String, default: '' },
        gradYear: { type: String, default: '' },
        gpa: { type: String, default: '' }
    },
    projects: [{
        title: { type: String, required: true },
        description: { type: String, default: '' },
        github: { type: String, default: '' }
    }],
    certifications: [{
        title: { type: String, required: true },
        platform: { type: String, default: '' },
        link: { type: String, default: '' }
    }],
    internships: [{
        company: { type: String, required: true },
        role: { type: String, default: '' },
        duration: { type: String, default: '' },
        description: { type: String, default: '' }
    }]
}, {
    timestamps: true  // adds createdAt, updatedAt
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
