import { ApiErrors } from '../types/errors';

/**
 * Rounds a number to two decimal places.
 * @param num The number to round.
 * @returns The number rounded to two decimal places.
 *
 * @example
 * roundToTwoDecimals(123.456) // 123.46
 * roundToTwoDecimals(123.4) // 123.40
 * roundToTwoDecimals(123) // 123.00
 */
export const roundToTwoDecimals = (num: number): number => {
  if (isNaN(num)) {
    throw ApiErrors.invalidInput('Input must be a number');
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the total price with tax.
 * @param price The price to calculate the total for.
 * @param tax The tax to apply to the price.
 * @returns The total price with tax.
 *
 * @example
 * totalWithTax(100, 10) // 110
 */
export const totalWithTax = (price: number, tax: number | undefined): number => {
  if (!tax) {
    return roundToTwoDecimals(price);
  }
  return roundToTwoDecimals(price + taxAmount(price, tax));
};

/**
 * Calculates the tax amount.
 * @param price The price to calculate the tax for.
 * @param tax The tax to apply to the price.
 * @returns The tax amount.
 *
 * @example
 * taxAmount(100, 10) // 10
 */
export const taxAmount = (price: number, tax: number | undefined): number => {
  if (!tax) {
    return 0;
  }
  return roundToTwoDecimals((price * tax) / 100);
};
