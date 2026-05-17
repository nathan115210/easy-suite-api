import type { Response } from 'express';
import { type PublicUserData } from '@/types/auth.types';

export type UserAuthTokenResponseBody = {
  message: string;
  data: {
    user: PublicUserData;
    accessToken: string;
    accessTokenExpiresAt: Date;
  };
};

export function sendAuthTokenUser(
  res: Response<UserAuthTokenResponseBody>,
  status: 200 | 201,
  message: string,
  user: PublicUserData,
  accessToken: string,
  accessTokenExpiresAt: Date,
) {
  return res.status(status).json({
    message,
    data: {
      user,
      accessToken,
      accessTokenExpiresAt,
    },
  });
}

export const ACCESS_TOKEN_DURATION_MS = 1000 * 60 * 15; // 15 minutes

export const REFRESH_TOKEN_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
