"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const qrRoutes_1 = __importDefault(require("./routes/qrRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const analyticsController_1 = require("./controllers/analyticsController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrcode_platform';
// Configure middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' })); // High limit to accommodate base64 image data strings for logo uploads
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Dynamic QR redirect endpoint (Short URI format)
app.get('/r/:redirectCode', analyticsController_1.redirectDynamicQR);
// API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/qr', qrRoutes_1.default);
app.use('/api/subscription', subscriptionRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'An internal server error occurred.',
    });
});
// Connect to MongoDB and start server
mongoose_1.default
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
exports.default = app;
