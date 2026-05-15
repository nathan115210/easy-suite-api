import { Router } from 'express';
import { signupController, signinController } from './auth-sessions.controller';
import './auth-sessions.schema';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', signupController);
authSessionsRouter.post('/signin', signinController);
