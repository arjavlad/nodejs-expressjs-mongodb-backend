import { z, ZodIssue } from 'zod';
import { Request } from 'express';

import { PaginationOrder } from './pagination';

import StringUtils from '../utils/string.util';
import { passwordRegex } from '../utils/password.util';

// Type inferrer for request body
export type InferBodyType<T extends { body?: z.ZodType }> = z.infer<NonNullable<T['body']>>;

// Type inferrer for request query
export type InferQueryType<T extends { query?: z.ZodType }> = z.infer<NonNullable<T['query']>>;

// Type inferrer for request params
export type InferParamsType<T extends { params?: z.ZodType }> = z.infer<NonNullable<T['params']>>;

// Request validation schema
export interface RequestValidationSchema {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export type ZodValidationError = ZodIssue & {
  received?: unknown;
  expected?: string;
};

export type ValidatedRequest<T extends RequestValidationSchema> = Request<
  InferParamsType<T>,
  unknown,
  InferBodyType<T>,
  InferQueryType<T>
>;

// Schema for validating query params as numbers since they are sent as strings
export const queryParamsAsNumber = z.string().transform((val) => parseInt(val, 10));

// Schema for validating query params
export const paginationParamsSchema = {
  page: queryParamsAsNumber.pipe(z.number().min(1, 'Page must be greater than 0')).optional(),
  limit: queryParamsAsNumber.pipe(z.number().min(1, 'Limit must be greater than 0')).optional(),
};

// Schema for validating pagination params
export const createOrderParamsSchema = <T extends string>(allowedSortFields: T[]) => ({
  order: z.nativeEnum(PaginationOrder).optional(),
  sortBy: z.enum(allowedSortFields as [T, ...T[]]).optional(),
});

// Schema for validating mongodb object ids
export const ZodObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .transform((val) => StringUtils.toObjectId(val));

export const zodPasswordSchema = z.string().regex(passwordRegex, {
  message:
    'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
});
