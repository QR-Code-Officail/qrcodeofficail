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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFCFD; padding: 60px 10px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; padding: 48px; border: 1px solid #E6E8EB; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03); text-align: left;">
            
            <!-- Brand Header -->
            <div style="border-bottom: 1px solid #F0F2F5; padding-bottom: 24px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 48px;">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFHkaXyyj2j4bVafcVNKo8d5xEIbOQYKpAEw81VRzaA&s=10" alt="QR Code Official Logo" style="width: 42px; height: 42px; border-radius: 10px; display: block;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 14px;">
                    <span style="font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; display: block;">QR Code Official</span>
                    <span style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Security Division</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Heading & Body -->
            <h1 style="color: #0F172A; font-size: 22px; font-weight: 700; letter-spacing: -0.4px; margin: 0 0 16px 0;">Verify your email address</h1>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
              Hello ${name},<br />
              Thank you for registering. Please enter the following 6-digit verification code to complete your security registration and unlock your dynamic vectors:
            </p>

            <!-- Code Block (Premium Dark Slate Card) -->
            <div style="background-color: #0F172A; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #38BDF8; letter-spacing: 12px; padding-left: 12px; display: inline-block;">${otpCode}</span>
            </div>

            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin: 0 0 32px 0;">
              This code will expire in <strong>15 minutes</strong> for security compliance. If you did not initiate this activation request, please disregard this email.
            </p>

            <!-- Security Footer -->
            <div style="border-top: 1px solid #F0F2F5; padding-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Security Compliance Notice</p>
              This is an automated transmission processed using high-security sandbox algorithms. The security verification department regulates this pipeline. Do not reply directly.
              <p style="margin: 20px 0 0 0; text-align: center; font-size: 10px;">&copy; 2026 QR Code Official Inc. All rights reserved.</p>
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFCFD; padding: 60px 10px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; padding: 48px; border: 1px solid #E6E8EB; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03); text-align: left;">
            
            <!-- Brand Header -->
            <div style="border-bottom: 1px solid #F0F2F5; padding-bottom: 24px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 48px;">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFHkaXyyj2j4bVafcVNKo8d5xEIbOQYKpAEw81VRzaA&s=10" alt="QR Code Official Logo" style="width: 42px; height: 42px; border-radius: 10px; display: block;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 14px;">
                    <span style="font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; display: block;">QR Code Official</span>
                    <span style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Billing Department</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Heading & Body -->
            <h1 style="color: #0F172A; font-size: 22px; font-weight: 700; letter-spacing: -0.4px; margin: 0 0 16px 0;">${headline}</h1>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Hi ${name},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">${bodyText}</p>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://wa.me/2349168033116" style="display: inline-block; font-size: 15px; font-weight: 700; text-decoration: none; color: #FFFFFF; background-color: #2563EB; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">${ctaText}</a>
            </div>

            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin: 0 0 32px 0;">
              Thank you for being a valued part of our platform. If you have any inquiries regarding your billing status, please click the button above or contact our billing support desk.
            </p>

            <!-- Security Footer -->
            <div style="border-top: 1px solid #F0F2F5; padding-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Account Management Notice</p>
              This is an automated subscription transaction transmission regulated by the QR Code Official Billing System.
              <p style="margin: 20px 0 0 0; text-align: center; font-size: 10px;">&copy; 2026 QR Code Official Inc. All rights reserved.</p>
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
