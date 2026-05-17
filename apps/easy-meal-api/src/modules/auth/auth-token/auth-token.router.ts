import { Router } from 'express';
import { tokenSignupController } from '@/modules/auth/auth-token/auth-token.controller';

export const authTokenRouter = Router();

// Define routes for token-based authentication here
authTokenRouter.post('/signup', tokenSignupController);
// authTokenRouter.post('/signin', tokenSigninController);
// authTokenRouter.get('/profile', requireAuthToken, getTokenProfileController);
// authTokenRouter.post('/signout', requireAuthToken, tokenSignoutController);
