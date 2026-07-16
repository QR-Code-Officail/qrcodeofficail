import { Router } from 'express';
import multer from 'multer';
import { register, verifyOtp, login, resendOtp, refreshToken, updateAvatar, getProfile } from '../controllers/authController';
import { validateRequest } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema, verifyOtpSchema } from '../utils/validationSchemas';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Multer: store file in memory as a buffer (no disk writes needed)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.post('/register', validateRequest(registerSchema), register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/login', validateRequest(loginSchema), login);
router.post('/resend-otp', resendOtp);
router.post('/refresh-token', refreshToken);

// Protected routes
router.put('/profile/avatar', authMiddleware, avatarUpload.single('avatar'), updateAvatar);
router.get('/profile/me', authMiddleware, getProfile);

export default router;
