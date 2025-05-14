import { z } from 'zod';

import { UserStatus } from '../types/enum.type';
import {
  createOrderParamsSchema,
  paginationParamsSchema,
  ZodObjectIdSchema,
  zodPasswordSchema,
} from '../../../types/validator';

export const addUserSchema = {
  body: z.object({
    password: zodPasswordSchema,
    email: z.string().email(),
    status: z.nativeEnum(UserStatus),
  }),
};

export const updateDetailsSchema = {
  params: z.object({
    userId: ZodObjectIdSchema,
  }),
  body: addUserSchema.body.omit({ email: true }).partial(),
};

export const updatePasswordSchema = {
  params: z.object({
    userId: ZodObjectIdSchema,
  }),
  body: z.object({
    password: zodPasswordSchema,
  }),
};

export const userIdSchema = {
  params: z.object({
    userId: ZodObjectIdSchema,
  }),
};

export const getUsersSchema = {
  query: z.object({
    ...paginationParamsSchema,
    ...createOrderParamsSchema(['createdAt', 'greeting', 'email', 'status']),
    status: z.nativeEnum(UserStatus).optional(),
    isBlocked: z.boolean().optional(),
  }),
};

export const blockUserSchema = {
  params: z.object({
    userId: ZodObjectIdSchema,
  }),
  body: z.object({
    blockedReason: z.string().min(1),
  }),
};
