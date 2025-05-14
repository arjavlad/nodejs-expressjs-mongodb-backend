import { z } from 'zod';

import { zodPasswordSchema } from '../../../types/validator';

// Login schema
export const loginSchema = {
  body: z
    .object({
      email: z.string().email('Invalid email address'),
      username: z.string().min(1, 'Username is required'),
      password: zodPasswordSchema,
      deviceInfo: z.object({
        deviceName: z.string().min(1, 'Device name is required'),
        deviceType: z.enum(['ios', 'android', 'web', 'desktop']),
      }),
    })
    .partial({
      email: true,
      username: true,
    })
    .superRefine((data, ctx) => {
      if (!data.email && !data.username) {
        ctx.addIssue({
          code: 'custom',
          message: 'Either email or username must be provided',
          path: ['email'],
        });
      }
    }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const requestPasswordResetSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      token: z.string().min(1, 'Reset token is required'),
      password: zodPasswordSchema,
      confirmPassword: zodPasswordSchema,
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          message: "Passwords don't match",
          path: ['confirmPassword'],
        });
      }
    }),
};

export const registerDeviceSchema = {
  body: z.object({
    deviceType: z.enum(['ios', 'android', 'web', 'desktop']),
    deviceName: z.string().min(1, 'Device name is required'),
    deviceToken: z.string().min(1, 'Device token is required'),
  }),
};

export const updateDeviceTokenSchema = {
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required'),
  }),
};

// Example of a route with multiple validations
export const updateDeviceSchema = {
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required'),
  }),
  params: z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
  }),
};
