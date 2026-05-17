import { AuthErrorType, AuthError } from '../../../types/auth.types';

jest.mock('../../../src/db/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/db/session.repository', () => ({
  sessionRepository: {
    createSession: jest.fn(),
    deleteById: jest.fn(),
    deleteAllByUserId: jest.fn(),
  },
}));

const mockDbTransaction = jest.fn(async (callback: (tx: unknown) => unknown) => callback({}));

jest.mock('../../../src/db/index', () => ({
  db: {
    transaction: mockDbTransaction,
  },
}));

jest.mock('../../../src/utils/auth-utils', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  toPublicUser: jest.fn((user: { id: string; username: string; email: string }) => ({
    id: user.id,
    username: user.username,
    email: user.email,
  })),
}));

import { userRepository } from '../../../src/db/user.repository';
import { sessionRepository } from '../../../src/db/session.repository';
import { hashPassword, verifyPassword } from '../../../src/utils/auth-utils';
import { authSessionsService } from '../../../src/modules/auth/auth-sessions/auth-sessions.service';

const mockFindByEmail = userRepository.findByEmail as jest.Mock;
const mockFindByUsername = userRepository.findByUsername as jest.Mock;
const mockFindById = userRepository.findById as jest.Mock;
const mockCreateUser = userRepository.create as jest.Mock;
const mockCreateSession = sessionRepository.createSession as jest.Mock;
const mockDeleteById = sessionRepository.deleteById as jest.Mock;
const mockDeleteAllByUserId = sessionRepository.deleteAllByUserId as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;

const validUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password1',
};

const mockCreatedUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
};

const mockCreatedSession = {
  id: 'session-id-abc123',
  userId: mockCreatedUser.id,
  expiresAt: new Date('2030-01-01'),
  createdAt: new Date(),
};

const mockDbUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashed_password_stored_in_db',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockHashPassword.mockResolvedValue('hashed_password');
  mockFindByEmail.mockResolvedValue(null);
  mockFindByUsername.mockResolvedValue(null);
  mockCreateUser.mockResolvedValue(mockCreatedUser);
  mockCreateSession.mockResolvedValue(mockCreatedSession);
});

describe('authSessionsService.signup', () => {
  it('returns user, session, and success message on valid signup', async () => {
    const result = await authSessionsService.signup(validUserData);

    expect(result).toEqual({
      message: 'User created successfully',
      user: mockCreatedUser,
      session: mockCreatedSession,
    });
  });

  it('hashes the password and passes it to userRepository.create', async () => {
    await authSessionsService.signup(validUserData);

    expect(mockHashPassword).toHaveBeenCalledWith(validUserData.password);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed_password' }),
      expect.any(Object),
    );
  });

  it('creates a session with the new user id', async () => {
    await authSessionsService.signup(validUserData);

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockCreatedUser.id }),
      expect.any(Object),
    );
  });

  it('wraps user and session creation in a transaction', async () => {
    await authSessionsService.signup(validUserData);

    expect(mockDbTransaction).toHaveBeenCalledTimes(1);
  });

  it('creates a session with a future expiry date', async () => {
    await authSessionsService.signup(validUserData);

    const [[sessionData]] = mockCreateSession.mock.calls;
    expect(sessionData.expiresAt).toBeInstanceOf(Date);
    expect(sessionData.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws EMAIL_ALREADY_IN_USE when the email is already registered', async () => {
    mockFindByEmail.mockResolvedValue({ id: 'existing-user-id', email: validUserData.email });

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      statusCode: 409,
      code: AuthErrorType.EMAIL_ALREADY_IN_USE,
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('throws USERNAME_ALREADY_IN_USE when the username is already taken', async () => {
    mockFindByUsername.mockResolvedValue({
      id: 'existing-user-id',
      username: validUserData.username,
    });

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      statusCode: 409,
      code: AuthErrorType.USERNAME_ALREADY_IN_USE,
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('checks email uniqueness before username uniqueness', async () => {
    mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      code: AuthErrorType.EMAIL_ALREADY_IN_USE,
    });
    expect(mockFindByUsername).not.toHaveBeenCalled();
  });

  it('throws DATABASE_ERROR when userRepository.create throws', async () => {
    mockCreateUser.mockRejectedValue(new Error('DB write failure'));

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      statusCode: 500,
      code: AuthErrorType.DATABASE_ERROR,
    });
  });

  it('throws DATABASE_ERROR when sessionRepository.createSession throws', async () => {
    mockCreateSession.mockRejectedValue(new Error('Session DB failure'));

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      statusCode: 500,
      code: AuthErrorType.DATABASE_ERROR,
    });
  });

  it('throws PASSWORD_HASH_FAILED when hashPassword throws', async () => {
    mockHashPassword.mockRejectedValue(new Error('Argon2 failure'));

    await expect(authSessionsService.signup(validUserData)).rejects.toMatchObject({
      statusCode: 500,
      code: AuthErrorType.PASSWORD_HASH_FAILED,
      message: 'Failed to process password',
    });

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('throws an AuthError instance for all error cases', async () => {
    mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });

    await expect(authSessionsService.signup(validUserData)).rejects.toBeInstanceOf(AuthError);
  });
});

describe('authSessionsService.signin', () => {
  beforeEach(() => {
    mockFindByEmail.mockResolvedValue(mockDbUser);
    mockFindByUsername.mockResolvedValue(mockDbUser);
    mockVerifyPassword.mockResolvedValue(true);
  });

  it('returns user (without passwordHash), session, and success message on valid credentials with email', async () => {
    const result = await authSessionsService.signin({
      identifier: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      message: 'Signin successful',
      user: { id: mockDbUser.id, username: mockDbUser.username, email: mockDbUser.email },
      session: mockCreatedSession,
    });
  });

  it('returns user (without passwordHash), session, and success message on valid credentials with username', async () => {
    const result = await authSessionsService.signin({
      identifier: 'testuser',
      password: 'password123',
    });

    expect(result).toEqual({
      message: 'Signin successful',
      user: { id: mockDbUser.id, username: mockDbUser.username, email: mockDbUser.email },
      session: mockCreatedSession,
    });
  });

  it('looks up user by email when identifier is a valid email', async () => {
    await authSessionsService.signin({ identifier: 'test@example.com', password: 'password123' });

    expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockFindByUsername).not.toHaveBeenCalled();
  });

  it('looks up user by username when identifier is not a valid email', async () => {
    await authSessionsService.signin({ identifier: 'testuser', password: 'password123' });

    expect(mockFindByUsername).toHaveBeenCalledWith('testuser');
    expect(mockFindByEmail).not.toHaveBeenCalled();
  });

  it('verifies the password against the stored hash', async () => {
    await authSessionsService.signin({ identifier: 'test@example.com', password: 'password123' });

    expect(mockVerifyPassword).toHaveBeenCalledWith('password123', mockDbUser.passwordHash);
  });

  it('creates a new session with the user id on successful signin', async () => {
    await authSessionsService.signin({ identifier: 'test@example.com', password: 'password123' });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockDbUser.id }),
      expect.any(Object), // executor parameter
    );
  });

  it('creates session with a future expiry date', async () => {
    await authSessionsService.signin({ identifier: 'test@example.com', password: 'password123' });

    const [[sessionData]] = mockCreateSession.mock.calls;
    expect(sessionData.expiresAt).toBeInstanceOf(Date);
    expect(sessionData.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws INVALID_CREDENTIALS when user is not found by email', async () => {
    mockFindByEmail.mockResolvedValue(null);

    await expect(
      authSessionsService.signin({ identifier: 'unknown@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: AuthErrorType.INVALID_CREDENTIALS,
    });
  });

  it('throws INVALID_CREDENTIALS when user is not found by username', async () => {
    mockFindByUsername.mockResolvedValue(null);

    await expect(
      authSessionsService.signin({ identifier: 'unknown', password: 'password123' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: AuthErrorType.INVALID_CREDENTIALS,
    });
  });

  it('throws INVALID_CREDENTIALS when password does not match', async () => {
    mockVerifyPassword.mockResolvedValue(false);

    await expect(
      authSessionsService.signin({ identifier: 'test@example.com', password: 'wrong_password' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: AuthErrorType.INVALID_CREDENTIALS,
    });
  });

  it('does not create a session when credentials are invalid', async () => {
    mockVerifyPassword.mockResolvedValue(false);

    await expect(
      authSessionsService.signin({ identifier: 'test@example.com', password: 'wrong_password' }),
    ).rejects.toBeDefined();

    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('throws an AuthError instance for all error cases', async () => {
    mockFindByEmail.mockResolvedValue(null);
    mockFindByUsername.mockResolvedValue(null);

    await expect(
      authSessionsService.signin({ identifier: 'unknown@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe('authSessionsService.getUserProfile', () => {
  beforeEach(() => {
    mockFindById.mockResolvedValue(mockDbUser);
  });

  it('returns user data and success message on valid userId', async () => {
    const result = await authSessionsService.getUserProfile(mockDbUser.id);

    expect(result).toEqual({
      message: 'User profile retrieved successfully',
      user: { id: mockDbUser.id, username: mockDbUser.username, email: mockDbUser.email },
    });
  });

  it('calls findById with the provided userId', async () => {
    await authSessionsService.getUserProfile(mockDbUser.id);

    expect(mockFindById).toHaveBeenCalledWith(mockDbUser.id);
  });

  it('does not include passwordHash in the returned user', async () => {
    const result = await authSessionsService.getUserProfile(mockDbUser.id);

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws USER_NOT_FOUND with 404 when user does not exist', async () => {
    mockFindById.mockResolvedValue(null);

    await expect(authSessionsService.getUserProfile('nonexistent-id')).rejects.toMatchObject({
      statusCode: 404,
      code: AuthErrorType.USER_NOT_FOUND,
    });
  });

  it('throws an AuthError instance when user is not found', async () => {
    mockFindById.mockResolvedValue(null);

    await expect(authSessionsService.getUserProfile('nonexistent-id')).rejects.toBeInstanceOf(
      AuthError,
    );
  });
});

describe('authSessionsService.signout', () => {
  beforeEach(() => {
    mockDeleteById.mockResolvedValue(undefined);
  });

  it('calls sessionRepository.deleteById with the given sessionId', async () => {
    await authSessionsService.signout('session-id-abc123');

    expect(mockDeleteById).toHaveBeenCalledWith('session-id-abc123');
  });

  it('resolves without calling deleteById when sessionId is undefined', async () => {
    await authSessionsService.signout(undefined);

    expect(mockDeleteById).not.toHaveBeenCalled();
  });

  it('resolves without error on successful deletion', async () => {
    await expect(authSessionsService.signout('session-id-abc123')).resolves.toBeUndefined();
  });

  it('throws AuthError when sessionRepository.deleteById fails', async () => {
    const dbError = new Error('DB delete failure');
    mockDeleteById.mockRejectedValue(dbError);

    await expect(authSessionsService.signout('session-id-abc123')).rejects.toThrow(
      new AuthError(500, AuthErrorType.DATABASE_ERROR, 'Failed to delete session on signout'),
    );
  });
});

describe('authSessionsService.signoutAll', () => {
  beforeEach(() => {
    mockDeleteAllByUserId.mockResolvedValue(undefined);
  });

  it('calls sessionRepository.deleteAllByUserId with the given userId', async () => {
    await authSessionsService.signoutAll('user-id-123');

    expect(mockDeleteAllByUserId).toHaveBeenCalledWith('user-id-123');
  });

  it('resolves to undefined on success', async () => {
    await expect(authSessionsService.signoutAll('user-id-123')).resolves.toBeUndefined();
  });

  it('propagates errors thrown by sessionRepository.deleteAllByUserId', async () => {
    const dbError = new Error('Failed to delete all sessions for user');
    mockDeleteAllByUserId.mockRejectedValue(new Error('DB delete failure'));

    await expect(authSessionsService.signoutAll('user-id-123')).rejects.toThrow(dbError);
  });
});
