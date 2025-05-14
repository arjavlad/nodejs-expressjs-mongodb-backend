import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../config/logger';

// File type constants
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif'] as const,
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
} as const;

// Default configuration constants
export const UPLOAD_DEFAULTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DESTINATION: path.join(__dirname, '../../uploads'),
  IMAGE_CONFIG: {
    allowedTypes: FILE_TYPES.IMAGE,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    destination: path.join(__dirname, '../../uploads/images'),
  },
  DOCUMENT_CONFIG: {
    allowedTypes: FILE_TYPES.DOCUMENT,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    destination: path.join(__dirname, '../../uploads/documents'),
  },
} as const;

// Types
export type UploadConfigOptions = {
  allowedTypes?: readonly string[];
  maxFileSize?: number;
  destination?: string;
};

/**
 * Ensures directory exists, creates it if it doesn't
 */
const ensureDirectoryExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    logger.info(`Created upload directory: ${directory}`);
  }
};

/**
 * Generates a unique filename for uploaded files
 */
const generateFilename = (originalname: string): string => {
  const extension = path.extname(originalname);
  const filename = path.basename(originalname, extension);
  const uniqueId = uuidv4();
  return `${filename}-${uniqueId}${extension}`;
};

/**
 * Creates a file filter function for multer
 */
const createFileFilter = (allowedTypes?: readonly string[]) => {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!allowedTypes || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn(`File upload rejected: invalid file type ${file.mimetype}`);
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  };
};

/**
 * Creates a multer upload configuration with directory creation
 */
export const createUploadConfig = (options?: UploadConfigOptions) => {
  const config = {
    destination: options?.destination ?? UPLOAD_DEFAULTS.DESTINATION,
    maxFileSize: options?.maxFileSize ?? UPLOAD_DEFAULTS.MAX_FILE_SIZE,
    allowedTypes: options?.allowedTypes,
  };

  const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      // Ensure directory exists right before saving the file
      try {
        ensureDirectoryExists(config.destination);
        cb(null, config.destination);
      } catch (error) {
        cb(
          new Error(`Failed to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`),
          '',
        );
      }
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      cb(null, generateFilename(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter: createFileFilter(config.allowedTypes),
    limits: { fileSize: config.maxFileSize },
  });
};

// Preset configurations for common use cases
export const uploadConfig = {
  /**
   * Default configuration for image uploads
   */
  image: createUploadConfig({
    ...UPLOAD_DEFAULTS.IMAGE_CONFIG,
  }),

  /**
   * Default configuration for document uploads
   */
  document: createUploadConfig({
    ...UPLOAD_DEFAULTS.DOCUMENT_CONFIG,
  }),

  /**
   * Default configuration for all file types
   */
  default: createUploadConfig(),
};

export default uploadConfig;
