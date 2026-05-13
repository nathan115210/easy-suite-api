import {
  type User,
  type AuthSession,
  AuthError,
  AuthErrorType,
  SESSION_DURATION_MS,
} from '../../../../types/auth.types';
import { isValidEmail, hashPassword } from '../../../utils/auth-utils';
import { userRepository } from '../../../db/user.repository';
import { sessionRepository } from '../../../db/session.repository';

type SignupServiceResult = {
  message: string;
  user: Omit<User, 'password'>;
  session: AuthSession;
};

const signup = async (userData: Omit<User, 'id'>): Promise<SignupServiceResult> => {
  const { username, email, password } = userData;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    throw new AuthError(
      400,
      AuthErrorType.INVALID_USERNAME,
      'Username must be at least 3 characters',
    );
  }
  if (!email) {
    throw new AuthError(400, AuthErrorType.EMAIL_REQUIRED, 'Email is required');
  }

  if (!password) {
    throw new AuthError(400, AuthErrorType.PASSWORD_REQUIRED, 'Password is required');
  }

  if (!isValidEmail(email)) {
    throw new AuthError(400, AuthErrorType.INVALID_EMAIL, 'Invalid email format');
  }

  // Check for existing user with the same email or username
  const existingUserByEmail = await userRepository.findByEmail(email);
  if (existingUserByEmail) {
    throw new AuthError(409, AuthErrorType.EMAIL_ALREADY_IN_USE, 'Email is already in use');
  }
  const existingUserByUsername = await userRepository.findByUsername(username);
  if (existingUserByUsername) {
    throw new AuthError(409, AuthErrorType.USERNAME_ALREADY_IN_USE, 'Username is already in use');
  }

  try {
    const passwordHash = await hashPassword(password);
    const createdUser = await userRepository.create({
      username,
      email,
      passwordHash,
    });

    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const session = await sessionRepository.createSession({
      userId: createdUser.id,
      expiresAt,
    });

    return {
      message: 'User created successfully',
      user: createdUser,
      session,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new AuthError(500, AuthErrorType.DATABASE_ERROR, 'Failed to create user');
  }
};

export const authSessionsService = {
  signup,
};
