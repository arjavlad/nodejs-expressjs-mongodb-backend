import bcrypt from 'bcrypt';

import { logger } from '../config/logger';
import { ApiErrors } from '../types/errors';

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Password utility class for hashing and comparing passwords using bcrypt
 */
export class PasswordUtil {
  /**
   * Default number of salt rounds for bcrypt
   * Higher values increase security but also increase computation time
   */
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash a password using bcrypt
   * @param password Plain text password to hash
   * @param saltRounds Number of salt rounds (default: 10)
   * @returns Promise with hashed password
   */
  public static async hash(password: string, saltRounds = this.SALT_ROUNDS): Promise<string> {
    try {
      // Generate a salt
      const salt = await bcrypt.genSalt(saltRounds);

      // Hash the password with the salt
      const hashedPassword = await bcrypt.hash(password, salt);

      return hashedPassword;
    } catch (error) {
      logger.error('Error hashing password', error);
      throw ApiErrors.internalServerError('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password to compare
   * @param hashedPassword Hashed password to compare against
   * @returns Promise with boolean indicating if passwords match
   */
  public static async compare(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Compare the password with the hash
      const isMatch = await bcrypt.compare(password, hashedPassword);

      return isMatch;
    } catch (error) {
      logger.error('Error comparing passwords', error);
      throw ApiErrors.validationError('Failed to compare passwords', {
        errors: [
          {
            field: 'password',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      });
    }
  }

  /**
   * Generate a random password of specified length
   * @param length Length of the password (default: 12)
   * @returns Random password
   */
  public static generateRandomPassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Check if a password meets the minimum security requirements
   * @param password Password to validate
   * @returns Object with validation result and message
   */
  public static validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    // Minimum length check
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character',
      };
    }

    return {
      isValid: true,
      message: 'Password meets all requirements',
    };
  }
}

export default new PasswordUtil();
