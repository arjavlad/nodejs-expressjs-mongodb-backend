import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import multer from 'multer';

import { ApiErrors } from '../../types/errors';

/**
 * Transforms form field to number if possible
 */
const transformToNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }
  return value;
};

/**
 * Creates a Zod schema that handles multipart/form-data fields
 * @param schema Original Zod schema
 * @returns Modified schema that handles string/number conversions for form data
 */
export const createMultipartFormSchema = <T extends z.ZodType>(schema: T) => {
  return schema.transform((obj) => {
    const transformed = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = transformToNumber(value);
    }

    return transformed;
  });
};

/**
 * Helper type for inferring the type from a multipart form schema
 * This extracts the proper TypeScript type from a schema processed by createMultipartFormSchema
 */
export type InferMultipartFormType<T extends z.ZodType> = z.infer<T>;

/**
 * Extracts field name from multer single middleware
 */
const getFileFieldName = (middleware: RequestHandler): string => {
  // Multer's single middleware is actually a function with a fieldName property
  const multerMiddleware = middleware as unknown as { fieldName?: string };
  return multerMiddleware.fieldName || 'file';
};

/**
 * Combines Multer upload and Zod validation for both body and params
 */
export const validateMultipartForm = <B extends z.ZodType, P extends z.ZodType>(
  uploadMiddleware: RequestHandler,
  bodySchema: B,
  paramsSchema?: P,
): RequestHandler => {
  // Extract the field name from the multer middleware
  const fieldName = getFileFieldName(uploadMiddleware);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle file upload first
      await new Promise<void>((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err instanceof multer.MulterError) {
            // Use the extracted field name in the error
            reject(ApiErrors.fileUploadError(err.message, { field: fieldName }));
          } else if (err) {
            reject(err);
          }
          resolve();
        });
      });

      // Validate params if schema provided
      if (paramsSchema) {
        const validatedParams = await paramsSchema.parseAsync(req.params);
        req.params = validatedParams as z.infer<P>;
      }

      // Validate body data
      const validatedBody = await bodySchema.parseAsync(req.body);
      req.body = validatedBody as z.infer<B>;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Type guard to check if request has file
 */
export const hasFile = (req: Request): req is Request & { file: Express.Multer.File } => {
  return req.file !== undefined;
};
