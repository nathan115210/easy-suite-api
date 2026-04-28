import { index, pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { mealsTable } from './meals.table';

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
  'dessert',
  'drinks',
]);

export const mealTypesTable = pgTable(
  'meal_types',
  {
    mealId: uuid('meal_id')
      .notNull()
      .references(() => mealsTable.id, { onDelete: 'cascade' }),

    mealType: mealTypeEnum('meal_type').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.mealId, table.mealType],
    }),
    index('meal_types_meal_id_idx').on(table.mealId),
    index('meal_types_type_idx').on(table.mealType),
  ],
);
