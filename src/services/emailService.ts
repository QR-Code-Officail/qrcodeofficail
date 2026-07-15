import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'support@streamsofjoyumuahia.org';
const emailFromName = process.env.EMAIL_FROM_NAME || 'QR Code Official Platform Verification Services Office and Security Division - Direct Activation Desk';

// Initialize Resend client
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const emailService = {
  /**
   * Send OTP code for registration/verification
   */
  async sendOtp(toEmail: string, name: string, otpCode: string): Promise<boolean> {
    if (!resend) {
      console.warn('Resend API key is not configured. Email OTP code is:', otpCode);
      return true; // Return true to prevent blocking development flow
    }

    try {
      const subject = `Your Verification Code: ${otpCode}`;
      const htmlContent = `
        <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #FFF; line-height: 1px;">
          Secure One-Time Password (OTP) validation key for your QR Code Official activation: ${otpCode}. Dispatched securely by the system admin.
        </div>
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 40px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0; text-align: left; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://i.imgur.com/83pD4bJ.png" alt="QR Code Official Logo" style="width: 72px; height: 72px; margin-bottom: 12px; border-radius: 16px;" />
              <h2 style="color: #0F172A; font-size: 24px; font-weight: bold; margin: 0;">QR Code Official</h2>
              <p style="color: #64748B; font-size: 14px; margin: 4px 0 0 0;">Secure Identity Verification</p>
            </div>
            
            <h3 style="color: #0F172A; font-size: 18px; margin-top: 0; margin-bottom: 16px;">Confirm your registration, ${name}!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Welcome to the future of dynamic vector styling and analytics tracing. To complete your account verification and activate your Free Trial tier, please use the 6-digit One-Time Password (OTP) generated below:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <span style="display: inline-block; font-size: 38px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #2563EB; background-color: #F1F5F9; padding: 16px 36px; border-radius: 12px; border: 1px solid #E2E8F0; min-width: 180px;">${otpCode}</span>
            </div>
            
            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 32px;">
              This validation window is valid for <strong>15 minutes</strong> for security compliance. If you did not request this account activation, no further action is required.
            </p>
            
            <div style="border-top: 1px solid #F1F5F9; padding-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Security Disclosure</p>
              This is an automated security transmission dispatched from the QR Code Official Platform Security Division. All credentials and validation sequences are processed using end-to-end sandbox protection protocols. Information contained herein is confidential.
              <p style="margin: 16px 0 0 0; text-align: center; font-size: 10px;">&copy; 2026 QR Code Official Inc. All rights reserved.</p>
            </div>
          </div>
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
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  },

  /**
   * Send Subscription Reminders & Expired notifications
   */
  async sendSubscriptionReminder(
    toEmail: string,
    name: string,
    daysLeft: number,
    planName: string
  ): Promise<boolean> {
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
      } else if (daysLeft === 3) {
        subject = `Important: 3 Days Left to Renew Your Subscription`;
        headline = 'Don\'t let your QR codes stop working!';
        bodyText = `Your <strong>${planName} Plan</strong> is expiring in 3 days. If it expires, you will enter a 7-day grace period, after which your dynamic QR codes will be paused and show an unavailable page to scanners. Action is required.`;
      } else if (daysLeft === 1) {
        subject = `Urgent: Your Subscription Expires Tomorrow`;
        headline = 'Last Day to Maintain Seamless QR Access!';
        bodyText = `This is your final notice. Your <strong>${planName} Plan</strong> expires tomorrow. Renew now to avoid entering the grace period and to keep your enterprise features active without interruptions.`;
      } else if (daysLeft === 0) {
        subject = `Your Subscription Has Expired - Grace Period Started`;
        headline = 'Grace Period: 7 Days to Reactivate';
        bodyText = `Your subscription has officially expired. You have entered a <strong>7-day Grace Period</strong>. During this time, your dynamic QR codes will remain active. However, at the end of the grace period, all your QR codes will be automatically paused until you renew.`;
        ctaText = 'Reactivate Plan';
      } else if (daysLeft < 0) {
        subject = `ACTION REQUIRED: Your QR Codes Have Been Paused`;
        headline = 'Your Dynamic QR Codes are Disabled';
        bodyText = `Your grace period has ended and your subscription is officially inactive. As a result, all of your dynamic QR codes have been <strong>Paused</strong> and now show a branded unavailable page to scanners. Renew immediately to instantly reactivate all your codes.`;
        ctaText = 'Renew and Reactivate Now';
      }

      const htmlContent = `
        <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #FFF; line-height: 1px;">
          Important subscription updates regarding your QR Code Official active account status.
        </div>
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 40px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0; text-align: left; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://i.imgur.com/83pD4bJ.png" alt="QR Code Official Logo" style="width: 72px; height: 72px; margin-bottom: 12px; border-radius: 16px;" />
              <h2 style="color: #0F172A; font-size: 24px; font-weight: bold; margin: 0;">QR Code Official</h2>
              <p style="color: #64748B; font-size: 14px; margin: 4px 0 0 0;">Billing & Subscriptions</p>
            </div>
            
            <h3 style="color: #0F172A; font-size: 18px; margin-top: 0; margin-bottom: 16px;">${headline}</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">Hi ${name},</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${bodyText}</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://wa.me/2349168033116" style="display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; color: #ffffff; background-color: #2563EB; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);">${ctaText}</a>
            </div>
            
            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 32px;">
              Thank you for choosing QR Code Official. If you have any inquiries regarding your subscription details, please reply directly to this mail to contact our billing support desk.
            </p>
            
            <div style="border-top: 1px solid #F1F5F9; padding-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Security & Compliance Disclosure</p>
              This is an automated subscription tracking message dispatched from the QR Code Official Platform Billing System. All transactions are logged securely and processed using sandbox verified tokens.
              <p style="margin: 16px 0 0 0; text-align: center; font-size: 10px;">&copy; 2026 QR Code Official Inc. All rights reserved.</p>
            </div>
          </div>
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
    } catch (error) {
      console.error('Error sending subscription email:', error);
      return false;
    }
  },
};
