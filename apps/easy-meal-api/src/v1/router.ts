import { Router } from 'express';
import { mealsRouter } from '@/modules/meals/meals.routes';
import { authSessionsRouter } from '@/modules/auth/auth-sessions/auth-sessions.router';

export const v1Router = Router();

// Register module routers for version 1 of the API
//meals routes
v1Router.use('/meals', mealsRouter);
// Auth routes - with session management
v1Router.use('/auth-sessions', authSessionsRouter);
