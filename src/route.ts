import { Router } from 'express';

import adminAuthRoutes from './modules/admin/routes/index.route';
import { userAuthRouter as userAuthRoutes, userRouter as userUserRoutes } from './modules/user/routes/index.route';

// *** Load admin routes ***
const adminRouter = Router();

adminRouter.use('/', adminAuthRoutes);

// *** Load user routes ***
const apiRouter = Router();

apiRouter.use('/auth', userAuthRoutes); // Auth routes
apiRouter.use('/profile', userUserRoutes); // Common routes

export { adminRouter, apiRouter };
