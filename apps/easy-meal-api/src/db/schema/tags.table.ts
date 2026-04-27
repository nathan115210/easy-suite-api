import { index, pgTable, primaryKey, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { mealsTable } from './meals.table';

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull().unique(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('tags_slug_idx').on(table.slug)],
);

export const mealTags = pgTable(
  'meal_tags',
  {
    mealId: uuid('meal_id')
      .notNull()
      .references(() => mealsTable.id, { onDelete: 'cascade' }),

    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),

    /**
     * Optional but useful.
     * Lets the GraphQL/API layer return topTags as the first 3 ordered tags.
     */
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.mealId, table.tagId],
    }),
    index('meal_tags_meal_id_idx').on(table.mealId),
    index('meal_tags_tag_id_idx').on(table.tagId),
    index('meal_tags_meal_sort_idx').on(table.mealId, table.sortOrder),
  ],
);
