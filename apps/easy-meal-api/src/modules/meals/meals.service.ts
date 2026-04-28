import { CookTimeValue, DifficultyLevel, MealType } from '../../../easy-meal-api.types';
import { db } from '../../db';
import { mealsTable, mealTypesTable } from '../../db/schema';
import { searchByKeywordCondition } from '../../utils/searchByKeyword';
import type { Meal } from './meals.schema';
import { and, asc, desc, eq, gt, lte, sql, type SQL } from 'drizzle-orm';

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

export async function getAllMeals(query: MealSearchQuery = {}): Promise<Meal[]> {
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

  return mealsQuery.orderBy(orderBy);
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
    .then(([meal]) => meal ?? null);
}
