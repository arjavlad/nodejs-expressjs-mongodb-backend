import { Router } from 'express';

import adminAuthRoutes from './auth.route';
import adminRoutes from './admin.route';

const router = Router();

router.use('/auth', adminAuthRoutes);
router.use('/admins', adminRoutes);

export default router;
