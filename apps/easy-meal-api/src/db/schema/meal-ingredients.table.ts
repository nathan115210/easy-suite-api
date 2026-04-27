import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { mealsTable } from './meals.table';

export const mealIngredients = pgTable(
  'meal_ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mealId: uuid('meal_id')
      .notNull()
      .references(() => mealsTable.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    amount: varchar('amount', { length: 120 }).notNull(),

    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('meal_ingredients_meal_id_idx').on(table.mealId),
    index('meal_ingredients_meal_sort_idx').on(table.mealId, table.sortOrder),
  ],
);
