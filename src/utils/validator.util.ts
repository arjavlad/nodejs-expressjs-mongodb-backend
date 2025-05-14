import { ZodError } from 'zod';
import { Request } from 'express';

import { isDevelopment } from '../config/vars';
import { logger } from '../config/logger';

import { RequestValidationSchema, ValidatedRequest, ZodValidationError } from '../types/validator';
import { ApiErrors } from '../types/errors';

/**
 * Validates a request against a Zod schema. This function can be used to validate the request body, query, and params in the controller. This is useful for Multipart/Form-Data requests where validation middleware cannot be used.
 *
 * @param req - The express request to validate
 * @param schema - The Zod schema to validate against
 * @returns The validated request
 *
 * @example
 * const validatedRequest = await validateRequest(req, createPostAdminSchema);
 * const { communityId } = validatedRequest.params;
 * const { type, content, createdBy, topic } = validatedRequest.body;
 */
export const validateRequest = async <T extends RequestValidationSchema>(req: Request, schema: T) => {
  try {
    const request: ValidatedRequest<T> = req;

    // Validate each part of the request in parallel
    if (schema.body) {
      request.body = (await schema.body.parseAsync(req.body)) as ValidatedRequest<T>['body'];
    }

    if (schema.query) {
      request.query = (await schema.query.parseAsync(req.query)) as ValidatedRequest<T>['query'];
    }

    if (schema.params) {
      request.params = (await schema.params.parseAsync(req.params)) as ValidatedRequest<T>['params'];
    }

    return request;
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

      throw ApiErrors.validationError('Validation failed', {
        errors: validationErrors,
      });
    } else {
      logger.error('Error validating request', error);
      throw error;
    }
  }
};
