import type { Meal } from '../../../src/modules/meals/meals.schema';
import { CookTimeValue, DifficultyLevel, MealType } from '../../../easy-meal-api.types';
import {
  mealIngredientsTable,
  mealInstructionsTable,
  mealNutritionTable,
  mealsTable,
} from '../../../src/db/schema';

jest.mock('../../../src/db/index', () => ({
  db: { select: jest.fn() },
  pool: {},
}));

import { db } from '../../../src/db/index';
import { getAllMeals, getMealById } from '../../../src/modules/meals/meals.service';

const mockSelect = db.select as jest.Mock;
let builders: ReturnType<typeof makeQueryBuilder>[];

function queueSelectResults(...resultSets: unknown[][]) {
  const queue = [...resultSets];
  mockSelect.mockImplementation(() => {
    const rows = queue.length > 0 ? queue.shift()! : [];
    const builder = makeQueryBuilder(rows);
    builders.push(builder);
    return builder;
  });
}

function makeQueryBuilder(rows: unknown[]) {
  // Mimics Drizzle's thenable builder: supports the chain used by meals.service.
  const builder = {
    $dynamic: jest.fn(),
    from: jest.fn(),
    leftJoin: jest.fn(),
    groupBy: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    then(
      resolve: (value: unknown) => unknown,
      reject?: (reason?: unknown) => unknown,
    ): Promise<unknown> {
      return Promise.resolve(rows).then(resolve, reject);
    },
  };
  builder.$dynamic.mockReturnValue(builder);
  builder.from.mockReturnValue(builder);
  builder.leftJoin.mockReturnValue(builder);
  builder.groupBy.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  return builder;
}

const mockMeal: Meal = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  image: 'https://example.com/image.jpg',
  description: 'A classic Italian pasta dish',
  cookTime: 30,
  difficulty: 'medium',
  mealType: [MealType.Dinner],
};

beforeEach(() => {
  mockSelect.mockReset();
  builders = [];
});

describe('getAllMeals', () => {
  it('returns all meals from the database', async () => {
    queueSelectResults([mockMeal], [], [], []);
    const result = await getAllMeals();
    expect(result).toEqual([
      {
        ...mockMeal,
        ingredients: null,
        instructions: null,
        nutrition: null,
      },
    ]);
    expect(mockSelect).toHaveBeenCalledTimes(4);
    expect(builders[0]!.where).not.toHaveBeenCalled();
    expect(builders[0]!.orderBy).toHaveBeenCalledTimes(1);
    expect(builders[1]!.from).toHaveBeenCalledWith(mealIngredientsTable);
    expect(builders[2]!.from).toHaveBeenCalledWith(mealInstructionsTable);
    expect(builders[3]!.from).toHaveBeenCalledWith(mealNutritionTable);
  });

  it('returns an empty array when no meals exist', async () => {
    mockSelect.mockReturnValue(makeQueryBuilder([]));
    const result = await getAllMeals();
    expect(result).toEqual([]);
  });

  it('selects the expected columns', async () => {
    mockSelect.mockReturnValue(makeQueryBuilder([]));
    await getAllMeals();
    const selectedFields = mockSelect.mock.calls[0]![0] as Record<string, unknown>;
    expect(selectedFields).toHaveProperty('id');
    expect(selectedFields).toHaveProperty('title');
    expect(selectedFields).toHaveProperty('slug');
    expect(selectedFields).toHaveProperty('image');
    expect(selectedFields).toHaveProperty('description');
    expect(selectedFields).toHaveProperty('cookTime');
    expect(selectedFields).toHaveProperty('difficulty');
    expect(selectedFields).toHaveProperty('mealType');
  });

  it('joins and groups meal types', async () => {
    queueSelectResults([mockMeal], [], [], []);

    await getAllMeals();

    expect(builders[0]!.leftJoin).toHaveBeenCalledTimes(1);
    expect(builders[0]!.groupBy).toHaveBeenCalledTimes(1);
  });

  it('returns a meal with null mealType when no meal types exist', async () => {
    const mealWithoutTypes: Meal = { ...mockMeal, mealType: null };
    queueSelectResults([mealWithoutTypes], [], [], []);

    const result = await getAllMeals();

    expect(result).toEqual([
      {
        ...mealWithoutTypes,
        ingredients: null,
        instructions: null,
        nutrition: null,
      },
    ]);
  });

  it('applies keyword, difficulty, and cook time filters together', async () => {
    queueSelectResults([mockMeal], [], [], []);

    await getAllMeals({
      q: 'spaghetti',
      difficulty: DifficultyLevel.Medium,
      cookTime: CookTimeValue.Under30,
    });

    expect(builders[0]!.where).toHaveBeenCalledTimes(1);
    expect(builders[0]!.orderBy).toHaveBeenCalledTimes(1);
  });

  it('skips any difficulty and cook time filters', async () => {
    queueSelectResults([mockMeal], [], [], []);

    await getAllMeals({
      difficulty: DifficultyLevel.Any,
      cookTime: CookTimeValue.Any,
    });

    expect(builders[0]!.where).not.toHaveBeenCalled();
    expect(builders[0]!.orderBy).toHaveBeenCalledTimes(1);
  });

  it('supports alternate sort options', async () => {
    queueSelectResults([mockMeal], [], [], []);

    await getAllMeals({ sort: 'cook_time_asc' });

    expect(builders[0]!.orderBy).toHaveBeenCalledTimes(1);
  });

  it('includes ingredients, instructions, and nutrition for each meal', async () => {
    const ingredients = [
      { text: 'Olive oil', amount: '1 tbsp', sort_order: 2 },
      { text: 'Pasta', amount: '200g', sort_order: 1 },
    ];
    const instructions = [
      { text: 'Serve warm', image: null, sort_order: 2 },
      { text: 'Boil pasta', image: null, sort_order: 1 },
    ];
    const nutrition = [
      {
        calories: 550,
        protein: null,
        carbs: 70,
        fat: 15,
      },
    ];

    queueSelectResults([mockMeal], ingredients, instructions, nutrition);

    const result = await getAllMeals();

    expect(result).toEqual([
      {
        ...mockMeal,
        ingredients: [
          { text: 'Pasta', amount: '200g', sort_order: 1 },
          { text: 'Olive oil', amount: '1 tbsp', sort_order: 2 },
        ],
        instructions: [
          { text: 'Boil pasta', image: null, sort_order: 1 },
          { text: 'Serve warm', image: null, sort_order: 2 },
        ],
        nutrition: {
          calories: 550,
          protein: null,
          carbs: 70,
          fat: 15,
        },
      },
    ]);
  });
});

describe('getMealById', () => {
  it('returns a meal when found', async () => {
    queueSelectResults([mockMeal], [], [], []);
    const result = await getMealById(mockMeal.id);

    expect(result).toEqual({
      ...mockMeal,
      ingredients: null,
      instructions: null,
      nutrition: null,
    });

    expect(mockSelect).toHaveBeenCalledTimes(4);
    expect(builders[0]!.from).toHaveBeenCalledWith(mealsTable);
    expect(builders[1]!.from).toHaveBeenCalledWith(mealIngredientsTable);
    expect(builders[2]!.from).toHaveBeenCalledWith(mealInstructionsTable);
    expect(builders[3]!.from).toHaveBeenCalledWith(mealNutritionTable);
  });

  it('returns null when no meal matches the id', async () => {
    queueSelectResults([]);
    const result = await getMealById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('returns a meal with nullable fields set to null', async () => {
    const mealWithNulls: Meal = {
      ...mockMeal,
      cookTime: null,
      difficulty: null,
      mealType: null,
    };
    queueSelectResults([mealWithNulls], [], [], []);
    const result = await getMealById(mockMeal.id);
    expect(result).toEqual({
      ...mealWithNulls,
      ingredients: null,
      instructions: null,
      nutrition: null,
    });
  });

  it('sorts ingredients by sort_order via getIngredientsByMealId', async () => {
    const ingredients = [
      { text: 'Olive oil', amount: '1 tbsp', sort_order: 2 },
      { text: 'Pasta', amount: '200g', sort_order: 1 },
    ];

    queueSelectResults([mockMeal], ingredients, [], []);

    const result = await getMealById(mockMeal.id);

    expect(result).toEqual(
      expect.objectContaining({
        ingredients: [
          { text: 'Pasta', amount: '200g', sort_order: 1 },
          { text: 'Olive oil', amount: '1 tbsp', sort_order: 2 },
        ],
      }),
    );
  });

  it('sorts instructions by sort_order via getInstructionsByMealId', async () => {
    const instructions = [
      { text: 'Serve warm', image: null, sort_order: 2 },
      { text: 'Boil pasta', image: null, sort_order: 1 },
    ];

    queueSelectResults([mockMeal], [], instructions, []);

    const result = await getMealById(mockMeal.id);

    expect(result).toEqual(
      expect.objectContaining({
        instructions: [
          { text: 'Boil pasta', image: null, sort_order: 1 },
          { text: 'Serve warm', image: null, sort_order: 2 },
        ],
      }),
    );
  });

  it('returns one nutrition object via getNutritionByMealId', async () => {
    const nutrition = [
      {
        calories: 550,
        protein: null,
        carbs: 70,
        fat: 15,
      },
    ];

    queueSelectResults([mockMeal], [], [], nutrition);

    const result = await getMealById(mockMeal.id);

    expect(result).toEqual(
      expect.objectContaining({
        nutrition: {
          calories: 550,
          protein: null,
          carbs: 70,
          fat: 15,
        },
      }),
    );
  });

  it('normalizes missing mealType to null in getMealById result', async () => {
    const mealWithoutMealType = {
      ...mockMeal,
      mealType: undefined,
    };

    queueSelectResults([mealWithoutMealType], [], [], []);

    const result = await getMealById(mockMeal.id);

    expect(result).toEqual(
      expect.objectContaining({
        mealType: null,
      }),
    );
  });

  it('returns null data for ingredients, instructions, and nutrition when none exist', async () => {
    queueSelectResults([mockMeal], [], [], []);

    const result = await getMealById(mockMeal.id);

    expect(result).toEqual(
      expect.objectContaining({
        ingredients: null,
        instructions: null,
        nutrition: null,
      }),
    );
  });
});
