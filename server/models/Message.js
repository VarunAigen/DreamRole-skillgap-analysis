const mongoose = require('mongoose');

/**
 * Message — persists real-time messages for user-mentor chat.
 */
const MessageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true,
        index: true
    },
    receiverId: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
