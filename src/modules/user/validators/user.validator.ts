import { z } from 'zod';

import { paginationParamsSchema, ZodObjectIdSchema } from '../../../types/validator';

export const userIdSchema = {
  params: z.object({
    id: ZodObjectIdSchema,
  }),
};

export const updateDetailsSchema = {
  body: z.object({}),
};

export const getConnectionsSchema = {
  query: z.object({
    ...paginationParamsSchema,
  }),
};
