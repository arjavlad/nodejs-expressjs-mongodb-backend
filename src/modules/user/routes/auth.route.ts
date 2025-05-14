import { Router } from 'express';

import { validateRequest } from '../../../middlewares/validate.middleware';
import { authenticateUser } from '../../../middlewares/auth.middleware';

import { userController } from '../controllers/auth.controller';

import {
  loginSchema,
  refreshTokenSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  registerDeviceSchema,
  updateDeviceTokenSchema,
} from '../validators/auth.validator';

const router = Router();

// Public routes (no auth required)
router.post('/login', validateRequest(loginSchema), userController.login);

// Refresh Token
router.post('/refresh-token', validateRequest(refreshTokenSchema), userController.refreshToken);

// Request Password Reset
router.post('/request-reset', validateRequest(requestPasswordResetSchema), userController.requestPasswordReset);

// Reset Password
router.post('/reset-password', validateRequest(resetPasswordSchema), userController.resetPassword);

// Protected routes (auth required)
router.use(authenticateUser);

// Logout
router.post('/logout', userController.logout);

// Register Device
router.post('/devices', validateRequest(registerDeviceSchema), userController.registerDevice);

// Update Device Token
router.put('/devices/:deviceId/token', validateRequest(updateDeviceTokenSchema), userController.updateDeviceToken);

// Remove Device
router.delete('/devices/:deviceId', userController.removeDevice);

export default router;
