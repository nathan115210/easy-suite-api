import type { Request, Response, NextFunction } from 'express';
import { AuthErrorType, AUTH_SESSION_COOKIE_NAME } from '../../../types/auth.types';

jest.mock('../../../src/db/session.repository', () => ({
  sessionRepository: {
    findValidSessionById: jest.fn(),
  },
}));

import { sessionRepository } from '../../../src/db/session.repository';
import { requireAuthSessions } from '../../../src/middlewares/auth/auth-session/requireAuthSessions';

const mockFindValidSessionById = sessionRepository.findValidSessionById as jest.Mock;

const sessionId = 'session-id-abc123';
const userId = '550e8400-e29b-41d4-a716-446655440000';

const mockValidSession = {
  id: sessionId,
  userId,
  expiresAt: new Date('2030-01-01'),
  createdAt: new Date(),
};

function makeReq(cookieValue?: string): Request {
  return {
    cookies: cookieValue !== undefined ? { [AUTH_SESSION_COOKIE_NAME]: cookieValue } : {},
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as unknown as Response;
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindValidSessionById.mockResolvedValue(mockValidSession);
});

describe('requireAuthSessions', () => {
  it('calls next() without error on a valid session cookie', async () => {
    const req = makeReq(sessionId);
    const next = makeNext();

    await requireAuthSessions(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('sets req.userId from the session data', async () => {
    const req = makeReq(sessionId);

    await requireAuthSessions(req, makeRes(), makeNext());

    expect(req.userId).toBe(userId);
  });

  it('calls findValidSessionById with the cookie value', async () => {
    const req = makeReq(sessionId);

    await requireAuthSessions(req, makeRes(), makeNext());

    expect(mockFindValidSessionById).toHaveBeenCalledWith(sessionId);
  });

  it('calls next() with SESSION_MISSING error when the cookie is absent', async () => {
    const req = makeReq();
    const next = makeNext();

    await requireAuthSessions(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: AuthErrorType.SESSION_MISSING }),
    );
    expect(mockFindValidSessionById).not.toHaveBeenCalled();
  });

  it('calls next() with SESSION_NOT_FOUND error when session is not in DB', async () => {
    mockFindValidSessionById.mockResolvedValue(null);
    const req = makeReq(sessionId);
    const next = makeNext();

    await requireAuthSessions(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: AuthErrorType.SESSION_NOT_FOUND }),
    );
  });

  it('does not set req.userId when session is not found', async () => {
    mockFindValidSessionById.mockResolvedValue(null);
    const req = makeReq(sessionId);

    await requireAuthSessions(req, makeRes(), makeNext());

    expect(req.userId).toBeUndefined();
  });

  it('calls next() with the error when findValidSessionById throws', async () => {
    const dbError = new Error('DB failure');
    mockFindValidSessionById.mockRejectedValue(dbError);
    const req = makeReq(sessionId);
    const next = makeNext();

    await requireAuthSessions(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
