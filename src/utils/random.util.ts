/// Random Utils
import crypto from 'crypto';

export class RandomUtils {
  /**
   * Generate a random string of a given length
   * @param length - The length of the random string
   * @returns A random string of the given length
   * @public
   * @static
   * @example
   * const randomString = RandomUtils.generateRandomString(10);
   * console.log(randomString);
   * // Output: 'a1b2c3d4e5f6g7h8i9j0'
   */
  public static generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * Generate a random number of a given length
   * @param length - The length of the random number
   * @returns A random number of the given length
   * @public
   * @static
   * @example
   * const randomNumber = RandomUtils.generateRandomNumber(10);
   * console.log(randomNumber);
   * // Output: 1234567890
   */
  public static generateRandomNumber(length: number): number {
    return Math.floor(Math.pow(10, length - 1) + crypto.randomInt(0, Math.pow(10, length) - Math.pow(10, length - 1)));
  }

  /**
   * Generate a unique id
   * @returns A unique id
   * @public
   * @static
   * @example
   * const uniqueId = RandomUtils.generateUniqueId();
   * console.log(uniqueId);
   * // Output: 'a1b2c3d4e5f6g7h8i9j0'
   */
  public static generateUniqueId(): string {
    return crypto.randomBytes(24).toString('hex');
  }
}

export const randomUtils = new RandomUtils();
