import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pick } from 'lodash';

import { frontendUrl } from '../../../config/vars';

import { InferBodyType } from '../../../types/validator';
import { AuthRole } from '../../../types/enum';
import { ApiErrors } from '../../../types/errors';
import type { EmailOptions } from '../../../types/email';
import { ApiResponseHandler } from '../../../types/apiResponse';

import { sendEmail } from '../../../utils/email';
import { JwtUtil } from '../../../utils/jwt.util';

import { User, USER_PRIVATE_FIELDS_SELECT, USER_DETAILS_PRIVATE_FIELDS_SELECT } from '../models/user.model';
import { UserDevice } from '../models/userDevice.model';

import {
  loginSchema,
  refreshTokenSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  registerDeviceSchema,
  updateDeviceTokenSchema,
} from '../validators/auth.validator';

/**
 * User authentication controller
 */
export const userController = {
  /**
   * User login with email/username and password
   */
  login: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof loginSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, username, password, deviceInfo } = req.body;

      // Find user
      const query = email ? { email } : { username };
      const user = await User.findOne(query).select(
        USER_PRIVATE_FIELDS_SELECT + ' ' + USER_DETAILS_PRIVATE_FIELDS_SELECT,
      );
      if (!user) {
        throw ApiErrors.invalidCredentials('Invalid credentials');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw ApiErrors.invalidCredentials('Invalid credentials');
      }

      // Create or get user device document
      const userDevice = new UserDevice({
        userId: user._id,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
      });

      // Create new tokens
      const { refreshToken, accessToken } = userDevice.createTokens();
      await userDevice.save();

      ApiResponseHandler.success(res, {
        user: pick(user.toObject(), USER_DETAILS_PRIVATE_FIELDS_SELECT.split(' ')),
        deviceId: userDevice.deviceId,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh user access token
   */
  refreshToken: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof refreshTokenSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { refreshToken } = req.body;
      const deviceId = req.headers['x-device-id'] as string;

      if (!deviceId) {
        throw ApiErrors.invalidInput('Device ID is required');
      }

      // Hash the refresh token
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Find device session with refresh token
      const userDevice = await UserDevice.findOne({
        deviceId,
        refreshToken: hashedToken,
        refreshTokenExpiresAt: { $gt: new Date() },
        isActive: true,
      });

      if (!userDevice) {
        throw ApiErrors.invalidToken('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = JwtUtil.generateAccessToken(userDevice.userId.toString(), AuthRole.USER);
      userDevice.updateJwtToken(accessToken);
      await userDevice.save();

      ApiResponseHandler.success(res, {
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User logout
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || typeof req.user.id !== 'string') {
        throw ApiErrors.unauthorized('User is not authenticated or ID is invalid');
      }

      const userId = req.user.id;
      if (!req.device?.deviceId) {
        return ApiResponseHandler.success(res, null, 'Logged out successfully');
      }
      const deviceId = req.device.deviceId;

      const userDevice = await UserDevice.findOne({ userId, deviceId });
      if (userDevice) {
        userDevice.deactivate();
        await userDevice.save();
      }

      ApiResponseHandler.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Request password reset for user
   */
  requestPasswordReset: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof requestPasswordResetSchema>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email }).select(USER_PRIVATE_FIELDS_SELECT);
      if (!user) {
        ApiResponseHandler.success(
          res,
          null,
          'If your email is registered, you will receive a password reset link',
          200,
        );
        return;
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Send reset email
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: 'Password Reset Request',
        text: `To reset your password, click the following link: ${resetUrl}\nIf you didn't request this, please ignore this email.\nThis link will expire in 1 hour.`,
      };
      await sendEmail(emailOptions);

      ApiResponseHandler.success(res, null, 'If your email is registered, you will receive a password reset link');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset user password
   */
  resetPassword: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof resetPasswordSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token, password } = req.body;

      // Hash the reset token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with reset token and check expiry
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: { $gt: new Date() },
      }).select(USER_PRIVATE_FIELDS_SELECT);

      if (!user) {
        throw ApiErrors.invalidToken('Invalid or expired reset token');
      }

      // Update password and clear reset token
      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      await user.save();

      ApiResponseHandler.success(res, null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register new device for user
   */
  registerDevice: async (
    req: Request<Record<string, never>, unknown, InferBodyType<typeof registerDeviceSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user || typeof req.user.id !== 'string') {
        throw ApiErrors.unauthorized('User is not authenticated or ID is invalid');
      }

      const userId = req.user.id;
      const deviceInfo = req.body;

      const userDevice = new UserDevice({
        userId,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        deviceToken: deviceInfo.deviceToken,
      });

      const { refreshToken, accessToken } = userDevice.createTokens();
      await userDevice.save();

      ApiResponseHandler.success(res, {
        deviceId: userDevice.deviceId,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update device token (for push notifications)
   */
  updateDeviceToken: async (
    req: Request<{ deviceId: string }, unknown, InferBodyType<typeof updateDeviceTokenSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user || typeof req.user.id !== 'string') {
        throw ApiErrors.unauthorized('User is not authenticated or ID is invalid');
      }

      const userId = req.user.id;
      const { deviceId } = req.params;
      const { deviceToken } = req.body;

      const userDevice = await UserDevice.findOne({ userId, deviceId });
      if (!userDevice) {
        throw ApiErrors.notFound('Device not found');
      }

      userDevice.updateDeviceToken(deviceToken);
      await userDevice.save();

      ApiResponseHandler.success(res, null, 'Device token updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove device
   */
  removeDevice: async (req: Request<{ deviceId: string }>, res: Response, next: NextFunction) => {
    try {
      if (!req.user || typeof req.user.id !== 'string') {
        throw ApiErrors.unauthorized('User is not authenticated or ID is invalid');
      }

      const userId = req.user.id;
      const { deviceId } = req.params;

      const userDevice = await UserDevice.findOne({ userId, deviceId });
      if (!userDevice) {
        throw ApiErrors.notFound('Device not found');
      }

      userDevice.deactivate();
      await userDevice.save();

      ApiResponseHandler.success(res, null, 'Device removed successfully');
    } catch (error) {
      next(error);
    }
  },
};
