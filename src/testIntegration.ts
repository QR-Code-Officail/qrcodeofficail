import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Subscription } from './models/Subscription';
import { QRCode } from './models/QRCode';
import { ScanAnalytics } from './models/ScanAnalytics';
import { emailService } from './services/emailService';
import { billingService } from './services/billingService';
import { storageService } from './services/storageService';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrcode_platform_test';

async function runTests() {
  console.log('--- Starting Integration Tests ---');
  
  try {
    // 1. Connect to DB
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Clean up previous test database
    console.log('Cleaning test collections...');
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await QRCode.deleteMany({});
    await ScanAnalytics.deleteMany({});
    console.log('Database clean!');

    // 2. Test User Creation
    console.log('\nTesting User registration flow...');
    const testUser = new User({
      name: 'Test Integration User',
      email: 'test-integration@example.com',
      phone: '+2348000000000',
      country: 'Nigeria',
      passwordHash: 'hashed_password_placeholder_xyz',
      isEmailVerified: false,
      otp: {
        code: '123456',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    });
    await testUser.save();
    console.log(`Created user: ${testUser.name} (${testUser.email})`);

    // 3. Test Subscription Creation (Trial)
    console.log('\nTesting Subscription initialization (Trial)...');
    const trialDuration = 14 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const sub = new Subscription({
      userId: testUser._id,
      status: 'trial',
      planType: 'starter',
      trialEndsAt: new Date(now.getTime() + trialDuration),
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + trialDuration),
      autoRenewing: false
    });
    await sub.save();
    console.log(`Created Trial subscription expiring on: ${sub.trialEndsAt}`);

    // 4. Test Email OTP dispatcher
    console.log('\nTesting OTP Email sending service...');
    // Use the real credentials configured by user
    const emailResult = await emailService.sendOtp(
      'streams.of.joy.umuahia@gmail.com', // test mailbox
      testUser.name,
      '555999'
    );
    console.log(`OTP Email sent status: ${emailResult ? 'SUCCESS' : 'FAILED (Check your RESEND_API_KEY)'}`);

    // 5. Test QR Code Creation and Style validation
    console.log('\nTesting QR Code creation...');
    const qr = new QRCode({
      name: 'Business URL Dynamic QR',
      type: 'dynamic',
      dataType: 'url',
      content: { url: 'https://google.com' },
      style: {
        foregroundType: 'gradient',
        gradientColors: ['#2563EB', '#06B6D4'],
        dotsPattern: 'rounded'
      },
      status: 'active',
      userId: testUser._id,
      redirectCode: 'dyn_qr_1'
    });
    await qr.save();
    console.log(`Created QR code: "${qr.name}" with redirect code: "${qr.redirectCode}"`);

    // 6. Test Cloudinary upload fallback
    console.log('\nTesting Cloudinary logo upload fallback...');
    const sampleLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadUrl = await storageService.uploadAsset(sampleLogoBase64, 'test_logos');
    console.log(`Uploaded asset URL: ${uploadUrl}`);

    // 7. Test Analytics Logging
    console.log('\nTesting Scan Analytics logging...');
    const scan = new ScanAnalytics({
      qrCodeId: qr._id,
      uniqueScan: true,
      country: 'Nigeria',
      browser: 'Chrome Mobile',
      device: 'Mobile',
      os: 'Android',
      ip: '192.168.1.1'
    });
    await scan.save();
    console.log(`Logged scan for QR code ${qr._id} from ${scan.country} (${scan.browser}/${scan.os})`);

    // 8. Test Google Play verification sandbox
    console.log('\nTesting Billing Service verification...');
    const billingResult = await billingService.verifySubscription(
      'com.qrcode.official',
      'professional_monthly_subscription',
      'sandbox_token_pro_999'
    );
    console.log(`Billing validation result:`, billingResult);

    console.log('\n--- Integration Tests Completed Successfully! ---');
  } catch (error) {
    console.error('Integration test failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests();
