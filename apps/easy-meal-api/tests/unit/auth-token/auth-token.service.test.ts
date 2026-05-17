import { AuthErrorType, AuthError } from '@/types/auth.types';

jest.mock('@/db/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/db/session.repository', () => ({
  sessionRepository: {
    createTokenSession: jest.fn(),
  },
}));

jest.mock('@/utils/auth-utils', () => ({
  hashPasswordSafe: jest.fn(),
  createAuthTokensForUser: jest.fn(),
  verifyPassword: jest.fn(),
  toPublicUser: jest.fn((user: { id: string; username: string; email: string }) => ({
    id: user.id,
    username: user.username,
    email: user.email,
  })),
}));

import { userRepository } from '@/db/user.repository';
import { hashPasswordSafe, createAuthTokensForUser, verifyPassword } from '@/utils/auth-utils';
import {
  tokenSignupService,
  tokenSigninService,
} from '@/modules/auth/auth-token/auth-token.service';

const mockFindByEmail = userRepository.findByEmail as jest.Mock;
const mockFindByUsername = userRepository.findByUsername as jest.Mock;
const mockCreateUser = userRepository.create as jest.Mock;
const mockHashPasswordSafe = hashPasswordSafe as jest.Mock;
const mockCreateAuthTokensForUser = createAuthTokensForUser as jest.Mock;
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
  passwordHash: 'hashed-password',
};

const mockTokenPair = {
  accessToken: 'raw-access-token',
  accessTokenExpiresAt: new Date('2030-01-01T00:15:00Z'),
  refreshToken: 'raw-refresh-token',
  refreshTokenExpiresAt: new Date('2030-01-08T00:00:00Z'),
};

const mockDbUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'stored-hash',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindByEmail.mockResolvedValue(null);
  mockFindByUsername.mockResolvedValue(null);
  mockCreateUser.mockResolvedValue(mockCreatedUser);
  mockHashPasswordSafe.mockResolvedValue('hashed-password');
  mockCreateAuthTokensForUser.mockResolvedValue(mockTokenPair);
  mockVerifyPassword.mockResolvedValue(true);
});

describe('tokenSignupService', () => {
  describe('duplicate checks', () => {
    it('throws EMAIL_ALREADY_IN_USE when email is taken', async () => {
      mockFindByEmail.mockResolvedValue(mockCreatedUser);

      await expect(tokenSignupService(validUserData)).rejects.toThrow(
        expect.objectContaining({ code: AuthErrorType.EMAIL_ALREADY_IN_USE, statusCode: 409 }),
      );
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('throws USERNAME_ALREADY_IN_USE when username is taken', async () => {
      mockFindByUsername.mockResolvedValue(mockCreatedUser);

      await expect(tokenSignupService(validUserData)).rejects.toThrow(
        expect.objectContaining({ code: AuthErrorType.USERNAME_ALREADY_IN_USE, statusCode: 409 }),
      );
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('password hashing', () => {
    it('propagates errors thrown by hashPasswordSafe', async () => {
      const hashError = new AuthError(
        500,
        AuthErrorType.PASSWORD_HASH_FAILED,
        'Failed to process password',
      );
      mockHashPasswordSafe.mockRejectedValue(hashError);

      await expect(tokenSignupService(validUserData)).rejects.toThrow(hashError);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('successful signup', () => {
    it('returns the correct shape with user and tokens', async () => {
      const result = await tokenSignupService(validUserData);

      expect(result).toMatchObject({
        message: 'Signup successful',
        user: {
          id: mockCreatedUser.id,
          username: mockCreatedUser.username,
          email: mockCreatedUser.email,
        },
        accessToken: 'raw-access-token',
        accessTokenExpiresAt: mockTokenPair.accessTokenExpiresAt,
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: mockTokenPair.refreshTokenExpiresAt,
      });
    });

    it('creates the user with the hashed password', async () => {
      await tokenSignupService(validUserData);

      expect(mockCreateUser).toHaveBeenCalledWith({
        username: validUserData.username,
        email: validUserData.email,
        passwordHash: 'hashed-password',
      });
    });

    it('generates tokens for the created user ID', async () => {
      await tokenSignupService(validUserData);

      expect(mockCreateAuthTokensForUser).toHaveBeenCalledWith(mockCreatedUser.id);
    });
  });
});

describe('tokenSigninService', () => {
  beforeEach(() => {
    mockFindByEmail.mockResolvedValue(mockDbUser);
    mockFindByUsername.mockResolvedValue(mockDbUser);
  });

  describe('user lookup', () => {
    it('looks up by email when identifier is an email address', async () => {
      await tokenSigninService({ identifier: 'test@example.com', password: 'Password1' });

      expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockFindByUsername).not.toHaveBeenCalled();
    });

    it('looks up by username when identifier is not an email', async () => {
      await tokenSigninService({ identifier: 'testuser', password: 'Password1' });

      expect(mockFindByUsername).toHaveBeenCalledWith('testuser');
      expect(mockFindByEmail).not.toHaveBeenCalled();
    });
  });

  describe('credential validation', () => {
    it('throws INVALID_CREDENTIALS when user is not found', async () => {
      mockFindByEmail.mockResolvedValue(null);

      await expect(
        tokenSigninService({ identifier: 'unknown@example.com', password: 'Password1' }),
      ).rejects.toThrow(
        expect.objectContaining({ code: AuthErrorType.INVALID_CREDENTIALS, statusCode: 401 }),
      );
      expect(mockCreateAuthTokensForUser).not.toHaveBeenCalled();
    });

    it('throws INVALID_CREDENTIALS when password is wrong', async () => {
      mockVerifyPassword.mockResolvedValue(false);

      await expect(
        tokenSigninService({ identifier: 'test@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow(
        expect.objectContaining({ code: AuthErrorType.INVALID_CREDENTIALS, statusCode: 401 }),
      );
      expect(mockCreateAuthTokensForUser).not.toHaveBeenCalled();
    });

    it('verifies the password against the stored hash', async () => {
      await tokenSigninService({ identifier: 'test@example.com', password: 'Password1' });

      expect(mockVerifyPassword).toHaveBeenCalledWith('Password1', mockDbUser.passwordHash);
    });
  });

  describe('successful signin', () => {
    it('returns the correct shape with user and tokens', async () => {
      const result = await tokenSigninService({
        identifier: 'test@example.com',
        password: 'Password1',
      });

      expect(result).toMatchObject({
        message: 'Signin successful',
        accessToken: 'raw-access-token',
        accessTokenExpiresAt: mockTokenPair.accessTokenExpiresAt,
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: mockTokenPair.refreshTokenExpiresAt,
      });
      expect(result.user).toMatchObject({
        id: mockDbUser.id,
        username: mockDbUser.username,
        email: mockDbUser.email,
      });
    });

    it('generates tokens for the found user ID', async () => {
      await tokenSigninService({ identifier: 'test@example.com', password: 'Password1' });

      expect(mockCreateAuthTokensForUser).toHaveBeenCalledWith(mockDbUser.id);
    });
  });
});
