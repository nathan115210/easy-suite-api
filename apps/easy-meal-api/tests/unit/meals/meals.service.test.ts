import type { Meal } from '../../../src/modules/meals/meals.schema';

jest.mock('../../../src/db/index', () => ({
  db: { select: jest.fn() },
  pool: {},
}));

import { db } from '../../../src/db/index';
import { getAllMeals, getMealById } from '../../../src/modules/meals/meals.service';

const mockSelect = db.select as jest.Mock;

function makeQueryBuilder(rows: unknown[]) {
  // Mimics Drizzle's thenable builder: supports .from().where().limit().then()
  const builder = {
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    then(
      resolve: (value: unknown) => unknown,
      reject?: (reason?: unknown) => unknown,
    ): Promise<unknown> {
      return Promise.resolve(rows).then(resolve, reject);
    },
  };
  builder.from.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
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
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAllMeals', () => {
  it('returns all meals from the database', async () => {
    mockSelect.mockReturnValue(makeQueryBuilder([mockMeal]));
    const result = await getAllMeals();
    expect(result).toEqual([mockMeal]);
    expect(mockSelect).toHaveBeenCalledTimes(1);
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
  });
});

describe('getMealById', () => {
  it('returns a meal when found', async () => {
    mockSelect.mockReturnValue(makeQueryBuilder([mockMeal]));
    const result = await getMealById(mockMeal.id);
    expect(result).toEqual(mockMeal);
  });

  it('returns null when no meal matches the id', async () => {
    mockSelect.mockReturnValue(makeQueryBuilder([]));
    const result = await getMealById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('returns a meal with nullable fields set to null', async () => {
    const mealWithNulls: Meal = { ...mockMeal, cookTime: null, difficulty: null };
    mockSelect.mockReturnValue(makeQueryBuilder([mealWithNulls]));
    const result = await getMealById(mockMeal.id);
    expect(result).toEqual(mealWithNulls);
  });
});
