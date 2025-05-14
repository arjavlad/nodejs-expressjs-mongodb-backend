import { awsConfig } from '../../config/vars';

/**
 * Default S3 configuration
 */
export const S3_CONFIG = {
  /** Default bucket name - should be overridden from environment variables */
  DEFAULT_BUCKET: awsConfig.bucketName,
  /** Default region - should be overridden from environment variables */
  DEFAULT_REGION: awsConfig.region,
  /** Default ACL for uploaded files */
  DEFAULT_ACL: 'private' as const,
  /** Maximum file size (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Supported mime types */
  SUPPORTED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  /** File upload paths */
  UPLOAD_PATHS: {
    DOCUMENTS: 'documents',
    TEMP: 'temp',
    USER_PROFILE_IMAGES: 'users/profile-images',
  },
} as const;
