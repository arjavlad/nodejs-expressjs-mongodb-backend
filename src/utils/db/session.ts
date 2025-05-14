import mongoose from 'mongoose';
import { isDevelopment } from '../../config/vars';
import { logger } from '../../config/logger';

/**
 * Wrapper for mongoose session
 * @param callback - The callback function to execute
 * @returns The result of the callback function
 *
 * @example
 * await withMongooseSession(async (session) => {
 *   const result = await someOperation(session);
 *   await someOtherOperation(session);
 *   return result;
 * });
 */
export const withMongooseSession = async <T>(callback: (session: mongoose.ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();
  let result;

  try {
    result = await session.withTransaction(async () => {
      await callback(session);
    });
  } catch (error) {
    if (isDevelopment) {
      logger.error('Transaction error', error);
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return result as T;
};
