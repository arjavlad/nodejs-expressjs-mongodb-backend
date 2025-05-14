import { Request, Response, NextFunction } from 'express';
import { defaultAuthToken } from '../config/vars';
import { ApiErrors } from '../types/errors';

/**
 * Middleware to check a simple API key for non-authenticated routes
 * This is a basic protection mechanism and should be replaced with a more robust solution in production
 */
export const defaultAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Skip authentication for health check endpoint
    if (req.path === '/health') {
      return next();
    }

    // Check for API key in headers
    const apiKey = req.headers['x-default-auth'] as string;
    if (apiKey !== defaultAuthToken) {
      throw ApiErrors.unauthorized('Invalid API key');
    }

    next();
  } catch (error) {
    next(error);
  }
};
