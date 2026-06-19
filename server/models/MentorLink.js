const mongoose = require('mongoose');

/**
 * MentorLink — bridges Firebase UIDs for mentor-student relationships.
 * Firebase manages identity; MongoDB manages the relationship graph.
 */
const MentorLinkSchema = new mongoose.Schema({
    mentorUid: { type: String, required: true },     // Firebase UID of mentor (indexed via schema.index below)
    mentorEmail: { type: String, required: true },
    mentorName: { type: String, default: '' },
    students: [{
        uid: { type: String, required: true },                    // Firebase UID of student
        email: { type: String, required: true },
        name: { type: String, default: '' },
        linkedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }]
}, { timestamps: true });

// Ensure one document per mentor
MentorLinkSchema.index({ mentorUid: 1 }, { unique: true });

module.exports = mongoose.model('MentorLink', MentorLinkSchema);
