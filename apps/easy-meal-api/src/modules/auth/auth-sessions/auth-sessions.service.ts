import {
  type User,
  type AuthSession,
  AuthError,
  AuthErrorType,
  SESSION_DURATION_MS,
  SigninRequestBody,
} from '../../../../types/auth.types';
import { isValidEmail, hashPassword, verifyPassword } from '../../../utils/auth-utils';
import { userRepository } from '../../../db/user.repository';
import { sessionRepository } from '../../../db/session.repository';

type UserAuthServiceResult = {
  message: string;
  user: Omit<User, 'password'>;
  session: AuthSession;
};

const signup = async (userData: Omit<User, 'id'>): Promise<UserAuthServiceResult> => {
  const { username, email, password } = userData;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    throw new AuthError(
      400,
      AuthErrorType.INVALID_USERNAME,
      'Username must be at least 3 characters',
    );
  }

  if (!isValidEmail(email)) {
    throw new AuthError(
      400,
      email ? AuthErrorType.INVALID_EMAIL : AuthErrorType.EMAIL_REQUIRED,
      email ? 'Invalid email format' : 'Email is required',
    );
  }
  if (!password) {
    throw new AuthError(400, AuthErrorType.PASSWORD_REQUIRED, 'Password is required');
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

const signin = async (userCredentials: SigninRequestBody): Promise<UserAuthServiceResult> => {
  const { email, username, password } = userCredentials;

  if (!email && !username) {
    throw new AuthError(400, AuthErrorType.VALIDATION_ERROR, 'Email or username is required');
  }

  if (!password) {
    throw new AuthError(400, AuthErrorType.PASSWORD_REQUIRED, 'Password is required');
  }

  const existingUser = email
    ? await userRepository.findByEmail(email)
    : await userRepository.findByUsername(username!);

  if (!existingUser) {
    throw new AuthError(401, AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const isPasswordValid = await verifyPassword(password, existingUser.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError(401, AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  // create the new session for the user, every time they sign in, we create a new session with a new expiry time
  // At the same time, keep the old session(s) valid until they expire naturally. we don't want to invalidate existing sessions on new sign-ins to allow users to be signed in on multiple devices/browsers simultaneously
  const newSession = await sessionRepository.createSession({
    userId: existingUser.id,
    expiresAt: newExpiresAt,
  });

  return {
    message: 'Signin successful',
    user: {
      id: existingUser.id,
      username: existingUser.username,
      email: existingUser.email,
    },
    session: newSession,
  };
};

export const authSessionsService = {
  signup,
  signin,
};
