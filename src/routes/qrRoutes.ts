import { Router } from 'express';
import {
  createQRCode,
  getMyQRCodes,
  getQRCodeById,
  updateQRCode,
  toggleQRCodeStatus,
  uploadQRCodeLogo,
  deleteQRCode,
} from '../controllers/qrController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { qrCodeSchema, updateQrStatusSchema } from '../utils/validationSchemas';

const router = Router();

// Apply auth middleware globally to all QR routes
router.use(authMiddleware);

router.post('/', validateRequest(qrCodeSchema), createQRCode);
router.get('/', getMyQRCodes);
router.get('/:id', getQRCodeById);
router.put('/:id', updateQRCode);
router.patch('/:id/status', validateRequest(updateQrStatusSchema), toggleQRCodeStatus);
router.post('/:id/logo', uploadQRCodeLogo);
router.delete('/:id', deleteQRCode);

export default router;
