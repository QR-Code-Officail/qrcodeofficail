"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.resendOtp = exports.login = exports.verifyOtp = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const emailService_1 = require("../services/emailService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'qr_code_platform_jwt_secret_key_2026_xyz';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'qr_code_platform_jwt_refresh_secret_key_2026_xyz';
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
const register = async (req, res) => {
    try {
        const { name, email, phone, country, password } = req.body;
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            if (existingUser.isEmailVerified) {
                return res.status(400).json({ error: 'An account with this email address already exists.' });
            }
            // If the user exists but is not verified, regenerate OTP and resend
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            existingUser.otp = {
                code: otpCode,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            };
            // Update fields if changed
            existingUser.name = name;
            existingUser.phone = phone;
            existingUser.country = country;
            existingUser.passwordHash = await bcryptjs_1.default.hash(password, 10);
            await existingUser.save();
            const emailSent = await emailService_1.emailService.sendOtp(existingUser.email, existingUser.name, otpCode);
            if (!emailSent) {
                return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
            }
            return res.status(200).json({
                message: 'Account already registered but not verified. A new verification OTP has been sent.',
                email: existingUser.email,
                isEmailVerified: false,
            });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Generate 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Create user in draft/unverified state
        const user = new User_1.User({
            name,
            email: email.toLowerCase(),
            phone,
            country,
            passwordHash,
            isEmailVerified: false,
            otp: {
                code: otpCode,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            },
        });
        await user.save();
        // Create a subscription plan for trial (starts in inactive/trial status, activated on OTP verification)
        const trialDuration = 14 * 24 * 60 * 60 * 1000; // 14 days free
        const now = new Date();
        const subscription = new Subscription_1.Subscription({
            userId: user._id,
            status: 'trial',
            planType: 'starter', // Trial starts on Starter features
            trialEndsAt: new Date(now.getTime() + trialDuration),
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + trialDuration),
            autoRenewing: false,
        });
        await subscription.save();
        // Send OTP email
        const emailSent = await emailService_1.emailService.sendOtp(user.email, user.name, otpCode);
        if (!emailSent) {
            // In development, keep user but return warning
            return res.status(201).json({
                message: 'User registered, but failed to send verification email. Please request a resend.',
                email: user.email,
                isEmailVerified: false,
            });
        }
        return res.status(201).json({
            message: 'Registration successful. A verification OTP has been sent to your email.',
            email: user.email,
            isEmailVerified: false,
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
exports.register = register;
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User account not found.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email address is already verified.' });
        }
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ error: 'No active OTP verification request found.' });
        }
        // Check expiration
        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
        }
        // Check match
        if (user.otp.code !== otp) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }
        // Verify user
        user.isEmailVerified = true;
        user.otp = undefined; // Clear OTP fields
        await user.save();
        // Update subscription start dates to run from verification time
        const subscription = await Subscription_1.Subscription.findOne({ userId: user._id });
        if (subscription) {
            const trialDuration = 14 * 24 * 60 * 60 * 1000;
            const now = new Date();
            subscription.trialEndsAt = new Date(now.getTime() + trialDuration);
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = new Date(now.getTime() + trialDuration);
            subscription.status = 'trial';
            await subscription.save();
        }
        // Generate login tokens
        const tokens = generateTokens(user._id.toString());
        return res.status(200).json({
            message: 'Email address successfully verified.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyOtp = verifyOtp;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email address or password.' });
        }
        // Compare passwords
        const isPasswordMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email address or password.' });
        }
        // Check if verified
        if (!user.isEmailVerified) {
            // Regenerate OTP code and email it
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = {
                code: otpCode,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
            await user.save();
            await emailService_1.emailService.sendOtp(user.email, user.name, otpCode);
            return res.status(403).json({
                error: 'Email verification is required. A new OTP has been sent.',
                code: 'EMAIL_UNVERIFIED',
                email: user.email,
            });
        }
        // Generate tokens
        const tokens = generateTokens(user._id.toString());
        return res.status(200).json({
            message: 'Login successful.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email address is required.' });
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User account not found.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email address is already verified.' });
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = {
            code: otpCode,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
        await user.save();
        await emailService_1.emailService.sendOtp(user.email, user.name, otpCode);
        return res.status(200).json({ message: 'A verification OTP has been resent to your email.' });
    }
    catch (error) {
        console.error('Error resending OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.resendOtp = resendOtp;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required.' });
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token.' });
        }
        const tokens = generateTokens(user._id.toString());
        return res.status(200).json(tokens);
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({ error: 'Refresh token has expired or is invalid.' });
    }
};
exports.refreshToken = refreshToken;
