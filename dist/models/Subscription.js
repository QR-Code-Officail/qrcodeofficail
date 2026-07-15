"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const SubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: {
        type: String,
        enum: ['trial', 'active', 'grace', 'expired', 'paused'],
        default: 'trial',
    },
    planType: {
        type: String,
        enum: ['starter', 'professional', 'yearly'],
        default: 'starter',
    },
    trialEndsAt: { type: Date, required: true },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    gracePeriodEndsAt: { type: Date },
    googlePlayPurchaseToken: { type: String },
    googlePlayProductId: { type: String },
    autoRenewing: { type: Boolean, default: false },
}, { timestamps: true });
exports.Subscription = (0, mongoose_1.model)('Subscription', SubscriptionSchema);
