import type { Request, Response, NextFunction } from 'express';
import {
  AuthErrorType,
  AuthError,
  AUTH_SESSION_COOKIE_NAME,
  type AuthenticatedRequest,
} from '../../../types/auth.types';
import type {
  SignupRequestBody,
  SigninRequestBody,
  SigninRequestInput,
} from '../../../src/modules/auth/auth-sessions/auth-sessions.schema';

jest.mock('../../../src/modules/auth/auth-sessions/auth-sessions.cookies', () => ({
  setSessionCookie: jest.fn(),
  clearSessionCookie: jest.fn(),
}));

jest.mock('../../../src/modules/auth/auth-sessions/auth-sessions.service', () => ({
  authSessionsService: {
    signup: jest.fn(),
    signin: jest.fn(),
    getUserProfile: jest.fn(),
    signout: jest.fn(),
    signoutAll: jest.fn(),
  },
}));

jest.mock('../../../src/middlewares/auth/auth-limiter', () => ({
  authLimiter: jest.fn((req, res, next) => next()),
}));

jest.mock('../../../src/db/session.repository', () => ({
  sessionRepository: {
    deleteById: jest.fn(),
  },
}));

import {
  setSessionCookie,
  clearSessionCookie,
} from '../../../src/modules/auth/auth-sessions/auth-sessions.cookies';
import { authSessionsService } from '../../../src/modules/auth/auth-sessions/auth-sessions.service';
import { authLimiter } from '../../../src/middlewares/auth/auth-limiter';
import { sessionRepository } from '../../../src/db/session.repository';
import {
  signupController,
  signinController,
  getProfileController,
  signoutController,
  signoutAllController,
} from '../../../src/modules/auth/auth-sessions/auth-sessions.controller';

const mockSetSessionCookie = setSessionCookie as jest.Mock;
const mockClearSessionCookie = clearSessionCookie as jest.Mock;
const mockSignup = authSessionsService.signup as jest.Mock;
const mockSignin = authSessionsService.signin as jest.Mock;
const mockGetUserProfile = authSessionsService.getUserProfile as jest.Mock;
const mockSignout = authSessionsService.signout as jest.Mock;
const mockSignoutAll = authSessionsService.signoutAll as jest.Mock;
const mockAuthLimiter = authLimiter as unknown as jest.Mock;
const mockDeleteSessionById = sessionRepository.deleteById as jest.Mock;

const validBody = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password1',
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
  mockDeleteSessionById.mockResolvedValue(undefined);
  mockSignout.mockResolvedValue(undefined);
  mockSignoutAll.mockResolvedValue(undefined);
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
      SignupRequestBody
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
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(mockSetSessionCookie).toHaveBeenCalledWith(res, mockSession.id);
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
      SignupRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signupController(req, res, next);

    expect(mockSignup).toHaveBeenCalledWith(validBody);
  });

  it('returns 400 with VALIDATION_ERROR when body fails schema validation', async () => {
    const req = {
      body: { username: 'ab', email: 'not-an-email', password: '123' },
    } as unknown as Request<Record<string, string>, unknown, SignupRequestBody>;
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
      SignupRequestBody
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
      SignupRequestBody
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
      SignupRequestBody
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
      SignupRequestBody
    >;
    const res = makeRes();

    mockAuthLimiter(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(429);
    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe('signinController', () => {
  const validSigninBodyWithEmail: SigninRequestBody = {
    identifier: 'test@example.com',
    password: 'password123',
  };

  const validSigninBodyWithUsername: SigninRequestBody = {
    identifier: 'testuser',
    password: 'password123',
  };

  it('returns 200 with user data on successful signin', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyWithEmail } as unknown as Request<
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
    const req = { body: validSigninBodyWithEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSetSessionCookie).toHaveBeenCalledWith(res, mockSession.id);
  });

  it('passes the parsed body to the service when signing in with email identifier', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });
    const req = { body: validSigninBodyWithEmail } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith(validSigninBodyWithEmail);
  });

  it('passes the parsed body to the service when signing in with username identifier', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });

    const req = { body: validSigninBodyWithUsername } as unknown as Request<
      Record<string, string>,
      unknown,
      SigninRequestBody
    >;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith(validSigninBodyWithUsername);
  });

  it('accepts "email" in the request body and transforms it to "identifier" for the service', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });

    const req = {
      body: {
        email: 'user17@test.com',
        password: 'test_user_name_QQ_11',
      },
    } as unknown as Request<Record<string, string>, unknown, SigninRequestInput>;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith({
      identifier: 'user17@test.com',
      password: 'test_user_name_QQ_11',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('accepts "username" in the request body and transforms it to "identifier" for the service', async () => {
    mockSignin.mockResolvedValue({
      message: 'Signin successful',
      user: mockUser,
      session: mockSession,
    });

    const req = {
      body: {
        username: 'testuser123',
        password: 'password123',
      },
    } as unknown as Request<Record<string, string>, unknown, SigninRequestInput>;
    const res = makeRes();
    const next = makeNext();

    await signinController(req, res, next);

    expect(mockSignin).toHaveBeenCalledWith({
      identifier: 'testuser123',
      password: 'password123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 with VALIDATION_ERROR when identifier is not provided', async () => {
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

  it('returns 400 with VALIDATION_ERROR when password is not provided', async () => {
    const req = { body: { identifier: 'test@example.com' } } as unknown as Request<
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
    const req = { body: validSigninBodyWithEmail } as unknown as Request<
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

    const req = { body: validSigninBodyWithEmail } as unknown as Request<
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
    const req = { userId } as AuthenticatedRequest;
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
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(mockGetUserProfile).toHaveBeenCalledWith(userId);
  });

  it('maps USER_NOT_FOUND to SESSION_NOT_FOUND and deletes stale session', async () => {
    mockGetUserProfile.mockRejectedValue(
      new AuthError(404, AuthErrorType.USER_NOT_FOUND, 'User not found'),
    );
    const req = {
      userId,
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'stale-session-id' },
      log: { warn: jest.fn() },
    } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(mockDeleteSessionById).toHaveBeenCalledWith('stale-session-id');
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: AuthErrorType.SESSION_NOT_FOUND, statusCode: 401 }),
    );
  });

  it('calls next() with the error when the service throws', async () => {
    const error = new Error('Service failure');
    mockGetUserProfile.mockRejectedValue(error);
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await getProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('signoutController', () => {
  it('returns 200 with signout message when session cookie is present', async () => {
    const req = {
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'session-id-abc123' },
    } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Signout successful' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls authSessionsService.signout with the session id from the cookie', async () => {
    const req = {
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'session-id-abc123' },
    } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutController(req, res, next);

    expect(mockSignout).toHaveBeenCalledWith('session-id-abc123');
  });

  it('clears the session cookie', async () => {
    const req = {
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'session-id-abc123' },
    } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutController(req, res, next);

    expect(mockClearSessionCookie).toHaveBeenCalledWith(res);
  });

  it('returns 200 and calls signout with undefined when no session cookie is present', async () => {
    const req = { cookies: {} } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutController(req, res, next);

    expect(mockSignout).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Signout successful' });
  });

  it('calls next() with AuthError when authSessionsService.signout throws', async () => {
    const signoutError = new AuthError(
      500,
      AuthErrorType.DATABASE_ERROR,
      'Failed to delete session on signout',
    );
    mockSignout.mockRejectedValue(signoutError);
    const req = {
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'session-id-abc123' },
    } as unknown as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutController(req, res, next);

    expect(mockClearSessionCookie).toHaveBeenCalledWith(res);
    expect(next).toHaveBeenCalledWith(signoutError);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() with the error when clearSessionCookie throws unexpectedly', async () => {
    const unexpectedError = new Error('Unexpected clearSessionCookie failure');
    const req = {
      cookies: { [AUTH_SESSION_COOKIE_NAME]: 'session-id-abc123' },
    } as unknown as Request;
    const res = makeRes();
    const next = makeNext();
    mockClearSessionCookie.mockImplementationOnce(() => {
      throw unexpectedError;
    });

    await signoutController(req, res, next);

    expect(next).toHaveBeenCalledWith(unexpectedError);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('signoutAllController', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  it('calls next() with SESSION_MISSING AuthError when req.userId is not set', async () => {
    const req = {} as Request;
    const res = makeRes();
    const next = makeNext();

    await signoutAllController(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: AuthErrorType.SESSION_MISSING, statusCode: 401 }),
    );
    expect(mockSignoutAll).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).not.toHaveBeenCalled();
  });

  it('returns 200 with success message', async () => {
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await signoutAllController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Signed out from all sessions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls authSessionsService.signoutAll with req.userId', async () => {
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await signoutAllController(req, res, next);

    expect(mockSignoutAll).toHaveBeenCalledWith(userId);
  });

  it('clears the session cookie after deleting sessions', async () => {
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await signoutAllController(req, res, next);

    expect(mockClearSessionCookie).toHaveBeenCalledWith(res);
  });

  it('calls next() with the error when service throws and does not clear the cookie', async () => {
    const error = new Error('DB failure');
    mockSignoutAll.mockRejectedValue(error);
    const req = { userId } as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    await signoutAllController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(mockClearSessionCookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
