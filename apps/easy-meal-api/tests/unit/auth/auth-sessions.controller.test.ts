import type { Request, Response, NextFunction } from 'express';
import {
  AuthErrorType,
  AUTH_SESSION_COOKIE_NAME,
  type RegisterUserBody,
  type SigninRequestBody,
} from '../../../types/auth.types';

jest.mock('../../../src/modules/auth/auth-sessions/auth-sessions.service', () => ({
  authSessionsService: {
    signup: jest.fn(),
    signin: jest.fn(),
    getUserProfile: jest.fn(),
  },
}));

jest.mock('../../../src/middlewares/auth/auth-limiter', () => ({
  authLimiter: jest.fn((req, res, next) => next()),
}));

import { authSessionsService } from '../../../src/modules/auth/auth-sessions/auth-sessions.service';
import { authLimiter } from '../../../src/middlewares/auth/auth-limiter';
import {
  signupController,
  signinController,
  getProfileController,
} from '../../../src/modules/auth/auth-sessions/auth-sessions.controller';

const mockSignup = authSessionsService.signup as jest.Mock;
const mockSignin = authSessionsService.signin as jest.Mock;
const mockGetUserProfile = authSessionsService.getUserProfile as jest.Mock;
const mockAuthLimiter = authLimiter as unknown as jest.Mock;

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
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeNext() {
  return jest.fn() as unknown as NextFunction;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthLimiter.mockImplementation((req, res, next) => next());
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

  it('returns 429 when the rate limit is exceeded and does not call the service', () => {
    mockAuthLimiter.mockImplementation((_req, res) => {
      res.status(429).send('Too many requests from this IP, please try again later.');
    });

    const req = { body: validBody } as unknown as Request<
      Record<string, string>,
      unknown,
      RegisterUserBody
    >;
    const res = makeRes();

    mockAuthLimiter(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(429);
    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe('signinController', () => {
  const validSigninBodyByEmail: SigninRequestBody = {
    email: 'test@example.com',
    password: 'password123',
  };

  const validSigninBodyByUsername: SigninRequestBody = {
    username: 'testuser',
    password: 'password123',
  };

  it('returns 200 with user data on successful signin', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyByEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Signin successful',
      data: { user: mockUser },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the session cookie with the session id on successful signin', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyByEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_SESSION_COOKIE_NAME,
      mockSession.id,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('passes the parsed body to the service when signing in by email', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyByEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith(validSigninBodyByEmail);
  });

  it('passes the parsed body to the service when signing in by username', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyByUsername } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith(validSigninBodyByUsername);
  });

  it('returns 400 with VALIDATION_ERROR when neither email nor username is provided', async () => {
    const req = { body: { password: 'password123' } } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockSignin).not.toHaveBeenCalled();
  });

  it('returns 400 with VALIDATION_ERROR when body is empty', async () => {
    const req = { body: {} } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockSignin).not.toHaveBeenCalled();
  });

  it('returns 400 with VALIDATION_ERROR when email format is invalid', async () => {
    const req = { body: { email: 'not-an-email', password: 'password123' } } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: AuthErrorType.VALIDATION_ERROR }),
      }),
    );
    expect(mockSignin).not.toHaveBeenCalled();
  });

  it('includes validation details in the 400 response', async () => {
    const req = { body: {} } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ details: expect.any(Array) }),
      }),
    );
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('Unexpected error');
    mockSignin.mockRejectedValue(error);
    const req = { body: validSigninBodyByEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 429 when the rate limit is exceeded and does not call the service', () => {
    mockAuthLimiter.mockImplementation((_req, res) => {
      res.status(429).send('Too many requests from this IP, please try again later.');
    });

    const req = { body: validSigninBodyByEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();

    mockAuthLimiter(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(429);
    expect(mockSignin).not.toHaveBeenCalled();
  });
});

describe('getProfileController', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    mockGetUserProfile.mockResolvedValue({
      message: 'User profile retrieved successfully',
      user: mockUser,
    });
  });

  it('returns 200 with user data when userId is present on request', async () => {
    const req = { userId } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User profile retrieved successfully',
      data: { user: mockUser },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes userId from request to the service', async () => {
    const req = { userId } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(mockGetUserProfile).toHaveBeenCalledWith(userId);
  });

  it('calls next() with SESSION_MISSING error when userId is not on request', async () => {
    const req = {} as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SESSION_MISSING', statusCode: 401 }),
    );
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('Service failure');
    mockGetUserProfile.mockRejectedValue(error);
    const req = { userId } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
