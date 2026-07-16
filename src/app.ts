import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import qrRoutes from './routes/qrRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { redirectDynamicQR } from './controllers/analyticsController';

dotenv.config();

import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { QRCode } from './models/QRCode';
import { Subscription } from './models/Subscription';
import { ScanAnalytics } from './models/ScanAnalytics';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrcode_platform';

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // High limit to accommodate base64 image data strings for logo uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Privacy Policy & Data Safety Compliant HTML Page
app.get('/privacy', (req: Request, res: Response) => {
  const privacyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy & Data Safety | QR Code Official</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563EB;
      --primary-glow: rgba(37, 99, 235, 0.1);
      --secondary: #0F172A;
      --border: #E2E8F0;
      --text: #334155;
      --text-muted: #64748B;
      --bg: #F8FAFC;
      --card: #FFFFFF;
      --danger: #EF4444;
      --danger-bg: #FEF2F2;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    
    .navbar {
      background-color: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 20px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.5px;
    }
    
    .badge {
      background-color: var(--primary-glow);
      color: var(--primary);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid rgba(37,99,235,0.2);
    }
    
    .main-container {
      max-width: 800px;
      margin: 60px auto;
      padding: 0 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 50px;
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -1px;
      margin: 0 0 10px 0;
    }
    
    .header p {
      color: var(--text-muted);
      font-size: 16px;
      margin: 0;
    }
    
    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
      margin-bottom: 40px;
    }
    
    h2 {
      font-size: 22px;
      font-weight: 700;
      color: var(--secondary);
      border-bottom: 2px solid var(--bg);
      padding-bottom: 12px;
      margin-top: 36px;
      margin-bottom: 20px;
    }
    
    h2:first-of-type {
      margin-top: 0;
    }
    
    p, li {
      font-size: 15px;
      color: var(--text);
    }
    
    ul {
      padding-left: 20px;
      margin-bottom: 24px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    
    th, td {
      padding: 14px 18px;
      text-align: left;
      font-size: 14px;
    }
    
    th {
      background-color: var(--bg);
      font-weight: 600;
      color: var(--secondary);
    }
    
    td {
      border-top: 1px solid var(--border);
      background-color: var(--card);
    }
    
    .danger-card {
      background-color: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.15);
      border-radius: 16px;
      padding: 24px;
      margin: 32px 0;
    }
    
    .danger-card h3 {
      color: var(--danger);
      margin-top: 0;
      font-size: 18px;
      font-weight: 700;
    }
    
    .btn-mail {
      display: inline-block;
      background-color: var(--secondary);
      color: #FFFFFF;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
      transition: opacity 0.2s ease;
    }
    
    .btn-mail:hover {
      opacity: 0.9;
    }
    
    .footer {
      text-align: center;
      padding: 40px 0;
      border-top: 1px solid var(--border);
      margin-top: 60px;
      font-size: 13px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <div class="navbar">
    <div class="logo-container">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFHkaXyyj2j4bVafcVNKo8d5xEIbOQYKpAEw81VRzaA&s=10" alt="QR Code Official Logo" class="logo-img" />
      <span class="logo-text">QR Code Official</span>
    </div>
    <span class="badge">Google Play Compliant</span>
  </div>

  <div class="main-container">
    <div class="header">
      <h1>Privacy Policy & Data Safety</h1>
      <p>Effective Date: July 16, 2026</p>
    </div>

    <div class="card">
      <h2>1. Overview</h2>
      <p>
        At <strong>QR Code Official</strong>, we value your privacy and are committed to protecting your personal information. This Privacy Policy details the types of data we collect, how it is secured, and the choices you have regarding your personal information. This document is fully compliant with the Google Play Developer Program policies.
      </p>

      <h2>2. Data Collection & Usage</h2>
      <p>
        We collect a limited set of personal information solely to establish your account, authenticate login sessions, and track the analytics of the QR codes you generate. We do not sell or lease your data to third parties.
      </p>

      <table>
        <thead>
          <tr>
            <th>Data Collected</th>
            <th>Purpose</th>
            <th>Type of Collection</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Name</strong></td>
            <td>To personalize your experience and account credentials.</td>
            <td>Mandatory during Sign Up</td>
          </tr>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>For account identity, login credentials, and sending security verification OTP codes.</td>
            <td>Mandatory during Sign Up</td>
          </tr>
          <tr>
            <td><strong>Scan Logs</strong></td>
            <td>To provide you with analytics charts showing scanned countries, browsers, operating systems, and timestamp tracing.</td>
            <td>Automatically logged upon code scans</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Data Encryption & Transit Security</h2>
      <p>
        All user data collected through the QR Code Official app is **encrypted in transit** using industry-standard secure transfer protocols (HTTPS over SSL/TLS). Your passwords are encrypted on our servers using secure one-way cryptographic hashing algorithms.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your personal data and generated assets as long as your account is active. In the event of account closure, your records are deleted from our primary servers as detailed below.
      </p>

      <div class="danger-card">
        <h3>🗑️ Right to Data Deletion</h3>
        <p>
          You have the absolute right to request the deletion of your account and all associated data at any time. Upon deletion:
        </p>
        <ul>
          <li>Your name, email address, and account details are permanently purged.</li>
          <li>All your generated QR codes are disabled and deleted.</li>
          <li>All scan analytics records associated with your codes are completely wiped.</li>
        </ul>
        <p>To submit an automated data deletion request, click the button below to reach our developer helpdesk:</p>
        <a href="mailto:support@streamsofjoyumuahia.org?subject=QR%20Code%20Official%20-%20Request%20Data%20Deletion" class="btn-mail">Request Data Deletion</a>
      </div>

      <h2>5. Children's Privacy</h2>
      <p>
        This service does not address anyone under the age of 13. We do not knowingly collect personal identifiable information from children. If we discover a child under 13 has provided us with personal information, we immediately delete it.
      </p>

      <h2>6. Changes to This Privacy Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
    </div>

    <div class="card" style="text-align: center; padding: 30px; border: 1.5px dashed var(--danger);">
      <h2 style="color: var(--danger); border-bottom: none; margin-top: 0;">🗑&nbsp;Account Deletion Portal</h2>
      <p>To permanently delete your QR Code Official account, please verify your credentials below:</p>
      <form action="/delete-account" method="POST" style="max-width: 420px; margin: 20px auto; text-align: left;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--secondary);">Email Address</label>
          <input type="email" name="email" placeholder="you@example.com" required style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit;" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--secondary);">Account Password</label>
          <input type="password" name="password" placeholder="••••••••" required style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit;" />
        </div>
        <button type="submit" style="width: 100%; background-color: var(--danger); color: white; border: none; border-radius: 10px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">Permanently Delete Account</button>
      </form>
    </div>

    <div class="footer">
      <p>&copy; 2026 QR Code Official Inc. All rights reserved.</p>
    </div>
  </div>

</body>
</html>
  `;
  res.status(200).send(privacyHtml);
});

// Helper: Delete Account HTML layout
function getDeleteAccountHTML(error?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delete Account | QR Code Official</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563EB;
      --primary-glow: rgba(37, 99, 235, 0.1);
      --secondary: #0F172A;
      --border: #E2E8F0;
      --text: #334155;
      --text-muted: #64748B;
      --bg: #F8FAFC;
      --card: #FFFFFF;
      --danger: #EF4444;
      --danger-bg: #FEF2F2;
    }
    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .navbar {
      background-color: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 20px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.5px;
    }
    .main-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
      box-sizing: border-box;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.5px;
      margin: 0 0 12px 0;
      text-align: center;
    }
    p {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px 0;
      text-align: center;
    }
    .alert-danger {
      background-color: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #B91C1C;
      font-size: 13px;
      font-weight: 600;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--secondary);
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      margin-bottom: 16px;
    }
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .warning-box {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #92400E;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    button {
      width: 100%;
      background-color: var(--danger);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
    button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="navbar">
    <div class="logo-container">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFHkaXyyj2j4bVafcVNKo8d5xEIbOQYKpAEw81VRzaA&s=10" alt="QR Code Official Logo" class="logo-img" />
      <span class="logo-text">QR Code Official</span>
    </div>
  </div>
  <div class="main-container">
    <div class="card">
      <h1>Delete Account</h1>
      <p>Permanently erase your identity, custom dynamic vectors, and QR code tracking analytics logs.</p>
      
      ${error ? `<div class="alert-danger">${error}</div>` : ''}

      <form action="/delete-account" method="POST">
        <label>Email Address</label>
        <input type="email" name="email" placeholder="you@example.com" required />
        
        <label>Account Password</label>
        <input type="password" name="password" placeholder="••••••••" required />

        <div class="warning-box">
          ⚠️ <strong>WARNING:</strong> This action is permanent and cannot be undone. All your QR codes will stop redirecting immediately and your subscription tier will be canceled.
        </div>

        <button type="submit">Permanently Delete My Account</button>
      </form>
    </div>
  </div>
  <div class="footer">
    <p>&copy; 2026 QR Code Official. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

// Helper: Delete Success HTML layout
function getDeleteAccountSuccessHTML(email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted | QR Code Official</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #10B981;
      --primary-glow: rgba(16, 185, 129, 0.1);
      --secondary: #0F172A;
      --border: #E2E8F0;
      --text: #334155;
      --bg: #F8FAFC;
      --card: #FFFFFF;
    }
    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
    }
    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
      text-align: center;
      box-sizing: border-box;
    }
    .check-badge {
      width: 64px;
      height: 64px;
      background-color: var(--primary-glow);
      color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px auto;
      border: 1.5px solid rgba(16, 185, 129, 0.2);
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: var(--secondary);
      margin: 0 0 12px 0;
    }
    p {
      color: var(--text);
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .email-badge {
      display: inline-block;
      background-color: #F1F5F9;
      color: var(--secondary);
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="check-badge">✓</div>
    <h1>Account Deleted</h1>
    <p>Your user registration credentials, custom dynamically traced QR codes, and tracking statistics for <br/><span class="email-badge">${email}</span><br/> have been successfully and permanently deleted from our database server.</p>
    <p style="color: #64748B; font-size: 12px;">Thank you for using QR Code Official. You may close this tab now.</p>
  </div>
</body>
</html>
  `;
}

// Dedicated Data Deletion GET endpoint
app.get('/delete-account', (req: Request, res: Response) => {
  res.status(200).send(getDeleteAccountHTML());
});

// Dedicated Data Deletion POST execution handler
app.post('/delete-account', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send(getDeleteAccountHTML('Email and password fields are mandatory.'));
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).send(getDeleteAccountHTML('Invalid email or password credentials.'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).send(getDeleteAccountHTML('Invalid email or password credentials.'));
    }

    // 1. Fetch QR codes to purge analytics
    const qrCodes = await QRCode.find({ userId: user._id });
    const qrIds = qrCodes.map(q => q._id);

    // 2. Perform deletion cascades
    await ScanAnalytics.deleteMany({ qrCodeId: { $in: qrIds } });
    await QRCode.deleteMany({ userId: user._id });
    await Subscription.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    return res.status(200).send(getDeleteAccountSuccessHTML(email.toLowerCase()));
  } catch (err: any) {
    console.error('Account deletion execution error:', err);
    return res.status(500).send(getDeleteAccountHTML('An internal server error occurred. Please try again.'));
  }
});

// Dynamic QR redirect endpoint (Short URI format)
app.get('/r/:redirectCode', redirectDynamicQR);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.',
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB database successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running in development mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection failure:', err);
    process.exit(1);
  });

export default app;
