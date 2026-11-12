// src/routes/registration.routes.js

import { Router } from 'express';
import { uploadReceipt } from '../config/cloudinary.js';
import { submitRegistration, checkStatus } from '../controllers/registration.controller.js';
import { registrationLimiter, statusLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public registration submission (rate limited & multipart upload)
router.post('/', registrationLimiter, uploadReceipt.single('receipt'), submitRegistration);

// Public check registration status by Reference ID (rate limited)
router.get('/:refId/status', statusLimiter, checkStatus);

export default router;

