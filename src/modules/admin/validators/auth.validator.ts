import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string(),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    password: z.string(),
  }),
};
