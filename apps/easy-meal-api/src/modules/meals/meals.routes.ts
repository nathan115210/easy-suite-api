import { Router } from 'express';
import {
  getAllMealsController,
  getMealByIdController,
  updateMealController,
} from './meals.controller';
import { validateUuidParam } from '../../middlewares/validate-uuid-param';
import './meals.schema';

export const mealsRouter = Router();

mealsRouter.get('/', getAllMealsController);
mealsRouter.get('/:id', validateUuidParam('id'), getMealByIdController);
mealsRouter.put('/:id', validateUuidParam('id'), updateMealController);
