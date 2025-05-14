import { Router } from 'express';

import { uploadConfig } from '../../../utils/upload.util';

import { validateRequest } from '../../../middlewares/validate.middleware';
import { authenticateAdmin } from '../../../middlewares/auth.middleware';

import { adminController } from '../controllers/admin.controller';

import {
  addUserSchema,
  updateDetailsSchema,
  updatePasswordSchema,
  userIdSchema,
  blockUserSchema,
  getUsersSchema,
  imageIdSchema,
  imageStatusSchema,
} from '../validators/admin.validator';

const router = Router();

router.use(authenticateAdmin);

// Find Users
router.get('/', validateRequest(getUsersSchema), adminController.getUsers);

// Get User Details
router.get('/:userId', validateRequest(userIdSchema), adminController.getUserDetails);

// Add User
router.post('/', validateRequest(addUserSchema), adminController.addUser);

// Update User Details
router.put('/:userId/details', validateRequest(updateDetailsSchema), adminController.updateUserDetails);

// Update User Password
router.put('/:userId/password', validateRequest(updatePasswordSchema), adminController.updateUserPassword);

// Block User
router.put('/:userId/block', validateRequest(blockUserSchema), adminController.blockUser);

// Unblock User
router.put('/:userId/unblock', validateRequest(userIdSchema), adminController.unblockUser);

// Upload Images
router.post('/:userId/images', uploadConfig.image.array('images'), adminController.uploadImages);

// Replace Image
router.put('/:userId/images/:imageId', uploadConfig.image.single('image'), adminController.replaceImage);

// Delete Image
router.delete('/:userId/images/:imageId', validateRequest(imageIdSchema), adminController.deleteImage);

// Update Image Status
router.put('/:userId/images/:imageId/status', validateRequest(imageStatusSchema), adminController.updateImageStatus);

// Make Profile Image Default
router.put('/:userId/images/:imageId/default', validateRequest(imageIdSchema), adminController.makeProfileImageDefault);

export default router;
