import { Router } from 'express';
import {
  signupController,
  signinController,
  getProfileController,
} from './auth-sessions.controller';
import { authLimiter, authReadLimiter } from '../../../middlewares/auth/auth-limiter';
import './auth-sessions.schema';
import { requireAuthSessions } from '../../../middlewares/auth/auth-session/requireAuthSessions';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', authLimiter, signupController);
authSessionsRouter.post('/signin', authLimiter, signinController);
authSessionsRouter.get('/profile', authReadLimiter, requireAuthSessions, getProfileController);
