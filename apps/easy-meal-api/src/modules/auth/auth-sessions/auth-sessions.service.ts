import {
  type User,
  type AuthSession,
  AuthError,
  AuthErrorType,
  RegisterUserBody,
  SESSION_DURATION_MS,
  SigninRequestBody,
  USERNAME_MIN_LENGTH,
  USERNAME_MIN_LENGTH_MESSAGE,
} from '../../../../types/auth.types';
import { isValidEmail, hashPassword, verifyPassword } from '../../../utils/auth-utils';
import { userRepository } from '../../../db/user.repository';
import { sessionRepository } from '../../../db/session.repository';

type UserAuthServiceResult = {
  message: string;
  user: Omit<User, 'password'>;
};

type UserAuthSessionServiceResult = UserAuthServiceResult & {
  session: AuthSession;
};

type DbErrorLike = {
  code?: string;
  constraint?: string;
  detail?: string;
};

function isUniqueViolation(error: unknown): error is DbErrorLike {
  return typeof error === 'object' && error !== null && (error as DbErrorLike).code === '23505';
}

const signup = async (userData: RegisterUserBody): Promise<UserAuthSessionServiceResult> => {
  const { username, email, password } = userData;

  if (!username || typeof username !== 'string' || username.trim().length < USERNAME_MIN_LENGTH) {
    throw new AuthError(400, AuthErrorType.INVALID_USERNAME, USERNAME_MIN_LENGTH_MESSAGE);
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

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new AuthError(500, AuthErrorType.PASSWORD_HASH_FAILED, 'Failed to process password');
  }

  try {
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
    if (isUniqueViolation(error)) {
      const constraint = error.constraint?.toLowerCase() ?? '';
      const detail = error.detail?.toLowerCase() ?? '';
      const isEmailConflict = constraint.includes('email') || detail.includes('(email)');

      throw new AuthError(
        409,
        isEmailConflict
          ? AuthErrorType.EMAIL_ALREADY_IN_USE
          : AuthErrorType.USERNAME_ALREADY_IN_USE,
        isEmailConflict ? 'Email is already in use' : 'Username is already in use',
      );
    }

    console.error('Error creating user:', error);
    throw new AuthError(500, AuthErrorType.DATABASE_ERROR, 'Failed to create user');
  }
};

const signin = async (
  userCredentials: SigninRequestBody,
): Promise<UserAuthSessionServiceResult> => {
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

const getUserProfile = async (userId: string): Promise<UserAuthServiceResult> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AuthError(404, AuthErrorType.USER_NOT_FOUND, 'User not found');
  }

  return {
    message: 'User profile retrieved successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
};

export const authSessionsService = {
  signup,
  signin,
  getUserProfile,
};
