import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { ApiErrors } from '../types/errors';
import { logger } from './logger';

// Load environment variables from .env file first
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default('3000'),
  MONGO_URI: z
    .string()
    .url()
    .or(z.string().regex(/^mongodb(\+srv)?\/\//)),
  CITY_SPARK_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRATION: z.string().transform(Number).pipe(z.number().positive()).default('60'),
  DEFAULT_AUTH_TOKEN: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  MEDIA_URL: z.string().url(),

  // AWS Config (optional group)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET_NAME: z.string().optional(),

  // Firebase Config (optional group)
  FIREBASE_TYPE: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_CLIENT_ID: z.string().optional(),
  FIREBASE_AUTH_URI: z.string().url().optional(),
  FIREBASE_TOKEN_URI: z.string().url().optional(),
  FIREBASE_AUTH_PROVIDER_CERT_URL: z.string().url().optional(),
  FIREBASE_CLIENT_CERT_URL: z.string().url().optional(),

  // Email Config (optional group)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).pipe(z.number().positive()).default('587'),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@thegroup.com'),

  // Stripe Config
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_'),

  // Log Config
  LOG_LEVEL: z.string().default('info'),
});

// Type inference
type EnvVars = z.infer<typeof envSchema>;

// Validate environment variables
const validateEnv = (): EnvVars => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment variables validation failed', { issues: error.issues });
      throw ApiErrors.validationError('Environment variables validation failed', {
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    throw ApiErrors.internalServerError('Failed to validate environment variables');
  }
};

// Validate and get typed environment variables
const env = validateEnv();

// Export validated environment variables
export const environment = env.NODE_ENV;
export const isDevelopment = environment === 'development';
export const isProduction = environment === 'production';
export const isTest = environment === 'test';

export const port = env['PORT'] as number;
export const mongoURI = env['MONGO_URI'] as string;
export const citysparkKey = env['CITY_SPARK_KEY'] as string;
export const jwtSecret = env['JWT_SECRET'] as string;
export const jwtExpirationInterval = env['JWT_EXPIRATION'] as number;
export const defaultAuthToken = env['DEFAULT_AUTH_TOKEN'] as string;

export const frontendUrl = env['FRONTEND_URL'] as string;
export const mediaUrl = env['MEDIA_URL'] as string;
export const awsConfig = {
  accessKeyId: env['AWS_ACCESS_KEY_ID'] as string,
  secretAccessKey: env['AWS_SECRET_ACCESS_KEY'] as string,
  region: env['AWS_REGION'] as string,
  bucketName: env['AWS_S3_BUCKET_NAME'] as string,
} as const;

export const firebaseConfig = {
  type: env['FIREBASE_TYPE'] as string,
  projectId: env['FIREBASE_PROJECT_ID'] as string,
  privateKeyId: env['FIREBASE_PRIVATE_KEY_ID'] as string,
  privateKey: env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n') as string,
  clientEmail: env['FIREBASE_CLIENT_EMAIL'] as string,
  clientId: env['FIREBASE_CLIENT_ID'] as string,
  authUri: env['FIREBASE_AUTH_URI'] as string,
  tokenUri: env['FIREBASE_TOKEN_URI'] as string,
  authProviderX509CertUrl: env['FIREBASE_AUTH_PROVIDER_CERT_URL'] as string,
  clientX509CertUrl: env['FIREBASE_CLIENT_CERT_URL'] as string,
} as const;

export const emailConfig = {
  host: env['EMAIL_HOST'] as string,
  port: env['EMAIL_PORT'] as number,
  username: env['EMAIL_USERNAME'] as string,
  password: env['EMAIL_PASSWORD'] as string,
  fromEmail: env['EMAIL_FROM'] as string,
} as const;

export const stripeConfig = {
  secretKey: env['STRIPE_SECRET_KEY'] as string,
  publishableKey: env['STRIPE_PUBLISHABLE_KEY'] as string,
  webhookSecret: env['STRIPE_WEBHOOK_SECRET'] as string,
} as const;

export const logLevel = env['LOG_LEVEL'] as string;
