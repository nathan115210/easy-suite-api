import type { Request, Response, NextFunction } from 'express';
import { AuthErrorType, AuthError } from '@/types/auth.types';
import type {
  SignupRequestBody,
  SigninRequestInput,
} from '@/modules/auth/auth-token/auth-token.schema';

jest.mock('@/modules/auth/auth-token/auth-token.service', () => ({
  tokenSignupService: jest.fn(),
  tokenSigninService: jest.fn(),
}));

jest.mock('@/modules/auth/auth-token/auth-token.cookies', () => ({
  setRefreshTokenCookie: jest.fn(),
  clearRefreshTokenCookie: jest.fn(),
}));

import {
  tokenSignupService,
  tokenSigninService,
} from '@/modules/auth/auth-token/auth-token.service';
import { setRefreshTokenCookie } from '@/modules/auth/auth-token/auth-token.cookies';
import {
  tokenSignupController,
  tokenSigninController,
} from '@/modules/auth/auth-token/auth-token.controller';

const mockTokenSignupService = tokenSignupService as jest.Mock;
const mockTokenSigninService = tokenSigninService as jest.Mock;
const mockSetRefreshTokenCookie = setRefreshTokenCookie as jest.Mock;

const validBody: SignupRequestBody = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password1',
};

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
};

const mockAccessTokenExpiresAt = new Date('2030-01-01T00:15:00Z');
const mockRefreshTokenExpiresAt = new Date('2030-01-08T00:00:00Z');

const mockServiceResult = {
  message: 'Signup successful',
  user: mockUser,
  accessToken: 'opaque-access-token',
  accessTokenExpiresAt: mockAccessTokenExpiresAt,
  refreshToken: 'opaque-refresh-token',
  refreshTokenExpiresAt: mockRefreshTokenExpiresAt,
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

describe('tokenSignupController', () => {
  it('returns 201 with user and access token on successful signup', async () => {
    mockTokenSignupService.mockResolvedValue(mockServiceResult);
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Signup successful',
      data: {
        user: mockUser,
        accessToken: 'opaque-access-token',
        accessTokenExpiresAt: mockAccessTokenExpiresAt,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the refresh token cookie on successful signup', async () => {
    mockTokenSignupService.mockResolvedValue(mockServiceResult);
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(mockSetRefreshTokenCookie).toHaveBeenCalledWith(res, 'opaque-refresh-token');
  });

  it('passes the parsed body to the service', async () => {
    mockTokenSignupService.mockResolvedValue(mockServiceResult);
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(mockTokenSignupService).toHaveBeenCalledWith(validBody);
  });

  it('returns 400 with VALIDATION_ERROR when body fails schema validation', async () => {
    const req = {
      body: { username: 'ab', email: 'not-an-email', password: '123' },
    } as unknown as Request<Record<string, string>, unknown, SignupRequestBody>;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockTokenSignupService).not.toHaveBeenCalled();
  });

  it('returns 400 with VALIDATION_ERROR when required fields are missing', async () => {
    const req = { body: {} } as unknown as Request<
      Record<string, string>,
      unknown,
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
  });

  it('calls next with the error when the service throws', async () => {
    const error = new AuthError(409, AuthErrorType.EMAIL_ALREADY_IN_USE, 'Email is already in use');
    mockTokenSignupService.mockRejectedValue(error);
    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSignupController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

const validSigninBody: SigninRequestInput = {
  identifier: 'test@example.com',
  password: 'Password1',
};

const mockSigninServiceResult = {
  message: 'Signin successful',
  user: mockUser,
  accessToken: 'opaque-access-token',
  accessTokenExpiresAt: mockAccessTokenExpiresAt,
  refreshToken: 'opaque-refresh-token',
  refreshTokenExpiresAt: mockRefreshTokenExpiresAt,
};

describe('tokenSigninController', () => {
  it('returns 200 with user and access token on successful signin', async () => {
    mockTokenSigninService.mockResolvedValue(mockSigninServiceResult);
    const req = { body: validSigninBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestInput
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Signin successful',
      data: {
        user: mockUser,
        accessToken: 'opaque-access-token',
        accessTokenExpiresAt: mockAccessTokenExpiresAt,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the refresh token cookie on successful signin', async () => {
    mockTokenSigninService.mockResolvedValue(mockSigninServiceResult);
    const req = { body: validSigninBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestInput
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(mockSetRefreshTokenCookie).toHaveBeenCalledWith(res, 'opaque-refresh-token');
  });

  it('passes the parsed (transformed) credentials to the service', async () => {
    mockTokenSigninService.mockResolvedValue(mockSigninServiceResult);
    const req = {
      body: { email: 'test@example.com', password: 'Password1' },
    } as unknown as Request<Record<string, string>, unknown, SigninRequestInput>;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(mockTokenSigninService).toHaveBeenCalledWith({
      identifier: 'test@example.com',
      password: 'Password1',
    });
  });

  it('returns 400 with VALIDATION_ERROR when no identifier, email, or username is provided', async () => {
    const req = {
      body: { password: 'Password1' },
    } as unknown as Request<Record<string, string>, unknown, SigninRequestInput>;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockTokenSigninService).not.toHaveBeenCalled();
  });

  it('returns 400 with VALIDATION_ERROR when password is missing', async () => {
    const req = {
      body: { identifier: 'test@example.com' },
    } as unknown as Request<Record<string, string>, unknown, SigninRequestInput>;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
  });

  it('calls next with the error when the service throws', async () => {
    const error = new AuthError(401, AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
    mockTokenSigninService.mockRejectedValue(error);
    const req = { body: validSigninBody } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestInput
    >;
    const res = makeRes();
    const next = makeNext();

    await tokenSigninController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
