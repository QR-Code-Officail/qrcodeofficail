"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanAnalytics = void 0;
const mongoose_1 = require("mongoose");
const ScanAnalyticsSchema = new mongoose_1.Schema({
    qrCodeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QRCode', required: true },
    uniqueScan: { type: Boolean, default: false },
    country: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    ip: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now },
}, { timestamps: true });
ScanAnalyticsSchema.index({ qrCodeId: 1 });
ScanAnalyticsSchema.index({ scannedAt: 1 });
exports.ScanAnalytics = (0, mongoose_1.model)('ScanAnalytics', ScanAnalyticsSchema);
