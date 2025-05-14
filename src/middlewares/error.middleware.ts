import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/errors';
import { logger } from '../config/logger';
import { isDevelopment } from '../config/vars';
import { ApiResponseHandler } from '../types/apiResponse';

// Error type interfaces
interface ApiErrorWithDetails extends ApiError {
  details?: Record<string, unknown>;
}

interface MongoError extends Error {
  code?: number;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Handle ApiError instances
  if (err instanceof ApiError) {
    const apiError = err as ApiErrorWithDetails;
    ApiResponseHandler.error(res, err.message, err.statusCode, apiError.details);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    ApiResponseHandler.error(res, 'Invalid or expired token', 401);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    ApiResponseHandler.error(res, 'Validation error', 400, {
      errors: err.message.split(',').map((msg) => ({ field: 'unknown', message: msg.trim() })),
    });
    return;
  }

  // Handle duplicate key errors (MongoDB error code 11000)
  if ('code' in err && (err as MongoError).code === 11000) {
    ApiResponseHandler.error(res, 'Duplicate entry found', 409);
    return;
  }

  if (err.name === 'MulterError') {
    ApiResponseHandler.error(res, 'File upload error', 400, {
      errors: [err],
    });
    return;
  }

  // Log error details
  logger.error('Error handling request:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: isDevelopment ? err.stack : undefined,
  });

  // Default fallback for unhandled errors
  ApiResponseHandler.error(res, 'Internal server error', 500, {
    errors: isDevelopment ? [{ field: 'server', message: err.message }] : undefined,
  });
};
