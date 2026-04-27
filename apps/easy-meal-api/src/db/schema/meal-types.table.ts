import { index, pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { meals } from './meals.table';

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
  'dessert',
  'drinks',
]);

export const mealMealTypes = pgTable(
  'meal_meal_types',
  {
    mealId: uuid('meal_id')
      .notNull()
      .references(() => meals.id, { onDelete: 'cascade' }),

    mealType: mealTypeEnum('meal_type').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.mealId, table.mealType],
    }),
    index('meal_meal_types_meal_id_idx').on(table.mealId),
    index('meal_meal_types_type_idx').on(table.mealType),
  ],
);
