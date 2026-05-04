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

export const MealIngredientSchema = registry.register(
  'MealIngredient',
  z.object({
    text: z.string().openapi({ description: 'Ingredient description' }),
    amount: z.string().optional().openapi({ description: 'Ingredient amount' }),
    sort_order: z.number().int().openapi({ description: 'Ingredient order in the list' }),
  }),
);

export type MealIngredient = z.infer<typeof MealIngredientSchema>;

export const MealInstructionSchema = registry.register(
  'MealInstruction',
  z.object({
    text: z.string().openapi({ description: 'Instruction text' }),
    image: z
      .string()
      .optional()
      .nullable()
      .openapi({ description: 'Instruction image URL, if available. ' }),
    sort_order: z.number().int().openapi({ description: 'Instruction order in the list' }),
  }),
);

export type MealInstruction = z.infer<typeof MealInstructionSchema>;

export const MealNutritionSchema = registry.register(
  'MealNutrition',
  z.object({
    calories: z.number().int().openapi({ description: 'Calories in kcal' }),
    protein: z.number().nullable().openapi({ description: 'Protein content in grams' }),
    carbs: z.number().nullable().openapi({ description: 'Carbohydrates content in grams' }),
    fat: z.number().nullable().openapi({ description: 'Fat content in grams' }),
  }),
);

export type MealNutrition = z.infer<typeof MealNutritionSchema>;

export const MealDetailSchema = registry.register(
  'MealDetail',
  MealSchema.extend({
    ingredients: z
      .array(MealIngredientSchema)
      .nullable()
      .openapi({ description: 'Ingredients ordered by sort_order, or null when unavailable' }),
    instructions: z.array(MealInstructionSchema).nullable().openapi({
      description: 'Preparation instructions ordered by sort_order, or null when unavailable',
    }),
    nutrition: MealNutritionSchema.nullable().openapi({
      description: 'Per-serving nutrition details, or null when unavailable',
    }),
  }),
);

export type MealDetail = z.infer<typeof MealDetailSchema>;

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
      content: { 'application/json': { schema: z.object({ data: z.array(MealDetailSchema) }) } },
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
      content: { 'application/json': { schema: z.object({ data: MealDetailSchema }) } },
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
