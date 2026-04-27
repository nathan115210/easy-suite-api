import { Router } from 'express';
import { mealsRouter } from '../modules/meals/meals.routes';
export const v1Router = Router();

// Register module routers for version 1 of the API
//meals routes
v1Router.use('/meals', mealsRouter);
