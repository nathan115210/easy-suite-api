import { Router } from 'express';
import { signupController } from './auth-sessions.controller';
import './auth-sessions.schema';

export const authSessionsRouter = Router();

authSessionsRouter.post('/signup', signupController);
