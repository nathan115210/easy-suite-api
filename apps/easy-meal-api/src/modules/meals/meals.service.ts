import { db } from '../../db';
import { mealsTable } from '../../db/schema';
import type { Meal } from './meals.schema';
import { eq } from 'drizzle-orm';

export async function getAllMeals(): Promise<Meal[]> {
  return db
    .select({
      id: mealsTable.id,
      title: mealsTable.title,
      slug: mealsTable.slug,
      image: mealsTable.image,
      description: mealsTable.description,
      cookTime: mealsTable.cookTime,
      difficulty: mealsTable.difficulty,
    })
    .from(mealsTable);
}

export async function getMealById(id: string): Promise<Meal | null> {
  return db
    .select({
      id: mealsTable.id,
      title: mealsTable.title,
      slug: mealsTable.slug,
      image: mealsTable.image,
      description: mealsTable.description,
      cookTime: mealsTable.cookTime,
      difficulty: mealsTable.difficulty,
    })
    .from(mealsTable)
    .where(eq(mealsTable.id, id))
    .limit(1)
    .then(([meal]) => meal ?? null);
}
