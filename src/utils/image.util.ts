import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { logger } from '../config/logger';

import { ApiErrors } from '../types/errors';
import { ProcessedImage } from '../types/image';

import { S3Storage } from './storage/s3';
import { S3_CONFIG } from './storage/constants';

import { RandomUtils } from './random.util';

/**
 * Image size configurations
 */
export const IMAGE_SIZES = {
  SMALL: { width: 320, height: null },
  MEDIUM: { width: 640, height: null },
  LARGE: { width: 1200, height: null },
};

/**
 * Image utility class for processing and resizing images
 */
export class ImageUtil {
  private s3Storage: S3Storage;

  constructor(s3Storage: S3Storage) {
    this.s3Storage = s3Storage;
  }

  /**
   * Process an image and create multiple size variants
   * @param file The uploaded file
   * @param folderPath The S3 folder path
   * @returns Promise with the image paths
   */
  async processImage(
    file: Express.Multer.File,
    folderPath: string = S3_CONFIG.UPLOAD_PATHS.TEMP,
  ): Promise<ProcessedImage> {
    // Create a temporary directory for processing
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'image-resize-'));

    try {
      // Generate file paths
      const fileName = this.generateFileName(file.originalname);
      const originalPath = path.join(tempDir, `original-${fileName}`);
      const smallPath = path.join(tempDir, `small-${fileName}`);
      const mediumPath = path.join(tempDir, `medium-${fileName}`);
      const largePath = path.join(tempDir, `large-${fileName}`);

      // Copy the uploaded file to our temp directory
      await fs.promises.copyFile(file.path, originalPath);

      // Create resized versions
      await this.resizeImage(originalPath, smallPath, IMAGE_SIZES.SMALL.width);
      await this.resizeImage(originalPath, mediumPath, IMAGE_SIZES.MEDIUM.width);
      await this.resizeImage(originalPath, largePath, IMAGE_SIZES.LARGE.width);

      // Upload all versions to S3 and get their paths
      try {
        const originalUpload = await this.s3Storage.upload(originalPath, {
          key: `${folderPath}/original/${fileName}`,
        });

        const smallUpload = await this.s3Storage.upload(smallPath, {
          key: `${folderPath}/small/${fileName}`,
        });

        const mediumUpload = await this.s3Storage.upload(mediumPath, {
          key: `${folderPath}/medium/${fileName}`,
        });

        const largeUpload = await this.s3Storage.upload(largePath, {
          key: `${folderPath}/large/${fileName}`,
        });
        // Return image paths
        return {
          original: originalUpload.key,
          small: smallUpload.key,
          medium: mediumUpload.key,
          large: largeUpload.key,
        } as ProcessedImage;
      } catch (error) {
        logger.error('Error uploading image to S3:', error);
      }

      return {
        original: originalPath,
        small: smallPath,
        medium: mediumPath,
        large: largePath,
      } as ProcessedImage;
    } finally {
      // Clean up temporary files
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Resize an image while preserving aspect ratio
   * @param inputPath Input file path
   * @param outputPath Output file path
   * @param width Target width
   */
  private async resizeImage(inputPath: string, outputPath: string, width: number): Promise<void> {
    await sharp(inputPath)
      .resize({
        width,
        fit: 'inside', // Preserve aspect ratio
        withoutEnlargement: true, // Don't enlarge small images
      })
      .toFile(outputPath);
  }

  /**
   * Generate a unique filename
   * @param originalName Original filename
   * @returns Unique filename
   */
  private generateFileName(originalName: string): string {
    const extension = path.extname(originalName);
    const uniqueId = RandomUtils.generateUniqueId();
    return `${uniqueId}${extension}`;
  }

  async uploadImage(file: Express.Multer.File, folderPath: string): Promise<string> {
    if (!file) {
      throw ApiErrors.fileInvalidType('File is required', {
        field: 'file',
      });
    }
    if (!folderPath) {
      folderPath = S3_CONFIG.UPLOAD_PATHS.TEMP;
    }
    const fileName = this.generateFileName(file.originalname);
    const key = `${folderPath}/${fileName}`;
    await this.s3Storage.upload(file.path, { key });

    return key;
  }
}
