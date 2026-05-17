import { Router } from 'express';
import {
  getAllMealsController,
  getMealByIdController,
  updateMealController,
  addMealController,
} from '@/modules/meals/meals.controller';
import { validateUuidParam } from '@/middlewares/validate-uuid-param';
import '@/modules/meals/meals.schema';

export const mealsRouter = Router();

mealsRouter.get('/', getAllMealsController);
mealsRouter.get('/:id', validateUuidParam('id'), getMealByIdController);
mealsRouter.put('/:id', validateUuidParam('id'), updateMealController);
mealsRouter.post('/', addMealController);
