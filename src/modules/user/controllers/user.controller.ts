import { Request, Response } from 'express';
import { omit, pick } from 'lodash';

import { logger } from '../../../config/logger';

import { ValidatedRequest } from '../../../types/validator';
import { ApiErrors } from '../../../types/errors';
import { ProcessedImage } from '../../../types/image';
import { ApiResponseHandler } from '../../../types/apiResponse';

import { ImageUtil } from '../../../utils/image.util';
import { S3Storage } from '../../../utils/storage/s3';
import { S3_CONFIG } from '../../../utils/storage/constants';

import { imageIdSchema, userIdSchema, updateDetailsSchema } from '../validators/user.validator';

import {
  User,
  USER_DETAILS_PRIVATE_FIELDS_SELECT,
  USER_DETAILS_PUBLIC_FIELDS_SELECT,
  USER_PUBLIC_FIELDS_SELECT,
  UserImage,
} from '../models/user.model';

const s3Storage = new S3Storage();
const imageUtil = new ImageUtil(s3Storage);

/**
 * Process uploaded image and return Image object
 */
const processImage = async (file: Express.Multer.File | undefined): Promise<ProcessedImage> => {
  if (!file) {
    throw ApiErrors.fileUploadError('Cover image is required', { field: 'coverImage' });
  }

  try {
    return await imageUtil.processImage(file, S3_CONFIG.UPLOAD_PATHS.USER_PROFILE_IMAGES);
  } catch (error) {
    logger.error('Error processing image:', error);
    throw ApiErrors.fileUploadError('Failed to process image', { field: 'coverImage' });
  }
};

export const userController = {
  getMe: async (req: Request, res: Response) => {
    const user = await User.findById(req.user._id).select(USER_DETAILS_PRIVATE_FIELDS_SELECT).lean();
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    ApiResponseHandler.success(res, user);
  },

  getUserById: async (req: ValidatedRequest<typeof userIdSchema>, res: Response) => {
    const { id } = req.params;

    const user = await User.findById(id).select(USER_PUBLIC_FIELDS_SELECT);
    if (!user || user.isBlocked) {
      throw ApiErrors.notFound('User not found');
    }

    ApiResponseHandler.success(res, user);
  },

  uploadImages: async (req: Request, res: Response): Promise<void> => {
    if (!req.files) {
      throw ApiErrors.fileUploadError('No images uploaded', { field: 'images' });
    }

    const user = await User.findById(req.user._id).select(USER_DETAILS_PUBLIC_FIELDS_SELECT);
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    try {
      const files = req.files as Express.Multer.File[];
      const images = await Promise.all(files.map(async (file) => await processImage(file)));
      const userImages = images.map((image) => ({
        image,
        isApproved: false, // only admin can approve images
        isProfileImage: false,
      }));

      user.images.push(...(userImages as UserImage[]));
      await user.save();

      const response = pick(user.toObject(), USER_DETAILS_PUBLIC_FIELDS_SELECT.split(' '));

      ApiResponseHandler.success(res, response, 'Images uploaded successfully');
    } catch (error) {
      logger.error('Error uploading images:', error);
      throw ApiErrors.fileUploadError('Failed to upload images', { field: 'coverImage' });
    }
  },

  deleteImage: async (req: ValidatedRequest<typeof imageIdSchema>, res: Response): Promise<void> => {
    const { imageId } = req.params;

    const user = await User.findById(req.user._id).select(USER_DETAILS_PUBLIC_FIELDS_SELECT);
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    const image = user.images.find((image) => image._id?.toString() === imageId.toString());
    if (!image) {
      throw ApiErrors.notFound('Image not found');
    }

    user.images = user.images.filter((image) => image._id?.toString() !== imageId.toString());
    await user.save();

    const response = pick(user.toObject(), USER_DETAILS_PUBLIC_FIELDS_SELECT.split(' '));

    ApiResponseHandler.success(res, response, 'Image deleted successfully');
  },

  makeProfileImageDefault: async (req: ValidatedRequest<typeof imageIdSchema>, res: Response): Promise<void> => {
    const { imageId } = req.params;

    const user = await User.findById(req.user._id).select(USER_DETAILS_PUBLIC_FIELDS_SELECT);
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    const image = user.images.find((image) => image._id?.toString() === imageId.toString());
    if (!image) {
      throw ApiErrors.notFound('Image not found');
    }

    if (image.isApproved == false) {
      throw ApiErrors.badRequest('Image is not approved');
    }

    user.images.forEach((image) => {
      if (image._id?.toString() === imageId.toString()) {
        image.isProfileImage = true;
      } else {
        image.isProfileImage = false;
      }
    });

    user.profileImage = image.image;
    await user.save();

    const response = pick(user.toObject(), USER_DETAILS_PUBLIC_FIELDS_SELECT.split(' '));

    ApiResponseHandler.success(res, response, 'Profile image set as default successfully');
  },

  updateUserDetails: async (req: ValidatedRequest<typeof updateDetailsSchema>, res: Response): Promise<void> => {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    const body = omit(req.body, [
      'shippingAddresses',
      'primaryResidence',
      'secondaryResidence',
      'tertiaryResidence',
      'members',
    ]);

    user.set(body);

    await user.save();

    const response = pick(user.toObject(), USER_DETAILS_PUBLIC_FIELDS_SELECT.split(' '));

    return ApiResponseHandler.success(res, response, 'User details updated successfully');
  },
};
