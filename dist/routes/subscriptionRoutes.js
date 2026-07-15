"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Apply auth middleware globally to subscription routes
router.use(authMiddleware_1.authMiddleware);
router.get('/status', subscriptionController_1.getSubscriptionStatus);
router.post('/verify', (0, validationMiddleware_1.validateRequest)(validationSchemas_1.subscriptionPurchaseSchema), subscriptionController_1.verifyPurchase);
// Testing and Simulator Routes (Only for sandbox/testing)
router.post('/simulate-expiry', subscriptionController_1.simulateExpiry);
router.post('/simulate-grace', subscriptionController_1.simulateGracePeriod);
exports.default = router;
