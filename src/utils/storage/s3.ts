import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { lookup as mimeLookup } from 'mime-types';

import { awsConfig, mediaUrl } from '../../config/vars';
import { S3_CONFIG } from './constants';
import { ApiErrors } from '../../types/errors';
import { S3UploadOptions, S3UploadResponse, S3FileInfo, FileUploadType } from './types';

/**
 * S3 Storage utility for managing file uploads and downloads
 */
export class S3Storage {
  private client: S3Client;
  private defaultBucket: string;

  constructor() {
    this.client = new S3Client({
      region: S3_CONFIG.DEFAULT_REGION,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
    this.defaultBucket = S3_CONFIG.DEFAULT_BUCKET;
  }

  /**
   * Upload a file to S3
   * @param file - The file to upload (Buffer, Stream, path, or Multer file)
   * @param options - Upload options
   * @returns Upload response with file URL and details
   */
  async upload(file: FileUploadType, options: S3UploadOptions = {}): Promise<S3UploadResponse> {
    const bucket = options.bucket || this.defaultBucket;
    let key = options.key;
    let body: Buffer | Readable;
    let contentType = options.contentType;

    // Handle different file types
    if (Buffer.isBuffer(file)) {
      body = file;
    } else if (file instanceof Readable) {
      body = file;
    } else if (typeof file === 'string') {
      // Check if it's a base64 string
      if (file.startsWith('data:')) {
        const matches = file.match(/^data:(.+);base64,(.+)$/);
        if (!matches)
          throw ApiErrors.fileInvalidType('Invalid base64 string', {
            field: 'file',
          });
        contentType = matches[1] as string;
        body = Buffer.from(matches[2] as string, 'base64');
      } else {
        // Assume it's a file path
        body = createReadStream(file);
        contentType = contentType || mimeLookup(file) || 'application/octet-stream';
      }
    } else if ('buffer' in file) {
      // Multer file
      body = file.buffer;
      contentType = contentType || file.mimetype;
      key = key || file.originalname;
    } else {
      throw ApiErrors.fileInvalidType('Unsupported file type', {
        field: 'file',
      });
    }

    // Generate key if not provided
    if (!key) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      key = `${timestamp}-${random}`;
      if (contentType) {
        const ext = contentType.split('/')[1];
        if (ext) key += `.${ext}`;
      }
    }

    // Upload to S3
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: options.acl || S3_CONFIG.DEFAULT_ACL,
        Metadata: options.metadata,
      }),
    );

    // Return upload details
    return {
      url: `${mediaUrl}/${key}`,
      key,
      bucket,
    };
  }

  /**
   * Get a pre-signed URL for downloading a file
   * @param key - The file key
   * @param bucket - Optional bucket name
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Pre-signed URL
   */
  async getSignedUrl(key: string, bucket?: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   * @param key - The file key
   * @param bucket - Optional bucket name
   */
  async delete(key: string, bucket?: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      }),
    );
  }

  /**
   * Get file information from S3
   * @param key - The file key
   * @param bucket - Optional bucket name
   * @returns File information
   */
  async getFileInfo(key: string, bucket?: string): Promise<S3FileInfo> {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      }),
    );

    return {
      key,
      size: result.ContentLength || 0,
      lastModified: result.LastModified || new Date(),
      contentType: result.ContentType,
      metadata: result.Metadata,
    };
  }

  /**
   * Check if a file exists in S3
   * @param key - The file key
   * @param bucket - Optional bucket name
   * @returns Whether the file exists
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket || this.defaultBucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') return false;
      throw error;
    }
  }
}

// Export singleton instance
export const s3Storage = new S3Storage();
