import type { Request, Response, NextFunction } from 'express';
import type { Meal } from '../../../src/modules/meals/meals.schema';

jest.mock('../../../src/modules/meals/meals.service', () => ({
  getAllMeals: jest.fn(),
  getMealById: jest.fn(),
}));

import { getAllMeals, getMealById } from '../../../src/modules/meals/meals.service';
import {
  getAllMealsController,
  getMealByIdController,
} from '../../../src/modules/meals/meals.controller';

const mockGetAllMeals = getAllMeals as jest.Mock;
const mockGetMealById = getMealById as jest.Mock;
type GetAllMealsRequest = Parameters<typeof getAllMealsController>[0];

const mockMeal: Meal = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  image: 'https://example.com/image.jpg',
  description: 'A classic Italian pasta dish',
  cookTime: 30,
  difficulty: 'medium',
};

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeNext() {
  return jest.fn() as unknown as NextFunction;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAllMealsController', () => {
  it('returns 200 with the meals array', async () => {
    mockGetAllMeals.mockResolvedValue([mockMeal]);
    const req = { query: {} } as GetAllMealsRequest;
    const res = makeRes();
    const next = makeNext();

    await getAllMealsController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [mockMeal] });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 200 with an empty array when there are no meals', async () => {
    mockGetAllMeals.mockResolvedValue([]);
    const req = { query: {} } as GetAllMealsRequest;
    const res = makeRes();
    const next = makeNext();

    await getAllMealsController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });

  it('passes search and filter query params to the service', async () => {
    mockGetAllMeals.mockResolvedValue([mockMeal]);
    const query = { q: 'spaghetti', difficulty: 'medium', cookTime: 'under_30' };
    const req = { query } as unknown as GetAllMealsRequest;
    const res = makeRes();
    const next = makeNext();

    await getAllMealsController(req, res, next);

    expect(mockGetAllMeals).toHaveBeenCalledWith(query);
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('DB connection failed');
    mockGetAllMeals.mockRejectedValue(error);
    const req = { query: {} } as GetAllMealsRequest;
    const res = makeRes();
    const next = makeNext();

    await getAllMealsController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('getMealByIdController', () => {
  it('returns 200 with the meal when found', async () => {
    mockGetMealById.mockResolvedValue(mockMeal);
    const req = { params: { id: mockMeal.id } } as unknown as Request<{ id: string }>;
    const res = makeRes();
    const next = makeNext();

    await getMealByIdController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: mockMeal });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes the id param to the service', async () => {
    mockGetMealById.mockResolvedValue(mockMeal);
    const req = { params: { id: mockMeal.id } } as unknown as Request<{ id: string }>;
    const res = makeRes();
    const next = makeNext();

    await getMealByIdController(req, res, next);

    expect(mockGetMealById).toHaveBeenCalledWith(mockMeal.id);
  });

  it('returns 404 with NOT_FOUND when the meal does not exist', async () => {
    mockGetMealById.mockResolvedValue(null);
    const req = {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    } as unknown as Request<{ id: string }>;
    const res = makeRes();
    const next = makeNext();

    await getMealByIdController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Meal not found' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('DB connection failed');
    mockGetMealById.mockRejectedValue(error);
    const req = { params: { id: mockMeal.id } } as unknown as Request<{ id: string }>;
    const res = makeRes();
    const next = makeNext();

    await getMealByIdController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
