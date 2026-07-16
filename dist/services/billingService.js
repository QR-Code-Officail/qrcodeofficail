"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bypassVerification = process.env.BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION === 'true';
exports.billingService = {
    /**
     * Verifies Google Play Purchase token
     */
    async verifySubscription(packageName, subscriptionId, // productId
    purchaseToken) {
        console.log(`Verifying subscription for package: ${packageName}, product: ${subscriptionId}, token: ${purchaseToken}`);
        // If sandbox/bypass is active, return a simulated successful verification
        if (bypassVerification || purchaseToken.startsWith('sandbox_token_')) {
            const now = new Date();
            let durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days default (monthly)
            if (subscriptionId.includes('yearly') || subscriptionId.includes('year')) {
                durationMs = 365 * 24 * 60 * 60 * 1000; // 365 days (yearly)
            }
            else if (subscriptionId.includes('trial')) {
                durationMs = 14 * 24 * 60 * 60 * 1000; // 14 days trial
            }
            return {
                isValid: true,
                purchaseState: 0, // 0 = Purchased
                currentPeriodStart: now,
                currentPeriodEnd: new Date(now.getTime() + durationMs),
                autoRenewing: true,
            };
        }
        // Real verification flow (Google Play Android Developer API)
        try {
            const { google } = require('googleapis');
            const path = require('path');
            // Primary: read credentials from JSON env variable (works on Render/cloud)
            // Fallback: read from a local key file path (local development)
            let authConfig;
            const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
            const keyPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;
            if (serviceAccountJson) {
                try {
                    const credentials = JSON.parse(serviceAccountJson);
                    authConfig = {
                        credentials,
                        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
                    };
                }
                catch {
                    return {
                        isValid: false,
                        purchaseState: 1,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(),
                        autoRenewing: false,
                        error: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is set but contains invalid JSON.',
                    };
                }
            }
            else if (keyPath) {
                const resolvedKeyPath = path.isAbsolute(keyPath)
                    ? keyPath
                    : path.resolve(process.cwd(), keyPath);
                authConfig = {
                    keyFile: resolvedKeyPath,
                    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
                };
            }
            else {
                return {
                    isValid: false,
                    purchaseState: 1,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(),
                    autoRenewing: false,
                    error: 'No Google Play service account credentials configured.',
                };
            }
            // Authenticate with Google APIs
            const auth = new google.auth.GoogleAuth(authConfig);
            const play = google.androidpublisher({
                version: 'v3',
                auth,
            });
            const res = await play.purchases.subscriptions.get({
                packageName,
                subscriptionId,
                token: purchaseToken,
            });
            const purchase = res.data;
            // purchaseState/paymentState: 0 = Pending, 1 = Received, 2 = Free trial, 3 = Grace period
            // Expiration checks
            const expiryTimeMillis = parseInt(purchase.expiryTimeMillis || '0', 10);
            const startTimeMillis = parseInt(purchase.startTimeMillis || '0', 10);
            const nowMillis = Date.now();
            const isValid = expiryTimeMillis > nowMillis;
            return {
                isValid,
                purchaseState: purchase.paymentState ?? 1,
                currentPeriodStart: new Date(startTimeMillis),
                currentPeriodEnd: new Date(expiryTimeMillis),
                autoRenewing: purchase.autoResumeTimeMillis ? true : (purchase.cancelReason === undefined),
            };
        }
        catch (err) {
            console.error('Google Play verification API exception:', err);
            return {
                isValid: false,
                purchaseState: 1,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(),
                autoRenewing: false,
                error: err.message || 'Google Play validation exception',
            };
        }
    },
};
