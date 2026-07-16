import { Router } from 'express';
import {
  getSubscriptionStatus,
  verifyPurchase,
  simulateExpiry,
  simulateGracePeriod,
  buyStaticCredit,
} from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { subscriptionPurchaseSchema } from '../utils/validationSchemas';

const router = Router();

// Apply auth middleware globally to subscription routes
router.use(authMiddleware);

router.get('/status', getSubscriptionStatus);
router.post('/verify', validateRequest(subscriptionPurchaseSchema), verifyPurchase);
router.post('/buy-static-credit', buyStaticCredit);

// Testing and Simulator Routes (Only for sandbox/testing)
router.post('/simulate-expiry', simulateExpiry);
router.post('/simulate-grace', simulateGracePeriod);

export default router;
