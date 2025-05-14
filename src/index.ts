import './config/vars'; // Load env variables first
import express from 'express';

import { logger } from './config/logger';
import { initializeExpress } from './config/express';
import { connectDB } from './config/mongoose';
import { port } from './config/vars';

const app = express();

// Initialize Express app with middlewares
initializeExpress(app);

// Connect to MongoDB
connectDB()
  .then(() => {
    // Start the server
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error, promise: Promise<unknown>) => {
  logger.error('Unhandled Promise Rejection:', error);

  // If it's a server error, try to send a response
  if (app.get('env') === 'development') {
    // Log additional details in development
    logger.error('Promise details:', { promise });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);

  // Give the server time to send any pending responses before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;
