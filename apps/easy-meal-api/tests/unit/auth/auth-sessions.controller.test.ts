import type { Request, Response, NextFunction } from 'express';
import {
  AuthErrorType,
  AUTH_SESSION_COOKIE_NAME,
  type RegisterUserBody,
} from '../../../types/auth.types';

jest.mock('../../../src/modules/auth/auth-sessions/auth-sessions.service', () => ({
  authSessionsService: {
    signup: jest.fn(),
  },
}));

import { authSessionsService } from '../../../src/modules/auth/auth-sessions/auth-sessions.service';
import { signupController } from '../../../src/modules/auth/auth-sessions/auth-sessions.controller';

const mockSignup = authSessionsService.signup as jest.Mock;

const validBody = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
};

const mockSession = {
  id: 'session-id-abc123',
  expiresAt: new Date('2030-01-01'),
};

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeNext() {
  return jest.fn() as unknown as NextFunction;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signupController', () => {
  it('returns 201 with user data on successful signup', async () => {
    mockSignup.mockResolvedValue({
      message: 'User created successfully',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      data: { user: mockUser },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the session cookie with the session id on successful signup', async () => {
    mockSignup.mockResolvedValue({
      message: 'User created successfully',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_SESSION_COOKIE_NAME,
      mockSession.id,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('passes the parsed body to the service', async () => {
    mockSignup.mockResolvedValue({
      message: 'User created successfully',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(mockSignup).toHaveBeenCalledWith(validBody);
  });

  it('returns 400 with VALIDATION_ERROR when body fails schema validation', async () => {
    const req = {
      body: { username: 'ab', email: 'not-an-email', password: '123' },
    } as unknown as Request<Record<string, string>, unknown, RegisterUserBody>;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('returns 400 with VALIDATION_ERROR when required fields are missing', async () => {
    const req = { body: {} } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('includes validation details in the 400 response', async () => {
    const req = { body: {} } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ details: expect.any(Array) }),
      }),
    );
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('Unexpected error');
    mockSignup.mockRejectedValue(error);
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
