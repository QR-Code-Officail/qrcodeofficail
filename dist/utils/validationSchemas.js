"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionPurchaseSchema = exports.updateQrStatusSchema = exports.qrCodeSchema = exports.verifyOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        phone: zod_1.z.string().optional(),
        country: zod_1.z.string().min(2, 'Country must be specified'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        otp: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
    }),
});
exports.qrCodeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        type: zod_1.z.enum(['static', 'dynamic']),
        dataType: zod_1.z.enum(['url', 'text', 'email', 'sms', 'phone', 'wifi', 'contact', 'event', 'location', 'pdf']),
        content: zod_1.z.record(zod_1.z.any(), { required_error: 'Content object is required' }),
        style: zod_1.z.object({
            foregroundType: zod_1.z.enum(['color', 'gradient']).optional(),
            foregroundColor: zod_1.z.string().optional(),
            gradientType: zod_1.z.enum(['linear', 'radial']).optional(),
            gradientColors: zod_1.z.array(zod_1.z.string()).optional(),
            backgroundColor: zod_1.z.string().optional(),
            dotsPattern: zod_1.z.enum(['square', 'dots', 'rounded', 'classy', 'extra-rounded']).optional(),
            cornersType: zod_1.z.enum(['square', 'dot', 'extra-rounded', 'out-rounded']).optional(),
            cornersDotsType: zod_1.z.enum(['square', 'dot']).optional(),
            logoUrl: zod_1.z.string().optional(),
            logoMargin: zod_1.z.number().optional(),
            logoWidth: zod_1.z.number().optional(),
            logoHeight: zod_1.z.number().optional(),
            frameType: zod_1.z.string().optional(),
            frameText: zod_1.z.string().optional(),
            frameTextColor: zod_1.z.string().optional(),
            frameColor: zod_1.z.string().optional(),
        }).optional(),
    }),
});
exports.updateQrStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['draft', 'active', 'paused']),
    }),
});
exports.subscriptionPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        packageName: zod_1.z.string(),
        productId: zod_1.z.string(),
        purchaseToken: zod_1.z.string(),
    }),
});
