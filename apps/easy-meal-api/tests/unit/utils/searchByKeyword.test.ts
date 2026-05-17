jest.mock('@/db/index', () => ({
  db: { select: jest.fn() },
  pool: {},
}));

import { db } from '@/db/index';
import { mealsTable } from '@/db/schema';
import { searchByKeyword, searchByKeywordCondition } from '@/utils/searchByKeyword';

const mockSelect = db.select as jest.Mock;

function makeQueryBuilder(rows: unknown[]) {
  const builder = {
    from: jest.fn(),
    where: jest.fn(),
    then(
      resolve: (value: unknown) => unknown,
      reject?: (reason?: unknown) => unknown,
    ): Promise<unknown> {
      return Promise.resolve(rows).then(resolve, reject);
    },
  };

  builder.from.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  return builder;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('searchByKeywordCondition', () => {
  it('returns undefined for an empty keyword', () => {
    expect(searchByKeywordCondition('   ', mealsTable.title)).toBeUndefined();
  });

  it('returns a SQL condition for a keyword', () => {
    expect(searchByKeywordCondition('tomato pasta', mealsTable.title)).toBeDefined();
  });

  it('returns a SQL condition for supported search modes', () => {
    expect(searchByKeywordCondition('tomato pasta', mealsTable.title, 'any')).toBeDefined();
    expect(searchByKeywordCondition('tomato pasta', mealsTable.title, 'all')).toBeDefined();
    expect(searchByKeywordCondition('tomato pasta', mealsTable.title, 'phrase')).toBeDefined();
    expect(searchByKeywordCondition('tomato pasta', mealsTable.title, 'web')).toBeDefined();
  });
});

describe('searchByKeyword', () => {
  it('returns an empty array when keyword is blank', async () => {
    const result = await searchByKeyword('   ', mealsTable.title, mealsTable);

    expect(result).toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('queries the provided table with the generated search condition', async () => {
    const rows = [{ id: 'meal-id', title: 'Tomato Pasta' }];
    const builder = makeQueryBuilder(rows);
    mockSelect.mockReturnValue(builder);

    const result = await searchByKeyword('tomato+pasta', mealsTable.title, mealsTable);

    expect(result).toEqual(rows);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(builder.from).toHaveBeenCalledWith(mealsTable);
    expect(builder.where).toHaveBeenCalledTimes(1);
  });
});
