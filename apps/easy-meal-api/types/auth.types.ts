import { AppError } from '@easy-suite/utils';
import type { CookieOptions, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export type PublicUserData = {
  id: string;
  username: string;
  email: string;
};

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const AUTH_SESSION_COOKIE_NAME = 'authSessionId';
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MIN_LENGTH_MESSAGE = 'Username must be at least 3 characters';
export const AUTH_CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  ...AUTH_CLEAR_COOKIE_OPTIONS,
  maxAge: SESSION_DURATION_MS,
};

export enum AuthErrorType {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  USERNAME_ALREADY_IN_USE = 'USERNAME_ALREADY_IN_USE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SESSION_MISSING = 'SESSION_MISSING',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  // Reserved for future granularity when middleware distinguishes expired vs invalid sessions.
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  // Reserved for future field-specific validation responses.
  INVALID_USERNAME = 'INVALID_USERNAME',
  EMAIL_REQUIRED = 'EMAIL_REQUIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  INVALID_EMAIL = 'INVALID_EMAIL',
  PASSWORD_HASH_FAILED = 'PASSWORD_HASH_FAILED',
}

export type ErrorResponseBody = {
  error: {
    code: AuthErrorType;
    message: string;
    details?: unknown;
  };
};

export type UserAuthResponseBody = {
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
};

export class AuthError extends AppError {
  constructor(statusCode: number, code: AuthErrorType, message: string, details?: unknown) {
    super(statusCode, code, message, details);
    this.name = 'AuthError';
  }
}

export type AuthSession = {
  id: string;
  expiresAt: Date;
};

/**
 * Helper to send standardized auth user response
 */
export function sendAuthUser(
  res: Response<UserAuthResponseBody>,
  status: 200 | 201,
  message: string,
  user: PublicUserData,
) {
  return res.status(status).json({
    message,
    data: { user },
  });
}

/**
 * Helper to set auth session cookie with consistent options
 */
export function setAuthSessionCookie(res: Response, sessionId: string) {
  res.cookie(AUTH_SESSION_COOKIE_NAME, sessionId, AUTH_COOKIE_OPTIONS);
}
