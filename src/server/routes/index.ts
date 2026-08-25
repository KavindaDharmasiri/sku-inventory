import { Router } from 'express';
import { authRouter } from './auth.routes';
import { catalogRouter } from './catalog.routes';
import { userRouter } from './user.routes';
import { adminRouter } from './admin.routes';

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(catalogRouter);
apiRouter.use(userRouter);
apiRouter.use(adminRouter);
