import { Router } from 'express';
import {
  signupController,
  signinController,
  getProfileController,
} from './auth-sessions.controller';
import { authLimiter } from '../../../middlewares/auth/auth-limiter';
import './auth-sessions.schema';
import { requireAuth } from '../../../middlewares/auth/auth-session/requireAuth';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', authLimiter, signupController);
authSessionsRouter.post('/signin', authLimiter, signinController);
authSessionsRouter.get('/profile', authLimiter, requireAuth, getProfileController);
