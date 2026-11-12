// src/routes/admin.routes.js

import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import {
  adminLogin,
  listRegistrations,
  getRegistration,
  verifyRegistration,
  rejectRegistration,
  dashboardStats,
  updateProfile,
} from '../controllers/admin.controller.js';

const router = Router();

// Public Admin Login with rate limiting
router.post('/login', loginLimiter, adminLogin);

// Protected Admin Routes (require valid JWT)
router.use(requireAdmin);

router.get('/registrations', listRegistrations);
router.get('/registrations/:id', getRegistration);
router.patch('/registrations/:id/verify', verifyRegistration);
router.patch('/registrations/:id/reject', rejectRegistration);
router.get('/dashboard/stats', dashboardStats);
router.patch('/profile', updateProfile);

export default router;

