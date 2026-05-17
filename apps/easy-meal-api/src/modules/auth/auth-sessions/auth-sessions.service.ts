import {
  type PublicUserData,
  type AuthSession,
  AuthError,
  AuthErrorType,
  SESSION_DURATION_MS,
} from '@/types/auth.types';
import { logger } from '@easy-suite/utils';
import { z } from 'zod';
import type {
  SignupRequestBody,
  SigninRequestBody,
} from '@/modules/auth/auth-sessions/auth-sessions.schema';
import { hashPassword, toPublicUser, verifyPassword } from '@/utils/auth-utils';
import { userRepository } from '@/db/user.repository';
import { sessionRepository } from '@/db/session.repository';
import { db } from '@/db';
import type { DbExecutor } from '@/db/types';

type UserAuthServiceResult = {
  message: string;
  user: PublicUserData;
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

/**
 * Helper to create a user session with standard expiration
 */
async function createUserSession(userId: string, executor: DbExecutor = db): Promise<AuthSession> {
  return sessionRepository.createSession(
    {
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
    executor,
  );
}

const signup = async (userData: SignupRequestBody): Promise<UserAuthSessionServiceResult> => {
  const { username, email, password } = userData;

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
    logger.error({ err: error }, 'Error hashing password');
    throw new AuthError(500, AuthErrorType.PASSWORD_HASH_FAILED, 'Failed to process password');
  }

  try {
    const { createdUser, session } = await db.transaction(async (tx) => {
      const createdUser = await userRepository.create(
        {
          username,
          email,
          passwordHash,
        },
        tx,
      );

      const session = await createUserSession(createdUser.id, tx);

      return { createdUser, session };
    });

    return {
      message: 'User created successfully',
      user: toPublicUser(createdUser),
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

    logger.error({ err: error }, 'Error creating user');
    throw new AuthError(500, AuthErrorType.DATABASE_ERROR, 'Failed to create user');
  }
};

const signin = async (
  userCredentials: SigninRequestBody,
): Promise<UserAuthSessionServiceResult> => {
  const { identifier, password } = userCredentials;

  // Determine if identifier is an email or username
  const isEmail = z.string().email().safeParse(identifier).success;

  const existingUser = isEmail
    ? await userRepository.findByEmail(identifier)
    : await userRepository.findByUsername(identifier);

  if (!existingUser) {
    throw new AuthError(401, AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const isPasswordValid = await verifyPassword(password, existingUser.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError(401, AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  // Create a new session for the user; every time they sign in, we create a new session with a new expiry time.
  // At the same time, keep old session(s) valid until they expire naturally. We don't want to invalidate existing sessions
  // on new sign-ins to allow users to be signed in on multiple devices/browsers simultaneously.
  const newSession = await createUserSession(existingUser.id);

  return {
    message: 'Signin successful',
    user: toPublicUser(existingUser),
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
    user: toPublicUser(user),
  };
};

const signout = async (sessionId: string | undefined): Promise<void> => {
  if (!sessionId) {
    return;
  }

  await sessionRepository.deleteById(sessionId).catch((err) => {
    logger.error({ err, sessionId }, 'Failed to delete session on signout');
    throw new AuthError(500, AuthErrorType.DATABASE_ERROR, 'Failed to delete session on signout');
  });
};

const signoutAll = async (userId: string): Promise<void> => {
  await sessionRepository.deleteAllByUserId(userId).catch((err) => {
    logger.error({ err, userId }, 'Failed to delete all sessions for user');
    throw new AuthError(
      500,
      AuthErrorType.DATABASE_ERROR,
      'Failed to delete all sessions for user',
    );
  });
};

export const authSessionsService = {
  signup,
  signin,
  signout,
  signoutAll,
  getUserProfile,
};
