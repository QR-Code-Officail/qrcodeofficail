# QR Code Official Platform Backend Service

An enterprise-grade, lightweight Node.js/TypeScript backend API for generating, managing, styling, and tracking QR Codes, integrated with User Authentication (OTP via Resend), Cloud Storage (Cloudinary), and Subscription billing (Google Play verification).

---

## Technical Stack
- **Node.js** with **Express** & **TypeScript**
- **MongoDB** via **Mongoose**
- **JWT** (Access Tokens & Refresh Tokens)
- **Resend** (OTP & Subscription reminder mailers)
- **Cloudinary** (Upload logo image assets)
- **Zod** (Input validation)

---

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v18.x or v20.x recommended)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or MongoDB Atlas URI)

### 2. Install Dependencies
Navigate into the `backend/` directory and install node modules:
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the `backend/` directory:
```bash
cp .env.example .env
```

#### Detailed Environment Variable Description

Every environment variable configuration must be set up properly in `.env`:

| Key | Purpose | How to Obtain / Configure | Location to Place |
|---|---|---|---|
| `PORT` | Defines the local server listening port. Default is `5000`. | Any free port number on your system. | Set as `PORT=5000` in the `backend/.env` file. |
| `MONGODB_URI` | MongoDB database connection URI. | For local testing, use `mongodb://localhost:27017/qrcode_platform`. For Atlas, retrieve the connection string from your MongoDB Cloud dashboard. | Set as `MONGODB_URI=your_mongodb_connection_uri` in `backend/.env`. |
| `JWT_SECRET` | Secret key used to sign session tokens. | Generate a secure, random string (e.g. via `openssl rand -hex 32` or arbitrary alphanumeric key). | Set as `JWT_SECRET=your_jwt_access_secret_key` in `backend/.env`. |
| `JWT_REFRESH_SECRET` | Secret key used to sign renewal tokens. | Generate a secure, random string (different from `JWT_SECRET`). | Set as `JWT_REFRESH_SECRET=your_jwt_refresh_secret_key` in `backend/.env`. |
| `RESEND_API_KEY` | Resend API credential to send transactional emails. | Register at [Resend](https://resend.com), create an API Key under the Developer tab. | Set as `RESEND_API_KEY=re_yourApiKeyHere` in `backend/.env`. |
| `EMAIL_FROM` | Sender email address for OTPs and notifications. | Verify your domain name in Resend dashboard, then use a mailbox under that domain (e.g. `support@yourdomain.com`). | Set as `EMAIL_FROM=support@yourdomain.com` in `backend/.env`. |
| `EMAIL_FROM_NAME` | Display name of email sender. | Choose a branding name or marketing tag. | Set as `EMAIL_FROM_NAME=Your Platform Name` in `backend/.env`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary identification namespace. | Register at [Cloudinary](https://cloudinary.com). Copy from the Account Details block on the console dashboard. | Set as `CLOUDINARY_CLOUD_NAME=your_cloud_name` in `backend/.env`. |
| `CLOUDINARY_API_KEY` | Cloudinary API Key. | Copy from Account Details block on the console dashboard. | Set as `CLOUDINARY_API_KEY=your_api_key` in `backend/.env`. |
| `CLOUDINARY_API_SECRET` | Cloudinary secret passcode. | Copy from Account Details block on the console dashboard. | Set as `CLOUDINARY_API_SECRET=your_api_secret` in `backend/.env`. |
| `BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION` | Bypasses actual Google Play Store API validation. | Use `true` for local development/sandbox. Set to `false` for real production purchases. | Set as `BYPASS_GOOGLE_PLAY_BILLING_VERIFICATION=true` in `backend/.env`. |
| `GOOGLE_PLAY_PACKAGE_NAME` | The application ID on Android. | The unique Android application package namespace (e.g., `com.qrcode.official`). | Set as `GOOGLE_PLAY_PACKAGE_NAME=com.qrcode.official` in `backend/.env`. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` | Path to Google Service Account JSON for play verification APIs. | Create a Google Cloud Project, link it with Google Play Console, generate a Service Account API key JSON from IAM, and save it in your project. | Set path relative or absolute as `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=path/to/key.json` in `backend/.env`. |

---

## Running the Application

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Build & Launch
Compile TypeScript to JavaScript, then run:
```bash
npm run build
npm start
```

---

## API Endpoints List

### 1. Authentication (`/api/auth`)
- `POST /register`: Create a new user account (unverified) and dispatch a 6-digit OTP code to their email.
- `POST /verify-otp`: Match OTP code, verify user email, and activate the free 14-day trial. Returns access and refresh JWTs.
- `POST /login`: Log in existing user. Returns JWTs.
- `POST /resend-otp`: Request a new verification OTP code.
- `POST /refresh-token`: Exchange valid refresh token for a new access token.

### 2. QR Code Management (`/api/qr`) (Auth Required)
- `POST /`: Create static or dynamic QR code (checks subscription limit constraints).
- `GET /`: Retrieve all active and draft QR codes created by user.
- `GET /:id`: Retrieve a specific QR code by database ID.
- `PUT /:id`: Update name, configuration content, or style specifications of a QR code.
- `PATCH /:id/status`: Toggle QR code status manually (e.g., `'active'` or `'paused'`).
- `POST /:id/logo`: Upload logo base64 image asset to Cloudinary and attach it to the QR code.
- `DELETE /:id`: Soft delete a QR code.

### 3. Scanning & Redirections (`/r`)
- `GET /r/:redirectCode`: Route for dynamic QR code scans. Automatically collects browser/device/OS metrics and logs a scan record, then redirects to destination URL. If the QR code is manually paused or subscription is expired, displays a beautiful branded glassmorphism warning page.

### 4. Subscription Management (`/api/subscription`) (Auth Required)
- `GET /status`: View user's subscription details, current plan type, expiration time, and renewal flags.
- `POST /verify`: Process Google Play receipt token to activate plans (Starter, Professional, Yearly) and reactivate paused QR codes.
- `POST /simulate-expiry`: Testing sandbox endpoint to force expire user's plan, pause active dynamic QRs, and dispatch expired billing email.
- `POST /simulate-grace`: Testing sandbox endpoint to enter 7-day grace period, keep codes active, and dispatch warning reminder email.

### 5. Analytics Dashboard (`/api/analytics`) (Auth Required)
- `GET /:id`: Retrieve scan counts, unique scans, and timelines formatted for graphs.
