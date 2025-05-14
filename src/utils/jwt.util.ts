import jwt from 'jsonwebtoken';

import { jwtSecret, jwtExpirationInterval } from '../config/vars';
import { logger } from '../config/logger';

import { AuthRole } from '../types/enum';

// Define token payload types
interface BaseTokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export interface AdminTokenPayload extends BaseTokenPayload {
  role: AuthRole.ADMIN;
  refreshToken: string;
}

export interface UserTokenPayload extends BaseTokenPayload {
  role: AuthRole.USER;
}

type TokenPayload = AdminTokenPayload | UserTokenPayload;

/**
 * JWT Token utility functions
 */
export class JwtUtil {
  /**
   * Generate a JWT token
   * @param payload Data to encode in token
   * @param options JWT sign options
   * @returns Signed JWT token
   */
  public static generateToken(payload: Record<string, unknown>, options?: jwt.SignOptions): string {
    try {
      const mergedOptions: jwt.SignOptions = {
        expiresIn: `${jwtExpirationInterval}d`,
        ...options,
      };

      return jwt.sign(payload, jwtSecret, mergedOptions);
    } catch (error) {
      logger.error('Error generating JWT token', error);
      throw error;
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token JWT token to verify
   * @param options JWT verify options
   * @returns Decoded token payload
   */
  public static verifyToken(token: string, options?: jwt.VerifyOptions): TokenPayload {
    try {
      return jwt.verify(token, jwtSecret, options) as TokenPayload;
    } catch (error) {
      logger.error('JWT verification failed', error);
      throw error;
    }
  }

  /**
   * Decode a JWT token without verification
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  public static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload | null;
    } catch (error) {
      logger.error('JWT decoding failed', error);
      throw error;
    }
  }

  /**
   * Generate an access token for a user
   * @param userId User ID
   * @param role User role
   * @param refreshToken Refresh token - optional, to be used for admin only
   * @returns Signed JWT token
   */
  public static generateAccessToken(userId: string, role: AuthRole, refreshToken?: string): string {
    return this.generateToken(
      {
        userId,
        role,
        type: 'access',
        refreshToken,
      },
      { subject: userId },
    );
  }

  /**
   * Generate an email verification token
   * @param userId User ID
   * @param email User email
   * @returns Signed JWT token with short expiration
   */
  public static generateEmailVerificationToken(userId: string, email: string): string {
    return this.generateToken(
      {
        userId,
        email,
        type: 'emailVerification',
      },
      {
        subject: userId,
        expiresIn: '1d',
      },
    );
  }

  /**
   * Generate a password reset token
   * @param userId User ID
   * @param email User email
   * @returns Signed JWT token with short expiration
   */
  public static generatePasswordResetToken(userId: string, email: string): string {
    return this.generateToken(
      {
        userId,
        email,
        type: 'passwordReset',
      },
      {
        subject: userId,
        expiresIn: '1h',
      },
    );
  }
}

export const jwtUtil = new JwtUtil();
