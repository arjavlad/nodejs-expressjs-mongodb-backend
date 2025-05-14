import { Router } from 'express';

import { uploadConfig } from '../../../utils/upload.util';

import { validateRequest } from '../../../middlewares/validate.middleware';
import { authenticateUser } from '../../../middlewares/auth.middleware';

import { userController } from '../controllers/user.controller';
import { getConnectionsSchema, imageIdSchema, updateDetailsSchema, userIdSchema } from '../validators/user.validator';
import { connectionController } from '../controllers/connection.controller';

const router = Router();

router.use(authenticateUser);

// Get current user
router.get('/me', userController.getMe);

// Get a user by ID
router.get('/:id', validateRequest(userIdSchema), userController.getUserById);

// Upload Images
router.post('/me/images', uploadConfig.image.array('images'), userController.uploadImages);

// Delete Image
router.delete('/me/images/:imageId', validateRequest(imageIdSchema), userController.deleteImage);

// Make Profile Image Default
router.put('/me/images/:imageId/default', validateRequest(imageIdSchema), userController.makeProfileImageDefault);

// Update User Details
router.put('/me/details', validateRequest(updateDetailsSchema), userController.updateUserDetails);

// Get Connections
router.get('/me/connections', validateRequest(getConnectionsSchema), connectionController.getConnections);

export default router;
