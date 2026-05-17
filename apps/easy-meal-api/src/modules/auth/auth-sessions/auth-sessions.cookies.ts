import type { Response } from 'express';
import { AUTH_SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '@/types/auth.types';

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(AUTH_SESSION_COOKIE_NAME, sessionId, {
    ...sessionCookieOptions,
    maxAge: SESSION_DURATION_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(AUTH_SESSION_COOKIE_NAME, sessionCookieOptions);
}
