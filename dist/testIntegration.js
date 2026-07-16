"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./models/User");
const Subscription_1 = require("./models/Subscription");
const QRCode_1 = require("./models/QRCode");
const ScanAnalytics_1 = require("./models/ScanAnalytics");
const emailService_1 = require("./services/emailService");
const billingService_1 = require("./services/billingService");
const storageService_1 = require("./services/storageService");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrcode_platform_test';
async function runTests() {
    console.log('--- Starting Integration Tests ---');
    try {
        // 1. Connect to DB
        console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected!');
        // Clean up previous test database
        console.log('Cleaning test collections...');
        await User_1.User.deleteMany({});
        await Subscription_1.Subscription.deleteMany({});
        await QRCode_1.QRCode.deleteMany({});
        await ScanAnalytics_1.ScanAnalytics.deleteMany({});
        console.log('Database clean!');
        // 2. Test User Creation
        console.log('\nTesting User registration flow...');
        const testUser = new User_1.User({
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
        const sub = new Subscription_1.Subscription({
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
        const emailResult = await emailService_1.emailService.sendOtp('streams.of.joy.umuahia@gmail.com', // test mailbox
        testUser.name, '555999');
        console.log(`OTP Email sent status: ${emailResult ? 'SUCCESS' : 'FAILED (Check your RESEND_API_KEY)'}`);
        // 5. Test QR Code Creation and Style validation
        console.log('\nTesting QR Code creation...');
        const qr = new QRCode_1.QRCode({
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
        const uploadUrl = await storageService_1.storageService.uploadAsset(sampleLogoBase64, 'test_logos');
        console.log(`Uploaded asset URL: ${uploadUrl}`);
        // 7. Test Analytics Logging
        console.log('\nTesting Scan Analytics logging...');
        const scan = new ScanAnalytics_1.ScanAnalytics({
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
        const billingResult = await billingService_1.billingService.verifySubscription('com.qrcodeofficial.mobile', 'professional_monthly_subscription', 'sandbox_token_pro_999');
        console.log(`Billing validation result:`, billingResult);
        console.log('\n--- Integration Tests Completed Successfully! ---');
    }
    catch (error) {
        console.error('Integration test failed with error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}
runTests();
