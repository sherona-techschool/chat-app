const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video_call', 'audio_call'],
        default: 'text'
    },
    callDuration: {
        type: Number, 
        default: 0
    },
    fileUrl: {
        type: String,
        default: ''
    },
    delivered: {
        type: Boolean,
        default: false,
    },
    read: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Message', messageSchema);
