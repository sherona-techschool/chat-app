const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        fullName: { type: String, required: true },

        email: { type: String, required: true, unique: true, lowercase: true },
        phone: { type: String, required: true, unique: true },

        password: { type: String, required: true }, 
        avatar: { type: String, default: "" },
        bio: { type: String, default: "Hey there! I am using ChatApp" },

        dob: Date,
        gender: { type: String, enum: ["male", "female", "other"] },

        status: { type: String, enum: ["online", "offline"], default: "offline" },
        lastSeen: { type: Date, default: Date.now },

        socketId: { type: String, default: null },
        isInCall: { type: Boolean, default: false },
        activeRoomId: { type: String, default: null },

        mediaPreferences: {
            videoEnabled: { type: Boolean, default: true },
            audioEnabled: { type: Boolean, default: true }
        },

        isVerified: { type: Boolean, default: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        isBlocked: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
