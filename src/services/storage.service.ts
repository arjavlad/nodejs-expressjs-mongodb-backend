import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { awsConfig } from '../config/vars';
import { logger } from '../config/logger';
import { ApiErrors } from '../types/errors';

/**
 * Storage service using AWS S3
 */
class StorageService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
    });

    this.s3 = new AWS.S3();
    this.bucketName = awsConfig.bucketName || '';
  }

  /**
   * Upload a file to S3
   * @param filePath Local file path
   * @param key Optional custom key (path in S3)
   * @returns Promise with upload result
   */
  public async uploadFile(filePath: string, key?: string): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      if (!this.bucketName) {
        throw ApiErrors.internalServerError('S3 bucket name is not defined');
      }

      const fileContent = fs.readFileSync(filePath);
      const fileName = key || path.basename(filePath);

      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: this.getContentType(fileName),
      };

      const result = await this.s3.upload(params).promise();
      logger.info(`File uploaded successfully to ${result.Location}`);
      return result;
    } catch (error) {
      logger.error('Error uploading file to S3', error);
      throw error;
    }
  }

  /**
   * Get a file from S3
   * @param key File key (path in S3)
   * @returns Promise with file data
   */
  public async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    try {
      if (!this.bucketName) {
        throw ApiErrors.internalServerError('S3 bucket name is not defined');
      }

      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();
      return result;
    } catch (error) {
      logger.error(`Error getting file from S3: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param key File key (path in S3)
   * @returns Promise with delete result
   */
  public async deleteFile(key: string): Promise<AWS.S3.DeleteObjectOutput> {
    try {
      if (!this.bucketName) {
        throw ApiErrors.internalServerError('S3 bucket name is not defined');
      }

      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await this.s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting file from S3: ${key}`, error);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for a file
   * @param key File key (path in S3)
   * @param expiresIn Expiration time in seconds (default: 3600)
   * @returns Pre-signed URL
   */
  public getSignedUrl(key: string, expiresIn = 3600): string {
    try {
      if (!this.bucketName) {
        throw ApiErrors.internalServerError('S3 bucket name is not defined');
      }

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      const url = this.s3.getSignedUrl('getObject', params);
      return url;
    } catch (error) {
      logger.error(`Error generating signed URL for: ${key}`, error);
      throw ApiErrors.internalServerError(`Error generating signed URL for: ${key}`);
    }
  }

  /**
   * Get content type based on file extension
   * @param fileName File name
   * @returns Content type
   */
  private getContentType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();

    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }
}

export default new StorageService();
