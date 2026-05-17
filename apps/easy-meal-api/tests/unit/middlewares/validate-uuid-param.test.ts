import { validateUuidParam } from '@/middlewares/validate-uuid-param';
import type { Request, Response, NextFunction } from 'express';

function makeReqResNext(paramValue: string, paramName = 'id') {
  const req = { params: { [paramName]: paramValue } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('validateUuidParam', () => {
  it('calls next() for a valid UUID v4', () => {
    const { req, res, next } = makeReqResNext('550e8400-e29b-41d4-a716-446655440000');
    validateUuidParam('id')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with INVALID_ID for a non-UUID string', () => {
    const { req, res, next } = makeReqResNext('not-a-uuid');
    validateUuidParam('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_ID' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 with INVALID_ID for an empty string', () => {
    const { req, res, next } = makeReqResNext('');
    validateUuidParam('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 with INVALID_ID for a numeric string', () => {
    const { req, res, next } = makeReqResNext('12345');
    validateUuidParam('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('validates against the correct param name', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const req = { params: { mealId: uuid } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    validateUuidParam('mealId')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when the target param is missing from req.params', () => {
    const req = { params: {} } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    validateUuidParam('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
