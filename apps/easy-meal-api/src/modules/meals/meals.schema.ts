import { z } from 'zod';
import { registry } from '../../openapi/registry';

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
  }),
);

export type Meal = z.infer<typeof MealSchema>;

registry.registerPath({
  method: 'get',
  path: '/v1/meals',
  summary: 'List all meals',
  tags: ['Meals'],
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
