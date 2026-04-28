import { z } from 'zod';
import { registry } from '../../openapi/registry';
import { MealType } from '../../../easy-meal-api.types';

const MealTypeResponseSchema = z.enum([
  MealType.Breakfast,
  MealType.Lunch,
  MealType.Dinner,
  MealType.Snacks,
  MealType.Dessert,
  MealType.Drinks,
]);

export const MealSchema = registry.register(
  'Meal',
  z.object({
    id: z.string().uuid().openapi({ description: 'Unique meal identifier' }),
    title: z.string().openapi({ description: 'Display name of the meal' }),
    slug: z.string().openapi({ description: 'URL-safe identifier' }),
    image: z.string().openapi({ description: 'Image URL' }),
    description: z.string().openapi({ description: 'Short description' }),
    cookTime: z.number().int().nullable().openapi({ description: 'Cook time in minutes' }),
    difficulty: z
      .enum(['easy', 'medium', 'hard'])
      .nullable()
      .openapi({ description: 'Difficulty level' }),
    mealType: z
      .array(MealTypeResponseSchema)
      .nullable()
      .openapi({ description: 'Meal categories, or null when no meal types are assigned' }),
  }),
);

export type Meal = z.infer<typeof MealSchema>;

export const MealSearchQuerySchema = z.object({
  q: z.string().optional().openapi({ description: 'Search keyword matched against meal titles' }),
  difficulty: z
    .enum(['any', 'easy', 'medium', 'hard'])
    .optional()
    .openapi({ description: 'Filter by meal difficulty' }),
  cookTime: z
    .enum(['any', 'under_15', 'under_30', 'under_45', 'under_60', 'over_60'])
    .optional()
    .openapi({ description: 'Filter by cook time bucket' }),
  sort: z
    .enum(['created_desc', 'created_asc', 'cook_time_asc', 'cook_time_desc'])
    .optional()
    .openapi({ description: 'Sort order for meal results' }),
});

registry.registerPath({
  method: 'get',
  path: '/v1/meals',
  summary: 'List all meals',
  tags: ['Meals'],
  request: {
    query: MealSearchQuerySchema,
  },
  responses: {
    200: {
      description: 'A list of meals',
      content: { 'application/json': { schema: z.object({ data: z.array(MealSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/meals/{id}',
  summary: 'Get a meal by ID',
  tags: ['Meals'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Meal UUID' }),
    }),
  },
  responses: {
    200: {
      description: 'The requested meal',
      content: { 'application/json': { schema: z.object({ data: MealSchema }) } },
    },
    400: {
      description: 'Invalid UUID format',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('INVALID_UUID'),
              message: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Meal not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('NOT_FOUND'),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
});
