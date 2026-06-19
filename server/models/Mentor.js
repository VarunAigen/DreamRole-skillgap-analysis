const mongoose = require('mongoose');

/**
 * Mentor — persists real human mentor profiles.
 * Linked to Firebase UID.
 */
const MentorSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    mentorId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    designation: {
        type: String,
        default: ''
    },
    company: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    profileInfo: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Mentor', MentorSchema);
