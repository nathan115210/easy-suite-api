import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { meals } from './meals.table';

export const mealNutrition = pgTable('meal_nutrition', {
  mealId: uuid('meal_id')
    .primaryKey()
    .references(() => meals.id, { onDelete: 'cascade' }),

  /**
   * Per serving.
   */
  calories: integer('calories').notNull(),

  /**
   * Grams.
   */
  protein: integer('protein'),
  carbs: integer('carbs'),
  fat: integer('fat'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
