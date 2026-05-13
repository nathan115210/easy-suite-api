import { AuthErrorType, AuthError } from '../../../types/auth.types';

jest.mock('../../../src/db/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/db/session.repository', () => ({
  sessionRepository: {
    createSession: jest.fn(),
  },
}));

jest.mock('../../../src/utils/auth-utils', () => ({
  isValidEmail: jest.fn(),
  hashPassword: jest.fn(),
}));

import { userRepository } from '../../../src/db/user.repository';
import { sessionRepository } from '../../../src/db/session.repository';
import { isValidEmail, hashPassword } from '../../../src/utils/auth-utils';
import { authSessionsService } from '../../../src/modules/auth/auth-sessions/auth-sessions.service';

const mockFindByEmail = userRepository.findByEmail as jest.Mock;
const mockFindByUsername = userRepository.findByUsername as jest.Mock;
const mockCreateUser = userRepository.create as jest.Mock;
const mockCreateSession = sessionRepository.createSession as jest.Mock;
const mockIsValidEmail = isValidEmail as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;

const validUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockIsValidEmail.mockReturnValue(true);
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
    );
  });

  it('creates a session with the new user id', async () => {
    await authSessionsService.signup(validUserData);

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockCreatedUser.id }),
    );
  });

  it('creates a session with a future expiry date', async () => {
    await authSessionsService.signup(validUserData);

    const [[sessionData]] = mockCreateSession.mock.calls;
    expect(sessionData.expiresAt).toBeInstanceOf(Date);
    expect(sessionData.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws INVALID_USERNAME when username is shorter than 3 characters', async () => {
    await expect(
      authSessionsService.signup({ ...validUserData, username: 'ab' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: AuthErrorType.INVALID_USERNAME,
    });
  });

  it('throws INVALID_USERNAME when username is an empty string', async () => {
    await expect(
      authSessionsService.signup({ ...validUserData, username: '' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: AuthErrorType.INVALID_USERNAME,
    });
  });

  it('throws INVALID_USERNAME when username is only whitespace', async () => {
    await expect(
      authSessionsService.signup({ ...validUserData, username: '   ' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: AuthErrorType.INVALID_USERNAME,
    });
  });

  it('throws EMAIL_REQUIRED when email is an empty string', async () => {
    await expect(authSessionsService.signup({ ...validUserData, email: '' })).rejects.toMatchObject(
      {
        statusCode: 400,
        code: AuthErrorType.EMAIL_REQUIRED,
      },
    );
  });

  it('throws PASSWORD_REQUIRED when password is an empty string', async () => {
    await expect(
      authSessionsService.signup({ ...validUserData, password: '' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: AuthErrorType.PASSWORD_REQUIRED,
    });
  });

  it('throws INVALID_EMAIL when email format is invalid', async () => {
    mockIsValidEmail.mockReturnValue(false);

    await expect(
      authSessionsService.signup({ ...validUserData, email: 'not-an-email' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: AuthErrorType.INVALID_EMAIL,
    });
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

  it('throws an AuthError instance for all error cases', async () => {
    mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });

    await expect(authSessionsService.signup(validUserData)).rejects.toBeInstanceOf(AuthError);
  });

  it('does not create a user when validation fails', async () => {
    await expect(
      authSessionsService.signup({ ...validUserData, username: 'x' }),
    ).rejects.toBeDefined();

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
