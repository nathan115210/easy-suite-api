import argon2 from 'argon2';
import { AuthError, AuthErrorType, type PublicUserData } from '@/types/auth.types';
import { logger } from '@easy-suite/utils';
import crypto from 'node:crypto';
import { ACCESS_TOKEN_DURATION_MS, REFRESH_TOKEN_DURATION_MS } from '@/types/auth-token.types';
import { sessionRepository } from '@/db/session.repository';

export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
  });

export const hashPasswordSafe = async (password: string): Promise<string> => {
  try {
    return await hashPassword(password);
  } catch (error) {
    logger.error({ err: error }, 'Error hashing password');
    throw new AuthError(500, AuthErrorType.PASSWORD_HASH_FAILED, 'Failed to process password');
  }
};

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  return argon2.verify(passwordHash, password);
};

export function toPublicUser(user: {
  id: string;
  username: string;
  email: string;
}): PublicUserData {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

// opaque token generation and hashing for token-based auth
export const generateOpaqueToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = async (token: string): Promise<string> => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createAuthTokensForUser = async (
  userId: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}> => {
  //generate access token and refresh token
  const accessToken = generateOpaqueToken();
  const refreshToken = generateOpaqueToken();

  // hash tokens before storing in DB
  const accessTokenHash = await hashToken(accessToken);
  const refreshTokenHash = await hashToken(refreshToken);

  // calculate token expiration dates
  const accessTokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_DURATION_MS);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_MS);

  //create token session row in DB with hashed tokens and expiration dates
  await sessionRepository.createTokenSession({
    userId,
    accessTokenHash,
    accessTokenExpiresAt,
    refreshTokenHash,
    refreshTokenExpiresAt,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    accessToken, // client needs the unhashed access token to authenticate future requests
    refreshToken, // client needs the unhashed refresh token to obtain new access tokens
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};
