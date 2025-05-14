import { Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { ApiErrors } from '../types/errors';
import { isDevelopment } from '../config/vars';
import { RequestValidationSchema, ValidatedRequest, ZodValidationError } from '../types/validator';

/**
 * Middleware for validating requests with Zod schemas
 */
export const validateRequest = <T extends RequestValidationSchema>(schema: T) => {
  return async (req: ValidatedRequest<T>, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationPromises: Promise<unknown>[] = [];

      // Validate each part of the request in parallel
      if (schema.body) {
        validationPromises.push(
          schema.body.parseAsync(req.body).then((data) => {
            req.body = data as ValidatedRequest<T>['body'];
          }),
        );
      }

      if (schema.query) {
        validationPromises.push(
          schema.query.parseAsync(req.query).then((data) => {
            req.query = data as ValidatedRequest<T>['query'];
          }),
        );
      }

      if (schema.params) {
        validationPromises.push(
          schema.params.parseAsync(req.params).then((data) => {
            req.params = data as ValidatedRequest<T>['params'];
          }),
        );
      }

      await Promise.all(validationPromises);
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          ...(isDevelopment && {
            received: (e as ZodValidationError).received,
            expected: (e as ZodValidationError).expected,
            code: e.code,
          }),
        }));

        next(
          ApiErrors.validationError('Validation failed', {
            errors: validationErrors,
          }),
        );
        return;
      }

      next(error);
    }
  };
};

/**
 * Shorthand for validating a specific part of the request
 * @param schema The Zod schema to validate with
 * @param type The part of the request to validate (body, query, params)
 */
export const validate = (schema: ZodSchema, type: 'body' | 'query' | 'params') => {
  const validationSchema: RequestValidationSchema = {};
  validationSchema[type] = schema;
  return validateRequest(validationSchema);
};
