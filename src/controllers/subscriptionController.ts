import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Subscription } from '../models/Subscription';
import { QRCode } from '../models/QRCode';
import { billingService } from '../services/billingService';
import { emailService } from '../services/emailService';

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found for this account.' });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { packageName, productId, purchaseToken } = req.body;

    // Call validation helper
    const verification = await billingService.verifySubscription(packageName, productId, purchaseToken);

    if (!verification.isValid) {
      return res.status(400).json({
        error: 'Google Play subscription purchase verification failed.',
        details: verification.error,
      });
    }

    // Determine plan type from product ID
    let planType: 'starter' | 'professional' | 'yearly' = 'starter';
    if (productId.includes('professional') || productId.includes('pro')) {
      planType = 'professional';
    } else if (productId.includes('yearly') || productId.includes('year')) {
      planType = 'yearly';
    }

    // Find or create user subscription
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      subscription = new Subscription({
        userId,
        status: 'active',
        planType,
        trialEndsAt: new Date(),
        currentPeriodStart: verification.currentPeriodStart,
        currentPeriodEnd: verification.currentPeriodEnd,
        googlePlayPurchaseToken: purchaseToken,
        googlePlayProductId: productId,
        autoRenewing: verification.autoRenewing,
      });
    } else {
      subscription.status = 'active';
      subscription.planType = planType;
      subscription.currentPeriodStart = verification.currentPeriodStart;
      subscription.currentPeriodEnd = verification.currentPeriodEnd;
      subscription.googlePlayPurchaseToken = purchaseToken;
      subscription.googlePlayProductId = productId;
      subscription.autoRenewing = verification.autoRenewing;
      subscription.gracePeriodEndsAt = undefined; // Clear grace period if active
    }

    await subscription.save();

    // Instant Reactivation of all user's paused QRs
    await QRCode.updateMany(
      { userId, status: 'paused' },
      { status: 'active' }
    );

    return res.status(200).json({
      message: 'Subscription successfully activated and verified.',
      subscription,
    });
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * SIMULATOR ENDPOINTS FOR TESTING BILLING LIFECYCLE
 */
export const simulateExpiry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Set end date to yesterday and status to expired
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    subscription.status = 'expired';
    subscription.currentPeriodEnd = yesterday;
    subscription.trialEndsAt = yesterday;
    await subscription.save();

    // Pause all dynamic QRs belonging to this user
    await QRCode.updateMany(
      { userId, type: 'dynamic', status: 'active' },
      { status: 'paused' }
    );

    // Trigger expired email notification via Resend
    await emailService.sendSubscriptionReminder(
      req.user!.email,
      req.user!.name,
      -1, // -1 triggers paused/expired copy
      subscription.planType
    );

    return res.status(200).json({
      message: 'Simulated expiry successfully. User QR codes paused, and notification email sent.',
      subscription,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const simulateGracePeriod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Set end date to yesterday and state to grace period
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const graceEnds = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 7 days from yesterday
    
    subscription.status = 'grace';
    subscription.currentPeriodEnd = yesterday;
    subscription.gracePeriodEndsAt = graceEnds;
    await subscription.save();

    // Trigger Grace email notification via Resend
    await emailService.sendSubscriptionReminder(
      req.user!.email,
      req.user!.name,
      0, // 0 triggers Grace Period copy
      subscription.planType
    );

    return res.status(200).json({
      message: 'Simulated grace period successfully. QR codes remain active. Notification email sent.',
      subscription,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const buyStaticCredit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { packageName, productId, purchaseToken } = req.body;

    const bypassMode = process.env.BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION === 'true';

    // In production: verify the real purchaseToken from Google Play before granting credit
    if (!bypassMode) {
      if (!purchaseToken || !productId || !packageName) {
        return res.status(400).json({
          error: 'packageName, productId, and purchaseToken are required for credit purchase.',
        });
      }

      const { billingService } = await import('../services/billingService');
      const result = await billingService.verifyOneTimeProduct(packageName, productId, purchaseToken);

      if (!result.isValid) {
        return res.status(402).json({
          error: result.error || 'Google Play could not verify this purchase. Credit not granted.',
        });
      }
    }

    // Grant 1 static credit
    user.staticCredits = (user.staticCredits ?? 0) + 1;
    await user.save();

    return res.status(200).json({
      message: 'Static QR Credit purchased successfully.',
      staticCredits: user.staticCredits,
    });
  } catch (error) {
    console.error('Error buying static credit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
