import { Router } from 'express';

import { authenticateAdmin } from '../../../middlewares/auth.middleware';

import { validateRequest } from '../../../middlewares/validate.middleware';
import { changePasswordSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

import { adminController } from '../controllers/auth.controller';

const router = Router();

// Login routes
router.post('/login', validateRequest(loginSchema), adminController.login);

// Refresh token routes
router.post('/refresh-token', authenticateAdmin, validateRequest(refreshTokenSchema), adminController.refreshToken);

// Change password route
router.post(
  '/change-password',
  authenticateAdmin,
  validateRequest(changePasswordSchema),
  adminController.changePassword,
);

// Logout route
router.post('/logout', authenticateAdmin, adminController.logout);

export default router;
