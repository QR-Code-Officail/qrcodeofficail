import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/authMiddleware';
import {
  saveScannedQR,
  getScanHistory,
  deleteScanHistoryItem,
  clearScanHistory,
} from '../controllers/scanHistoryController';

const router = Router();

// Save new scan (supports both logged in and guest via device ID)
router.post('/', optionalAuthMiddleware, saveScannedQR);

// Fetch scan history
router.get('/', optionalAuthMiddleware, getScanHistory);

// Delete single scan history entry
router.delete('/:id', optionalAuthMiddleware, deleteScanHistoryItem);

// Clear entire scan history
router.delete('/', optionalAuthMiddleware, clearScanHistory);

export default router;
