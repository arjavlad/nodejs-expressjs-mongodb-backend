import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { logger } from './logger';
import { defaultAuth } from '../middlewares/defaultAuth.middleware';
import { errorHandler } from '../middlewares/error.middleware';

// Import aggregated routes
import { adminRouter, apiRouter } from '../route';
import { isDevelopment } from './vars';

/**
 * Initialize Express application with middleware
 */
export const initializeExpress = (app: Express): void => {
  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Health check endpoint (before body parsers if it doesn't need body)
  app.get('/health', (_req: Request, res: Response) => {
    if (isDevelopment) {
      const response = {
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now(),
      };
      res.status(200).send(response);
    } else {
      res.status(200).send({ status: 'ok' });
    }
  });

  // General Body parsing middleware (AFTER webhook raw parser)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Default authentication middleware for all API routes (AFTER webhook)
  app.use(defaultAuth);

  // Mount aggregated route groups
  app.use('/v1', apiRouter);

  app.use('/admin', adminRouter);

  // Global error handling middleware
  app.use(errorHandler);
};
