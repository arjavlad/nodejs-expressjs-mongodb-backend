import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import { AdminTokenPayload, JwtUtil } from '../utils/jwt.util';

import { logger } from '../config/logger';
import { AuthRole } from '../types/enum';
import { ApiErrors } from '../types/errors';

import { UserDevice, UserDeviceDocument } from '../modules/user/models/userDevice.model';
import { User, UserDocument } from '../modules/user/models/user.model';
import { Admin, AdminDocument } from '../modules/admin/models/admin.model';

// Use module augmentation for type safety
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user: UserWithRole | AdminWithRole;
      device?: UserDeviceDocument | null;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Basic interfaces for type safety
export interface UserWithRole extends UserDocument {
  role: AuthRole.USER;
}

export interface AdminWithRole extends AdminDocument {
  role: AuthRole.ADMIN;
}

/**
 * Base authentication middleware
 */
const baseAuthenticate = (tokenType: AuthRole) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw ApiErrors.invalidToken('Authentication token is missing');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw ApiErrors.invalidToken('Authentication token is missing');
      }

      // Verify token and check type
      const decoded = JwtUtil.verifyToken(token);

      // Validate token type and role
      if (decoded.type !== 'access' || decoded.role !== tokenType) {
        throw ApiErrors.invalidToken('Invalid token type or role');
      }

      // For users, verify device and token
      if (tokenType === AuthRole.USER) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const userDevice = await UserDevice.findOne({
          userId: decoded.userId,
          jwtToken: hashedToken,
          jwtTokenExpiresAt: { $gt: new Date() },
          isActive: true,
        });

        if (!userDevice) {
          throw ApiErrors.invalidToken('Invalid or expired session');
        }

        // Load user data
        const user = await User.findById(decoded.userId).select('+stripeCustomerId');
        if (!user) {
          throw ApiErrors.invalidToken('Invalid or expired token');
        }

        // Update last active timestamp
        userDevice.lastActiveAt = new Date();
        await userDevice.save();

        req.user = { ...user.toObject(), role: AuthRole.USER, id: user.id } as unknown as UserWithRole;
        req.device = userDevice;
      } else {
        // For admin
        const admin = await Admin.findById(decoded.userId);
        if (!admin || !admin.refreshToken) {
          throw ApiErrors.invalidToken('Invalid or expired token');
        }

        // * This is to make sure that token is invalidated after token is refreshed or logged out
        const decodedAdmin = decoded as AdminTokenPayload;
        const hashedToken = crypto.createHash('sha256').update(decodedAdmin.refreshToken).digest('hex');
        if (admin.refreshToken !== hashedToken) {
          throw ApiErrors.invalidToken('Invalid or expired token');
        }

        req.user = { ...admin.toObject(), role: AuthRole.ADMIN, id: admin.id } as unknown as AdminWithRole;
        req.device = null;
      }

      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      next(error);
    }
  };
};

/**
 * Admin-specific authentication middleware
 */
export const authenticateAdmin = baseAuthenticate(AuthRole.ADMIN);

/**
 * User-specific authentication middleware
 */
export const authenticateUser = baseAuthenticate(AuthRole.USER);
