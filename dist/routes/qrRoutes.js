"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrController_1 = require("../controllers/qrController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Apply auth middleware globally to all QR routes
router.use(authMiddleware_1.authMiddleware);
router.post('/', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.qrCodeSchema), qrController_1.createQRCode);
router.get('/', qrController_1.getMyQRCodes);
router.get('/:id', qrController_1.getQRCodeById);
router.put('/:id', qrController_1.updateQRCode);
router.patch('/:id/status', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.updateQrStatusSchema), qrController_1.toggleQRCodeStatus);
router.post('/:id/logo', qrController_1.uploadQRCodeLogo);
router.delete('/:id', qrController_1.deleteQRCode);
exports.default = router;
