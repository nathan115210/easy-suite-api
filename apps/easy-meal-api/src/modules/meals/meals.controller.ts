import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccess, ApiError } from '@easy-suite/utils';
import { getAllMeals, getMealById, updateMeal, createMeal } from '@/modules/meals/meals.service';
import {
  MealSearchQuerySchema,
  UpdateMealBodySchema,
  type Meal,
  type MealDetail,
  type AddMealBody,
  AddMealBodySchema,
} from '@/modules/meals/meals.schema';

export async function getAllMealsController(
  req: Request,
  res: Response<ApiSuccess<MealDetail[]> | ApiError>,
  next: NextFunction,
): Promise<void> {
  const parsed = MealSearchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'INVALID_QUERY',
        message: 'Invalid query parameters',
        details: parsed.error.issues,
      },
    });
    return;
  }

  try {
    const data = await getAllMeals(parsed.data);
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

export async function updateMealController(
  req: Request<{ id: string }>,
  res: Response<ApiSuccess<MealDetail> | ApiError>,
  next: NextFunction,
): Promise<void> {
  const mealId = req.params.id;

  const parsed = UpdateMealBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'INVALID_BODY',
        message: 'Invalid request body',
        details: parsed.error.issues,
      },
    });
    return;
  }

  try {
    const data = await updateMeal(mealId, parsed.data);
    if (!data) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meal not found' } });
      return;
    }
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addMealController(
  req: Request<Record<string, string | string[]>, ApiSuccess<MealDetail> | ApiError, AddMealBody>,
  res: Response<ApiSuccess<MealDetail> | ApiError>,
  next: NextFunction,
): Promise<void> {
  // Validation can be added here if needed, similar to the other controllers
  const parsed = AddMealBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'INVALID_BODY',
        message: 'Invalid request body',
        details: parsed.error.issues,
      },
    });
    return;
  }
  try {
    const data = await createMeal(parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}
