import { AuthErrorType, AuthError, PublicUserData } from '@/types/auth.types';
import { type SignupRequestBody } from '@/modules/auth/auth-token/auth-token.schema';
import { userRepository } from '@/db/user.repository';
import { hashPasswordSafe, createAuthTokensForUser } from '@/utils/auth-utils';
/*
  Workflow for token-based signup:
    1. receive username, email, password
    2. validate input
    3. normalize username/email
    4. check duplicate username/email
    5. hash password
    6. create user
    7. generate opaque access token
    8. generate opaque refresh token
    9. hash both tokens
    10. create session row in DB
    11. set refresh token cookie
    12. return user + access token
**/

type SignupResult = {
  message: string;
  user: PublicUserData;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export const tokenSignupService = async (userData: SignupRequestBody): Promise<SignupResult> => {
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
    user,
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};
