import dotenv from 'dotenv';

dotenv.config();

// Set BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION=true in .env for local/sandbox testing only.
// In production on Render, set this to false and provide GOOGLE_PLAY_SERVICE_ACCOUNT_JSON instead.
const bypassVerification = process.env.BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION === 'true';

if (bypassVerification) {
  console.warn('[BillingService] ⚠️  BYPASS mode is ON — real Google Play verification is SKIPPED. Do NOT use in production.');
} else {
  console.log('[BillingService] ✅  Live Google Play verification is enabled.');
}

export interface IPlayStorePurchase {
  packageName: string;
  productId: string;
  purchaseToken: string;
  purchaseTime: number;
  purchaseState: number; // 0 = Purchased, 1 = Canceled, 2 = Pending
  autoRenewing: boolean;
}

export const billingService = {
  /**
   * Verifies Google Play Purchase token
   */
  async verifySubscription(
    packageName: string,
    subscriptionId: string, // productId
    purchaseToken: string
  ): Promise<{
    isValid: boolean;
    purchaseState: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    autoRenewing: boolean;
    error?: string;
  }> {
    console.log(`Verifying subscription for package: ${packageName}, product: ${subscriptionId}, token: ${purchaseToken}`);

    // If bypass is active (local/sandbox testing), return a simulated successful verification
    if (bypassVerification) {
      console.log('[BillingService] Bypass active — returning simulated successful verification for:', subscriptionId);
      const now = new Date();
      let durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days default (monthly)
      
      if (subscriptionId.includes('yearly') || subscriptionId.includes('year')) {
        durationMs = 365 * 24 * 60 * 60 * 1000; // 365 days (yearly)
      } else if (subscriptionId.includes('trial')) {
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
      let authConfig: any;

      const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
      const keyPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;

      if (serviceAccountJson) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          authConfig = {
            credentials,
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
          };
        } catch {
          return {
            isValid: false,
            purchaseState: 1,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            autoRenewing: false,
            error: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is set but contains invalid JSON.',
          };
        }
      } else if (keyPath) {
        const resolvedKeyPath = path.isAbsolute(keyPath)
          ? keyPath
          : path.resolve(process.cwd(), keyPath);
        authConfig = {
          keyFile: resolvedKeyPath,
          scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        };
      } else {
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
    } catch (err: any) {
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
