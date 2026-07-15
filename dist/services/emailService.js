"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'support@streamsofjoyumuahia.org';
const emailFromName = process.env.EMAIL_FROM_NAME || 'QR Code Official Platform';
// Initialize Resend client
const resend = resendApiKey ? new resend_1.Resend(resendApiKey) : null;
exports.emailService = {
    /**
     * Send OTP code for registration/verification
     */
    async sendOtp(toEmail, name, otpCode) {
        if (!resend) {
            console.warn('Resend API key is not configured. Email OTP code is:', otpCode);
            return true; // Return true to prevent blocking development flow
        }
        try {
            const subject = `Your Verification Code: ${otpCode}`;
            const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #2563EB; margin-bottom: 20px;">Welcome to QR Code Official, ${name}!</h2>
          <p style="font-size: 16px; color: #0F172A; line-height: 1.5;">To complete your registration and verify your email address, please use the following One-Time Password (OTP):</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #2563EB; background-color: #F8FAFC; padding: 12px 30px; border-radius: 6px; border: 1px dashed #cbd5e1;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This verification code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; text-align: center; color: #94a3b8;">&copy; 2026 QR Code Official. All rights reserved.</p>
        </div>
      `;
            const response = await resend.emails.send({
                from: `${emailFromName} <${emailFrom}>`,
                to: toEmail,
                subject,
                html: htmlContent,
            });
            if (response.error) {
                console.error('Failed to send OTP email via Resend:', response.error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error sending OTP email:', error);
            return false;
        }
    },
    /**
     * Send Subscription Reminders & Expired notifications
     */
    async sendSubscriptionReminder(toEmail, name, daysLeft, planName) {
        if (!resend) {
            console.warn(`Resend API key is not configured. Subscription reminder (${daysLeft} days left) would be sent to ${toEmail}`);
            return true;
        }
        try {
            let subject = '';
            let headline = '';
            let bodyText = '';
            let ctaText = 'Renew Subscription';
            if (daysLeft === 7) {
                subject = `Friendly Reminder: 7 Days Remaining on your ${planName} Plan`;
                headline = 'Keep Your QR Codes Active!';
                bodyText = `We want to let you know that your subscription to the <strong>${planName} Plan</strong> will renew or expire in 7 days. Ensure your billing details are up to date to prevent any disruption in your active dynamic QR codes.`;
            }
            else if (daysLeft === 3) {
                subject = `Important: 3 Days Left to Renew Your Subscription`;
                headline = 'Don\'t let your QR codes stop working!';
                bodyText = `Your <strong>${planName} Plan</strong> is expiring in 3 days. If it expires, you will enter a 7-day grace period, after which your dynamic QR codes will be paused and show an unavailable page to scanners. Action is required.`;
            }
            else if (daysLeft === 1) {
                subject = `Urgent: Your Subscription Expires Tomorrow`;
                headline = 'Last Day to Maintain Seamless QR Access!';
                bodyText = `This is your final notice. Your <strong>${planName} Plan</strong> expires tomorrow. Renew now to avoid entering the grace period and to keep your enterprise features active without interruptions.`;
            }
            else if (daysLeft === 0) {
                subject = `Your Subscription Has Expired - Grace Period Started`;
                headline = 'Grace Period: 7 Days to Reactivate';
                bodyText = `Your subscription has officially expired. You have entered a <strong>7-day Grace Period</strong>. During this time, your dynamic QR codes will remain active. However, at the end of the grace period, all your QR codes will be automatically paused until you renew.`;
                ctaText = 'Reactivate Plan';
            }
            else if (daysLeft < 0) {
                subject = `ACTION REQUIRED: Your QR Codes Have Been Paused`;
                headline = 'Your Dynamic QR Codes are Disabled';
                bodyText = `Your grace period has ended and your subscription is officially inactive. As a result, all of your dynamic QR codes have been <strong>Paused</strong> and now show a branded unavailable page to scanners. Renew immediately to instantly reactivate all your codes.`;
                ctaText = 'Renew and Reactivate Now';
            }
            const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #2563EB; margin-bottom: 20px;">${headline}</h2>
          <p style="font-size: 16px; color: #0F172A; line-height: 1.5;">Hi ${name},</p>
          <p style="font-size: 16px; color: #0F172A; line-height: 1.5;">${bodyText}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://qrcodeofficial.com/billing" style="display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; color: #ffffff; background-color: #2563EB; padding: 12px 30px; border-radius: 6px;">${ctaText}</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">Thank you for choosing QR Code Official. If you have any questions or require assistance, please reply to this email to reach our support team.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; text-align: center; color: #94a3b8;">&copy; 2026 QR Code Official. All rights reserved.</p>
        </div>
      `;
            const response = await resend.emails.send({
                from: `${emailFromName} <${emailFrom}>`,
                to: toEmail,
                subject,
                html: htmlContent,
            });
            if (response.error) {
                console.error(`Failed to send subscription reminder (${daysLeft} days) to ${toEmail} via Resend:`, response.error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error sending subscription email:', error);
            return false;
        }
    },
};
