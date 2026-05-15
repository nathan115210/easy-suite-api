import { AppError } from '@easy-suite/utils';
import type { CookieOptions } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

export type PublicUserData = Omit<User, 'password'>;

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const AUTH_SESSION_COOKIE_NAME = 'authSessionId';
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MIN_LENGTH_MESSAGE = 'Username must be at least 3 characters';
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
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
  SESSION_EXPIRED = 'SESSION_EXPIRED',
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

export type RegisterUserBody = {
  username: string;
  email: string;
  password: string;
};

export type SigninRequestBody = {
  email?: string;
  username?: string;
  password: string;
};
