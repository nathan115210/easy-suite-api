import type { Response } from 'express';
import { PublicUserData } from './auth.types';

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const AUTH_SESSION_COOKIE_NAME = 'authSessionId';

export type AuthSession = {
  id: string;
  expiresAt: Date;
};

export type AuthSessionUserResponseBody = {
  message: string;
  data: {
    user: PublicUserData;
  };
};

export function sendAuthSessionUser(
  res: Response<AuthSessionUserResponseBody>,
  status: 200 | 201,
  message: string,
  user: PublicUserData,
) {
  return res.status(status).json({
    message,
    data: { user },
  });
}
