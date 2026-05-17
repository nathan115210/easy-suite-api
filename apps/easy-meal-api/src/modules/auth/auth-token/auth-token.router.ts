import { Router } from 'express';
import {
  tokenSignupController,
  tokenSigninController,
} from '@/modules/auth/auth-token/auth-token.controller';
import { authLimiter } from '@/middlewares/auth/auth-limiter';

export const authTokenRouter = Router();

// Define routes for token-based authentication here
authTokenRouter.post('/signup', tokenSignupController);
authTokenRouter.post('/signin', authLimiter, tokenSigninController);
// authTokenRouter.get('/profile', requireAuthToken, getTokenProfileController);
// authTokenRouter.post('/signout', requireAuthToken, tokenSignoutController);
