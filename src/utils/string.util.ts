/// String Utils
import mongoose from 'mongoose';

export class StringUtils {
  /**
   * Capitalize the first letter of the string.
   * @param str - The string to capitalize.
   * @returns The capitalized string.
   *
   * @example
   * const str = 'hello world';
   * const capitalized = StringUtils.capitalize(str);
   * console.log(capitalized);
   * // Output: 'Hello World'
   */
  public static capitalize(str: string): string {
    if (!str || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert a string to a slug.
   * @param str - The string to convert to a slug.
   * @returns The slug.
   *
   * @example
   * const slug = StringUtils.toSlug('Hello World');
   * console.log(slug);
   * // Output: 'hello-world'
   */
  public static toSlug(str: string): string {
    str = str.trim();
    if (!str || str.length === 0) return str;
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  /**
   * Check if the string is a valid email.
   * @param email - The string to check if it is a valid email.
   * @returns True if the string is a valid email, false otherwise.
   *
   * @example
   * const email = 'test@example.com';
   * const isValid = StringUtils.isValidEmail(email);
   * console.log(isValid);
   * // Output: true
   */
  public static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Check if the string is a valid phone number.
   * @param phone - The string to check if it is a valid phone number.
   * @returns True if the string is a valid phone number, false otherwise.
   *
   * @example
   * const phone = '+1234567890';
   * const isValid = StringUtils.isValidPhoneNumber(phone);
   * console.log(isValid);
   * // Output: true
   */
  public static isValidPhoneNumber(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  /**
   * Check if the string is a valid mongoose object id.
   * @param id - The string to check if it is a valid mongoose object id.
   * @returns True if the string is a valid mongoose object id, false otherwise.
   *
   * @example
   * const id = '60a0b0b0b0b0b0b0b0b0b0b0';
   * const isValid = StringUtils.isValidObjectId(id);
   * console.log(isValid);
   * // Output: true
   */
  public static isValidObjectId(id: string): boolean {
    if (mongoose.Types.ObjectId.isValid(id)) {
      // We need to check if the id is same as the stringified id.
      return new mongoose.Types.ObjectId(id).toString() === id;
    }
    return false;
  }

  /**
   * Check if the string is a valid url.
   * @param url - The string to check if it is a valid url.
   * @returns True if the string is a valid url, false otherwise.
   *
   * @example
   * const url = 'https://www.google.com';
   * const isValid = StringUtils.isValidUrl(url);
   * console.log(isValid);
   * // Output: true
   */
  public static isValidUrl(url: string): boolean {
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url);
  }

  /**
   * Convert a string to a mongoose object id.
   * @param id - The string to convert to a mongoose object id.
   * @returns The mongoose object id.
   *
   * @example
   * const id = '60a0b0b0b0b0b0b0b0b0b0b0';
   * const objectId = StringUtils.toObjectId(id);
   * console.log(objectId);
   * // Output: 60a0b0b0b0b0b0b0b0b0b0b0
   */
  public static toObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }
}

export default StringUtils;
