import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccess, ApiError } from '@easy-suite/utils';
import { getAllMeals, getMealById } from './meals.service';
import type { Meal } from './meals.schema';

export async function getAllMealsController(
  _req: Request,
  res: Response<ApiSuccess<Meal[]>>,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAllMeals();
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getMealByIdController(
  req: Request<{ id: string }>,
  res: Response<ApiSuccess<Meal> | ApiError>,
  next: NextFunction,
): Promise<void> {
  const mealId = req.params.id;

  try {
    const data = await getMealById(mealId);
    if (!data) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meal not found' } });
      return;
    }
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}
