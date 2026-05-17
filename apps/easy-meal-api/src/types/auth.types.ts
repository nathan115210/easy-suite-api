import { AppError } from '@easy-suite/utils';
import type { Request } from 'express';

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

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MIN_LENGTH_MESSAGE = 'Username must be at least 3 characters';

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

export class AuthError extends AppError {
  constructor(statusCode: number, code: AuthErrorType, message: string, details?: unknown) {
    super(statusCode, code, message, details);
    this.name = 'AuthError';
  }
}
