"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCode = void 0;
const mongoose_1 = require("mongoose");
const QRCodeSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['static', 'dynamic'], required: true },
    dataType: {
        type: String,
        enum: ['url', 'text', 'email', 'sms', 'phone', 'wifi', 'contact', 'event', 'location', 'pdf'],
        required: true,
    },
    content: { type: mongoose_1.Schema.Types.Mixed, required: true },
    style: {
        foregroundType: { type: String, default: 'color' },
        foregroundColor: { type: String, default: '#000000' },
        gradientType: { type: String, default: 'linear' },
        gradientColors: { type: [String], default: ['#2563EB', '#06B6D4'] },
        backgroundColor: { type: String, default: '#FFFFFF' },
        dotsPattern: { type: String, default: 'square' },
        cornersType: { type: String, default: 'square' },
        cornersDotsType: { type: String, default: 'square' },
        logoUrl: { type: String },
        logoMargin: { type: Number, default: 2 },
        logoWidth: { type: Number },
        logoHeight: { type: Number },
        frameType: { type: String, default: 'none' },
        frameText: { type: String },
        frameTextColor: { type: String, default: '#FFFFFF' },
        frameColor: { type: String, default: '#2563EB' },
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'expired', 'deleted'],
        default: 'active',
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    redirectCode: { type: String, unique: true, sparse: true },
}, { timestamps: true });
// Indexing for faster queries and search (handled automatically by mongoose unique constraints where applicable)
exports.QRCode = (0, mongoose_1.model)('QRCode', QRCodeSchema);
