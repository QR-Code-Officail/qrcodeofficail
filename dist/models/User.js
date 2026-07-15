"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    country: { type: String },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', UserSchema);
