import mongoose from 'mongoose';
import { isDevelopment, mongoURI } from './vars';
import { logger } from './logger';

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    if (isDevelopment) {
      mongoose.set('debug', true);
    }

    const connection = await mongoose.connect(mongoURI);

    logger.info('MongoDB connected successfully');

    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    throw error;
  }
};
