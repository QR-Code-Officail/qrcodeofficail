"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQRCodeAnalytics = exports.redirectDynamicQR = void 0;
const QRCode_1 = require("../models/QRCode");
const ScanAnalytics_1 = require("../models/ScanAnalytics");
const Subscription_1 = require("../models/Subscription");
// Simple user agent parser to keep backend lightweight
const parseUserAgent = (uaString = '') => {
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    let device = 'Desktop';
    // OS Detection
    if (/windows/i.test(uaString))
        os = 'Windows';
    else if (/macintosh|mac os x/i.test(uaString) && !/like mac os x/i.test(uaString))
        os = 'macOS';
    else if (/android/i.test(uaString))
        os = 'Android';
    else if (/iphone|ipad|ipod/i.test(uaString))
        os = 'iOS';
    else if (/linux/i.test(uaString))
        os = 'Linux';
    // Device Detection
    if (/mobile/i.test(uaString))
        device = 'Mobile';
    if (/ipad|tablet/i.test(uaString))
        device = 'Tablet';
    // Browser Detection
    if (/chrome|crios/i.test(uaString) && !/edge|edg/i.test(uaString))
        browser = 'Chrome';
    else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString))
        browser = 'Safari';
    else if (/firefox|fxios/i.test(uaString))
        browser = 'Firefox';
    else if (/edge|edg/i.test(uaString))
        browser = 'Edge';
    else if (/opera|opr/i.test(uaString))
        browser = 'Opera';
    return { os, browser, device };
};
/**
 * Handle dynamic QR code redirection and analytics logging
 */
const redirectDynamicQR = async (req, res) => {
    try {
        const { redirectCode } = req.params;
        const qrCode = await QRCode_1.QRCode.findOne({ redirectCode, status: { $ne: 'deleted' } });
        if (!qrCode) {
            return res.status(404).send(getUnavailableHTML('QR Code Not Found', 'This QR Code does not exist or has been deleted.'));
        }
        // Check owner's subscription status
        const subscription = await Subscription_1.Subscription.findOne({ userId: qrCode.userId });
        // If QR code is manually paused OR if the subscription is paused/expired, show unavailable page
        if (qrCode.status === 'paused') {
            return res.status(403).send(getUnavailableHTML('QR Code Paused', 'This QR Code has been temporarily paused by its owner.', 'Owner Paused'));
        }
        if (subscription && (subscription.status === 'expired' || subscription.status === 'paused')) {
            // Update QR Code status to paused as well
            qrCode.status = 'paused';
            await qrCode.save();
            return res.status(403).send(getUnavailableHTML('Subscription Inactive', 'The subscription associated with this QR Code has expired or is paused. If you are the owner, please renew your subscription to reactivate it.', 'Subscription Expired'));
        }
        // Parse scan source info
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const ua = req.headers['user-agent'] || '';
        const { os, browser, device } = parseUserAgent(ua);
        // Simplistic geo country lookup (mocked or headers)
        const country = req.headers['cf-ipcountry'] || 'Nigeria'; // default fallback for testing
        // Check unique scan within last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentScan = await ScanAnalytics_1.ScanAnalytics.findOne({
            qrCodeId: qrCode._id,
            ip,
            scannedAt: { $gte: oneDayAgo },
        });
        const uniqueScan = !recentScan;
        // Log scan analytics asynchronously
        const analytics = new ScanAnalytics_1.ScanAnalytics({
            qrCodeId: qrCode._id,
            uniqueScan,
            country,
            browser,
            device,
            os,
            ip,
        });
        analytics.save().catch((err) => console.error('Error saving analytics async:', err));
        // Redirect to destination URL
        // Get redirect URL from content
        let redirectUrl = qrCode.content.url || qrCode.content.text || '';
        // If it's a protocol link (email, sms, call, etc) format correctly
        if (qrCode.dataType === 'email') {
            redirectUrl = `mailto:${qrCode.content.email}?subject=${encodeURIComponent(qrCode.content.subject || '')}&body=${encodeURIComponent(qrCode.content.body || '')}`;
        }
        else if (qrCode.dataType === 'sms') {
            redirectUrl = `sms:${qrCode.content.phone}?body=${encodeURIComponent(qrCode.content.message || '')}`;
        }
        else if (qrCode.dataType === 'phone') {
            redirectUrl = `tel:${qrCode.content.phone}`;
        }
        else if (qrCode.dataType === 'wifi') {
            // WiFi configs can't easily redirect standard browser, so we show page details
            return res.status(200).send(getWiFiInstructionHTML(qrCode.content.ssid, qrCode.content.password, qrCode.content.encryption));
        }
        if (!redirectUrl.match(/^[a-zA-Z]+:\/\//) && qrCode.dataType === 'url') {
            redirectUrl = 'https://' + redirectUrl;
        }
        return res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('Redirection error:', error);
        return res.status(500).send(getUnavailableHTML('System Error', 'An unexpected error occurred. Please try again.'));
    }
};
exports.redirectDynamicQR = redirectDynamicQR;
/**
 * Get analytics dashboard for a specific QR Code
 */
const getQRCodeAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        // Verify ownership
        const qrCode = await QRCode_1.QRCode.findOne({ _id: id, userId });
        if (!qrCode) {
            return res.status(404).json({ error: 'QR Code not found.' });
        }
        // Retrieve analytics records
        const scans = await ScanAnalytics_1.ScanAnalytics.find({ qrCodeId: qrCode._id }).sort({ scannedAt: 1 });
        const totalScans = scans.length;
        const uniqueScans = scans.filter((s) => s.uniqueScan).length;
        // Aggregates
        const countryData = {};
        const browserData = {};
        const deviceData = {};
        const osData = {};
        const dailyScans = {};
        scans.forEach((scan) => {
            // Country
            countryData[scan.country] = (countryData[scan.country] || 0) + 1;
            // Browser
            browserData[scan.browser] = (browserData[scan.browser] || 0) + 1;
            // Device
            deviceData[scan.device] = (deviceData[scan.device] || 0) + 1;
            // OS
            osData[scan.os] = (osData[scan.os] || 0) + 1;
            // Daily chart (YYYY-MM-DD)
            const day = scan.scannedAt.toISOString().split('T')[0];
            dailyScans[day] = (dailyScans[day] || 0) + 1;
        });
        return res.status(200).json({
            qrCode: {
                id: qrCode._id,
                name: qrCode.name,
                type: qrCode.type,
                dataType: qrCode.dataType,
            },
            summary: {
                totalScans,
                uniqueScans,
            },
            charts: {
                country: countryData,
                browser: browserData,
                device: deviceData,
                os: osData,
                timeline: dailyScans,
            },
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getQRCodeAnalytics = getQRCodeAnalytics;
/**
 * Beautiful Glassmorphic HTML Unavailable page
 */
const getUnavailableHTML = (title, message, reasonCode) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} | QR Code Official</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #311042 100%);
          color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          animation: fadeIn 0.8s ease-out;
        }
        .icon {
          font-size: 64px;
          background: linear-gradient(135deg, #2563EB, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 24px;
          display: inline-block;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 16px;
          background: linear-gradient(to right, #FFFFFF, #E2E8F0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #94A3B8;
          margin-bottom: 30px;
        }
        .badge {
          display: inline-block;
          padding: 6px 12px;
          background: rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(37, 99, 235, 0.3);
          color: #38BDF8;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #475569;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="icon">✨</span>
        <h1>${title}</h1>
        <p>${message}</p>
        ${reasonCode ? `<span class="badge">${reasonCode}</span>` : ''}
        <div class="footer">
          Powered by QR Code Official Platform
        </div>
      </div>
    </body>
    </html>
  `;
};
/**
 * Beautiful HTML WiFi connection details page
 */
const getWiFiInstructionHTML = (ssid, pass = '', encryption = 'WPA') => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connect to Wi-Fi | QR Code Official</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #0F172A 0%, #0284C7 100%);
          color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 24px;
        }
        .wifi-details {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label {
          color: #94A3B8;
          font-size: 14px;
        }
        .value {
          font-weight: 600;
          color: #F1F5F9;
        }
        .copy-btn {
          background: #38BDF8;
          color: #0F172A;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 10px;
        }
        .copy-btn:hover {
          background: #7DD3FC;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #38BDF8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Wi-Fi Network Configuration</h1>
        <p style="color: #BAE6FD; margin-bottom: 20px;">Use the credentials below to connect to the Wi-Fi network.</p>
        <div class="wifi-details">
          <div class="detail-row">
            <span class="label">Network Name (SSID)</span>
            <span class="value">${ssid}</span>
          </div>
          ${pass ? `
          <div class="detail-row">
            <span class="label">Password</span>
            <span class="value">${pass}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="label">Security Type</span>
            <span class="value">${encryption}</span>
          </div>
        </div>
        ${pass ? `<button class="copy-btn" onclick="navigator.clipboard.writeText('${pass}'); alert('Password copied to clipboard!')">Copy Password</button>` : ''}
        <div class="footer">
          Generated by QR Code Official
        </div>
      </div>
    </body>
    </html>
  `;
};
