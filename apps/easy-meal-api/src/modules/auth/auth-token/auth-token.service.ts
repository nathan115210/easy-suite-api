import { z } from 'zod';

import { AuthErrorType, AuthError, PublicUserData } from '@/types/auth.types';
import {
  type SignupRequestBody,
  type SigninRequestBody,
} from '@/modules/auth/auth-token/auth-token.schema';
import { userRepository } from '@/db/user.repository';
import {
  hashPasswordSafe,
  createAuthTokensForUser,
  verifyPassword,
  toPublicUser,
} from '@/utils/auth-utils';
type AuthTokenServicesResult = {
  message: string;
  user: PublicUserData;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export const tokenSignupService = async (
  userData: SignupRequestBody,
): Promise<AuthTokenServicesResult> => {
  const { username, email, password } = userData;

  const existingUserByEmail = await userRepository.findByEmail(email);
  if (existingUserByEmail) {
    throw new AuthError(409, AuthErrorType.EMAIL_ALREADY_IN_USE, 'Email is already in use');
  }

  const existingUserByUsername = await userRepository.findByUsername(username);
  if (existingUserByUsername) {
    throw new AuthError(409, AuthErrorType.USERNAME_ALREADY_IN_USE, 'Username is already in use');
  }

  const passwordHash = await hashPasswordSafe(password);

  const user = await userRepository.create({
    username,
    email,
    passwordHash,
  });

  const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } =
    await createAuthTokensForUser(user.id);

  return {
    message: 'Signup successful',
    user: toPublicUser(user),
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};

export const tokenSigninService = async (
  userCredentials: SigninRequestBody,
): Promise<AuthTokenServicesResult> => {
  const { identifier, password } = userCredentials;
  if (!identifier?.trim()) {
    throw new AuthError(400, AuthErrorType.VALIDATION_ERROR, 'Email/username is required');
  }

  if (!password) {
    throw new AuthError(400, AuthErrorType.PASSWORD_REQUIRED, 'Password is required');
  }

  const isEmail = z.string().email().safeParse(identifier).success;
  const existingUser = isEmail
    ? await userRepository.findByEmail(identifier)
    : await userRepository.findByUsername(identifier);

  if (!existingUser) {
    throw new AuthError(
      401,
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid email/username or password',
    );
  }

  const isPasswordValid = await verifyPassword(password, existingUser.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError(
      401,
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid email/username or password',
    );
  }

  const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } =
    await createAuthTokensForUser(existingUser.id);

  return {
    message: 'Signin successful',
    user: toPublicUser(existingUser),
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};
