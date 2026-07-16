import { Router } from 'express';
import { register, verifyOtp, login, resendOtp, refreshToken, updateAvatar } from '../controllers/authController';
import { validateRequest } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema, verifyOtpSchema } from '../utils/validationSchemas';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/login', validateRequest(loginSchema), login);
router.post('/resend-otp', resendOtp);
router.post('/refresh-token', refreshToken);

// Protected routes
router.put('/profile/avatar', authMiddleware, updateAvatar);

export default router;
