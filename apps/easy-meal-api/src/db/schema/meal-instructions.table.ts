import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { meals } from './meals.table';

export const mealInstructions = pgTable(
  'meal_instructions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    mealId: uuid('meal_id')
      .notNull()
      .references(() => meals.id, { onDelete: 'cascade' }),

    image: text('image'),

    text: text('text').notNull(),

    /**
     * Maps to MealInstruction.step at API response time:
     * step = sortOrder + 1
     */
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('meal_instructions_meal_id_idx').on(table.mealId),
    index('meal_instructions_meal_sort_idx').on(table.mealId, table.sortOrder),
  ],
);
