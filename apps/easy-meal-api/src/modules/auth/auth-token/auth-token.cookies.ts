import type { Response } from 'express';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_DURATION_MS } from '@/types/auth-token.types';

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...refreshTokenCookieOptions,
    maxAge: REFRESH_TOKEN_DURATION_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);
}
