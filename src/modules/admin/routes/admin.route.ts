import { Router } from 'express';

import { authenticateAdmin } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validate.middleware';

import { adminValidator, getAdminsValidator } from '../validators/admin.validator';

import { adminController } from '../controllers/admin.controller';

const router = Router();

router.use(authenticateAdmin);

router.post('/', validateRequest(adminValidator), adminController.createAdmin);

router.get('/', validateRequest(getAdminsValidator), adminController.getAdmins);

export default router;
