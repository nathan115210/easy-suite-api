import { Router } from 'express';
import { signupController, signinController } from './auth-sessions.controller';
import { authLimiter } from '../../../middlewares/auth/auth-limiter';
import './auth-sessions.schema';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', authLimiter, signupController);
authSessionsRouter.post('/signin', authLimiter, signinController);
