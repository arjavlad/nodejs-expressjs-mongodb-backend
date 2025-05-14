import { z } from 'zod';

import { createOrderParamsSchema, paginationParamsSchema, zodPasswordSchema } from '../../../types/validator';

export const adminValidator = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: zodPasswordSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
};

export const getAdminsValidator = {
  query: z.object({
    ...paginationParamsSchema,
    search: z.string().optional(),
    ...createOrderParamsSchema(['firstName', 'lastName', 'email', 'createdAt']),
  }),
};
