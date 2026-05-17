import { Router } from 'express';
import {
  signupController,
  signinController,
  getProfileController,
  signoutController,
  signoutAllController,
} from '@/modules/auth/auth-sessions/auth-sessions.controller';
import { authLimiter, authReadLimiter } from '@/middlewares/auth/auth-limiter';
import '@/modules/auth/auth-sessions/auth-sessions.schema';
import { requireAuthSessions } from '@/middlewares/auth/auth-session/requireAuthSessions';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', authLimiter, signupController);
authSessionsRouter.post('/signin', authLimiter, signinController);
authSessionsRouter.get('/profile', authReadLimiter, requireAuthSessions, getProfileController);
authSessionsRouter.post('/signout', authLimiter, signoutController);
authSessionsRouter.post('/signout-all', authLimiter, requireAuthSessions, signoutAllController);
