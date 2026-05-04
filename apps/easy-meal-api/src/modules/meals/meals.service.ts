import { CookTimeValue, DifficultyLevel, MealType } from '../../../easy-meal-api.types';
import { db } from '../../db';
import {
  mealsTable,
  mealTypesTable,
  mealIngredientsTable,
  mealInstructionsTable,
  mealNutritionTable,
} from '../../db/schema';
import { searchByKeywordCondition } from '../../utils/searchByKeyword';
import { slugify } from '../../utils/slugify';
import type {
  Meal,
  MealDetail,
  MealIngredient,
  MealInstruction,
  MealNutrition,
  UpdateMealBody,
} from './meals.schema';
import { and, asc, desc, eq, gt, lte, sql, type SQL } from 'drizzle-orm';
import { AppError } from '@easy-suite/utils';

type MealTypeResponse = Exclude<MealType, MealType.Any>;

export type MealSearchQuerySortOption =
  | 'created_desc'
  | 'created_asc'
  | 'cook_time_asc'
  | 'cook_time_desc';

export type MealSearchQuery = {
  q?: string;
  difficulty?: DifficultyLevel;
  cookTime?: CookTimeValue;
  sort?: MealSearchQuerySortOption;
};

export async function getAllMeals(query: MealSearchQuery = {}): Promise<MealDetail[]> {
  const filters: SQL[] = [];

  const searchFilter = query.q
    ? searchByKeywordCondition(query.q, mealsTable.title, 'web')
    : undefined;

  if (searchFilter) {
    filters.push(searchFilter);
  }

  // Only apply difficulty filter if it's specified and not "any"
  if (query.difficulty && query.difficulty !== DifficultyLevel.Any) {
    filters.push(eq(mealsTable.difficulty, query.difficulty));
  }

  // Only apply cook time filter if it's specified and not "any"
  if (query.cookTime && query.cookTime !== CookTimeValue.Any) {
    const cookTimeFilter = {
      [CookTimeValue.Under15]: lte(mealsTable.cookTime, 15),
      [CookTimeValue.Under30]: lte(mealsTable.cookTime, 30),
      [CookTimeValue.Under45]: lte(mealsTable.cookTime, 45),
      [CookTimeValue.Under60]: lte(mealsTable.cookTime, 60),
      [CookTimeValue.Over60]: gt(mealsTable.cookTime, 60),
    }[query.cookTime];

    filters.push(cookTimeFilter);
  }

  // Default to sorting by newest created if no valid sort option is provided
  const orderBy = {
    created_asc: asc(mealsTable.createdAt),
    created_desc: desc(mealsTable.createdAt),
    cook_time_asc: asc(mealsTable.cookTime),
    cook_time_desc: desc(mealsTable.cookTime),
  }[query.sort ?? 'created_desc'];

  let mealsQuery = db
    .select({
      id: mealsTable.id,
      title: mealsTable.title,
      slug: mealsTable.slug,
      image: mealsTable.image,
      description: mealsTable.description,
      cookTime: mealsTable.cookTime,
      difficulty: mealsTable.difficulty,
      mealType: sql<MealTypeResponse[] | null>`
        json_agg(${mealTypesTable.mealType})
          filter (where ${mealTypesTable.mealType} is not null)
      `,
    })
    .from(mealsTable)
    .leftJoin(mealTypesTable, eq(mealTypesTable.mealId, mealsTable.id))
    .groupBy(
      mealsTable.id,
      mealsTable.title,
      mealsTable.slug,
      mealsTable.image,
      mealsTable.description,
      mealsTable.cookTime,
      mealsTable.difficulty,
      mealsTable.createdAt,
    )
    .$dynamic();

  const whereClause = filters.length === 1 ? filters[0] : and(...filters);

  if (whereClause) {
    mealsQuery = mealsQuery.where(whereClause);
  }

  const meals = await mealsQuery.orderBy(orderBy);

  return Promise.all(meals.map((meal) => getMealWithDetails(meal)));
}

async function getIngredientsByMealId(mealId: string): Promise<MealIngredient[] | null> {
  return db
    .select({
      text: mealIngredientsTable.text,
      amount: mealIngredientsTable.amount,
      sort_order: mealIngredientsTable.sortOrder,
    })
    .from(mealIngredientsTable)
    .where(eq(mealIngredientsTable.mealId, mealId))
    .then((rows) => {
      if (rows.length === 0) {
        return null;
      }

      // Sort ingredients by sort_order before returning
      return rows.sort((a, b) => a.sort_order - b.sort_order);
    });
}

async function getInstructionsByMealId(mealId: string): Promise<MealInstruction[] | null> {
  return db
    .select({
      text: mealInstructionsTable.text,
      image: mealInstructionsTable.image,
      sort_order: mealInstructionsTable.sortOrder,
    })
    .from(mealInstructionsTable)
    .where(eq(mealInstructionsTable.mealId, mealId))
    .then((rows) => {
      if (rows.length === 0) {
        return null;
      }

      // Sort instructions by sort_order before returning
      return rows.sort((a, b) => a.sort_order - b.sort_order);
    });
}

async function getNutritionByMealId(mealId: string): Promise<MealNutrition | null> {
  return db
    .select({
      calories: mealNutritionTable.calories,
      protein: mealNutritionTable.protein,
      carbs: mealNutritionTable.carbs,
      fat: mealNutritionTable.fat,
    })
    .from(mealNutritionTable)
    .where(eq(mealNutritionTable.mealId, mealId))
    .then(([nutrition]) => nutrition || null);
}

async function getMealWithDetails(meal: Meal): Promise<MealDetail> {
  const ingredientsData = await getIngredientsByMealId(meal.id);
  const instructionsData = await getInstructionsByMealId(meal.id);
  const nutritionData = await getNutritionByMealId(meal.id);

  return {
    ...meal,
    mealType: meal.mealType ?? null,
    ingredients: ingredientsData,
    instructions: instructionsData,
    nutrition: nutritionData,
  };
}

function findDuplicateSortOrders(items: { sort_order: number }[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const item of items) {
    if (seen.has(item.sort_order)) {
      duplicates.add(item.sort_order);
    } else {
      seen.add(item.sort_order);
    }
  }
  return [...duplicates].sort((a, b) => a - b);
}

export async function updateMeal(id: string, body: UpdateMealBody): Promise<MealDetail | null> {
  if (body.ingredients) {
    const dupes = findDuplicateSortOrders(body.ingredients);
    if (dupes.length > 0) {
      throw new AppError(
        400,
        'DUPLICATE_SORT_ORDER',
        `Duplicate sort_order values in ingredients: ${dupes.join(', ')}`,
      );
    }
  }

  if (body.instructions) {
    const dupes = findDuplicateSortOrders(body.instructions);
    if (dupes.length > 0) {
      throw new AppError(
        400,
        'DUPLICATE_SORT_ORDER',
        `Duplicate sort_order values in instructions: ${dupes.join(', ')}`,
      );
    }
  }

  const existing = await db
    .select({ id: mealsTable.id })
    .from(mealsTable)
    .where(eq(mealsTable.id, id))
    .limit(1)
    .then(([row]) => row);

  if (!existing) return null;

  await db.transaction(async (tx) => {
    const mealFields: Partial<typeof mealsTable.$inferInsert> = {};
    if (body.title !== undefined) {
      mealFields.title = body.title;
      mealFields.slug = slugify(body.title);
    }
    if (body.image !== undefined) mealFields.image = body.image;
    if (body.description !== undefined) mealFields.description = body.description;
    if (body.cookTime !== undefined) mealFields.cookTime = body.cookTime;
    if (body.difficulty !== undefined) mealFields.difficulty = body.difficulty;

    if (Object.keys(mealFields).length > 0) {
      await tx
        .update(mealsTable)
        .set({ ...mealFields, updatedAt: new Date() })
        .where(eq(mealsTable.id, id));
    }

    if (body.mealType !== undefined) {
      await tx.delete(mealTypesTable).where(eq(mealTypesTable.mealId, id));
      if (body.mealType && body.mealType.length > 0) {
        await tx
          .insert(mealTypesTable)
          .values(body.mealType.map((type) => ({ mealId: id, mealType: type })));
      }
    }

    if (body.ingredients !== undefined) {
      await tx.delete(mealIngredientsTable).where(eq(mealIngredientsTable.mealId, id));
      if (body.ingredients && body.ingredients.length > 0) {
        await tx.insert(mealIngredientsTable).values(
          body.ingredients.map((ing) => ({
            mealId: id,
            text: ing.text,
            amount: ing.amount ?? '',
            sortOrder: ing.sort_order,
          })),
        );
      }
    }

    if (body.instructions !== undefined) {
      await tx.delete(mealInstructionsTable).where(eq(mealInstructionsTable.mealId, id));
      if (body.instructions && body.instructions.length > 0) {
        await tx.insert(mealInstructionsTable).values(
          body.instructions.map((inst) => ({
            mealId: id,
            text: inst.text,
            image: inst.image ?? null,
            sortOrder: inst.sort_order,
          })),
        );
      }
    }

    if (body.nutrition !== undefined) {
      await tx.delete(mealNutritionTable).where(eq(mealNutritionTable.mealId, id));
      if (body.nutrition) {
        await tx.insert(mealNutritionTable).values({
          mealId: id,
          calories: body.nutrition.calories,
          protein: body.nutrition.protein ?? null,
          carbs: body.nutrition.carbs ?? null,
          fat: body.nutrition.fat ?? null,
        });
      }
    }
  });

  return getMealById(id);
}

export async function getMealById(id: string): Promise<MealDetail | null> {
  return db
    .select({
      id: mealsTable.id,
      title: mealsTable.title,
      slug: mealsTable.slug,
      image: mealsTable.image,
      description: mealsTable.description,
      cookTime: mealsTable.cookTime,
      difficulty: mealsTable.difficulty,
      mealType: sql<MealTypeResponse[] | null>`
        json_agg(${mealTypesTable.mealType})
          filter (where ${mealTypesTable.mealType} is not null)
      `,
    })
    .from(mealsTable)
    .leftJoin(mealTypesTable, eq(mealTypesTable.mealId, mealsTable.id))
    .where(eq(mealsTable.id, id))
    .groupBy(
      mealsTable.id,
      mealsTable.title,
      mealsTable.slug,
      mealsTable.image,
      mealsTable.description,
      mealsTable.cookTime,
      mealsTable.difficulty,
    )
    .limit(1)
    .then(async ([meal]) => {
      if (!meal) {
        return null;
      }

      return getMealWithDetails(meal);
    });
}
