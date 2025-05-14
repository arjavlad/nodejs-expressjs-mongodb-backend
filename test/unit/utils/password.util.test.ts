import { PasswordUtil } from '../../../src/utils/password.util';

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordUtil.hash(password);

      // Hashed password should be a string
      expect(typeof hashedPassword).toBe('string');

      // Hashed password should be different from original
      expect(hashedPassword).not.toBe(password);

      // Hashed password should be a bcrypt hash (starts with $2b$)
      expect(hashedPassword.startsWith('$2b$')).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordUtil.hash(password);

      const isMatch = await PasswordUtil.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await PasswordUtil.hash(password);

      const isMatch = await PasswordUtil.compare(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a random password of default length', () => {
      const password = PasswordUtil.generateRandomPassword();
      expect(password.length).toBe(12);
    });

    it('should generate a random password of specified length', () => {
      const length = 16;
      const password = PasswordUtil.generateRandomPassword(length);
      expect(password.length).toBe(length);
    });

    it('should generate different passwords on each call', () => {
      const password1 = PasswordUtil.generateRandomPassword();
      const password2 = PasswordUtil.generateRandomPassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const password = 'StrongPassword123!';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(true);
    });

    it('should reject a password that is too short', () => {
      const password = 'Short1!';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should reject a password without uppercase letters', () => {
      const password = 'nouppercaseletters123!';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    it('should reject a password without lowercase letters', () => {
      const password = 'NOLOWERCASELETTERS123!';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    it('should reject a password without numbers', () => {
      const password = 'NoNumbersHere!';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should reject a password without special characters', () => {
      const password = 'NoSpecialChars123';
      const result = PasswordUtil.validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('special character');
    });
  });
});
