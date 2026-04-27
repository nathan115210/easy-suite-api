import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const difficultyLevelEnum = pgEnum('difficulty_level', ['easy', 'medium', 'hard']);
export const mealsTable = pgTable(
  'meals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull().unique(),

    /**
     * Matches Meal.image
     */
    image: text('image').notNull(),

    description: text('description').notNull(),

    /**
     * Matches Meal.cookTime
     * Stored in minutes.
     */
    cookTime: integer('cook_time'),

    /**
     * Matches Meal.difficulty
     * Do not store "any"; "any" is only a frontend filter option.
     */
    difficulty: difficultyLevelEnum('difficulty'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('meals_slug_idx').on(table.slug),
    index('meals_difficulty_idx').on(table.difficulty),
    index('meals_cook_time_idx').on(table.cookTime),
    index('meals_created_at_idx').on(table.createdAt),
  ],
);
