import { Readable } from 'stream';

/**
 * S3 upload options
 */
export interface S3UploadOptions {
  /** The bucket to upload to */
  bucket?: string;
  /** The key (path) to upload to */
  key?: string;
  /** Content type of the file */
  contentType?: string;
  /** Access control level */
  acl?: 'private' | 'public-read' | 'public-read-write';
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * S3 upload response
 */
export interface S3UploadResponse {
  /** The URL of the uploaded file */
  url: string;
  /** The key (path) of the uploaded file */
  key: string;
  /** The bucket the file was uploaded to */
  bucket: string;
}

/**
 * S3 file info
 */
export interface S3FileInfo {
  /** The key (path) of the file */
  key: string;
  /** Size of the file in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** Content type */
  contentType?: string;
  /** File metadata */
  metadata?: Record<string, string>;
}

/**
 * Supported file types for upload
 */
export type FileUploadType =
  | Buffer
  | Readable
  | string // file path or base64
  | Express.Multer.File;
