import { Request, Response, NextFunction } from 'express';
import { pick } from 'lodash';
import crypto from 'crypto';

import { JwtUtil } from '../../../utils/jwt.util';

import { AuthRole } from '../../../types/enum';
import { ApiErrors } from '../../../types/errors';
import { ApiResponseHandler } from '../../../types/apiResponse';
import { InferBodyType } from '../../../types/validator';

import { changePasswordSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

import { Admin, ADMIN_PUBLIC_FIELDS_SELECT } from '../models/admin.model';

/**
 * Admin controller with authentication methods
 */
export const adminController = {
  /**
   * Admin login with email and password
   */
  login: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof loginSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = req.body;

      // Find admin with password and refresh token fields
      const admin = await Admin.findOne({ email });
      if (!admin) {
        throw ApiErrors.invalidCredentials('Invalid email or password');
      }

      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        throw ApiErrors.invalidCredentials('Invalid email or password');
      }

      // Clear any existing refresh token
      admin.refreshToken = undefined;
      admin.refreshTokenExpiresAt = undefined;

      // Generate tokens
      const refreshToken = admin.createRefreshToken();
      const accessToken = JwtUtil.generateAccessToken(admin.id, AuthRole.ADMIN, refreshToken);

      // Save refresh token
      await admin.save();

      ApiResponseHandler.success(res, {
        admin: pick(admin.toObject(), ADMIN_PUBLIC_FIELDS_SELECT.split(' ')),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof refreshTokenSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { refreshToken } = req.body;

      // Hash the refresh token
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Find admin with refresh token and check expiry
      const admin = await Admin.findOne({
        refreshToken: hashedToken,
        refreshTokenExpiresAt: { $gt: new Date() },
      });
      if (!admin) {
        throw ApiErrors.invalidToken('Invalid or expired refresh token');
      }

      // Invalidate refresh token
      admin.invalidateRefreshToken();

      // Generate new tokens
      const newRefreshToken = admin.createRefreshToken();
      const accessToken = JwtUtil.generateAccessToken(admin.id, AuthRole.ADMIN, newRefreshToken);

      // Save new refresh token
      await admin.save();

      ApiResponseHandler.success(res, {
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin logout
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find and update admin to clear refresh token
      const admin = await Admin.findById(req.user.id);
      if (admin) {
        admin.invalidateRefreshToken();
        await admin.save();
      }

      ApiResponseHandler.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change admin password
   */
  changePassword: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof changePasswordSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { password } = req.body;

      // Find admin with reset token and check expiry
      const admin = await Admin.findById(req.user.id).select(ADMIN_PUBLIC_FIELDS_SELECT);
      if (!admin) {
        throw ApiErrors.invalidToken('Invalid or expired reset token');
      }

      // Update password, it'll be hashed before saving.
      admin.password = password;

      await admin.save();

      ApiResponseHandler.success(res, null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
    }
  },
};
