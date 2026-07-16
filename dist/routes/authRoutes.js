"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authController_1 = require("../controllers/authController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Multer: store file in memory as a buffer (no disk writes needed)
const avatarUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed.'));
        }
    },
});
router.post('/register', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.registerSchema), authController_1.register);
router.post('/verify-otp', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.verifyOtpSchema), authController_1.verifyOtp);
router.post('/login', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.loginSchema), authController_1.login);
router.post('/resend-otp', authController_1.resendOtp);
router.post('/refresh-token', authController_1.refreshToken);
// Protected routes
router.put('/profile/avatar', authMiddleware_1.authMiddleware, avatarUpload.single('avatar'), authController_1.updateAvatar);
router.get('/profile/me', authMiddleware_1.authMiddleware, authController_1.getProfile);
exports.default = router;
