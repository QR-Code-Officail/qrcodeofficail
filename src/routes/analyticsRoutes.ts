import { Router } from 'express';
import { getQRCodeAnalytics } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/:id', authMiddleware, getQRCodeAnalytics);

export default router;
