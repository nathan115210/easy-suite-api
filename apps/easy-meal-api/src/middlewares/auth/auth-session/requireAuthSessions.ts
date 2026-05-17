import type { NextFunction, Request, Response } from 'express';
import { AUTH_SESSION_COOKIE_NAME, AuthError, AuthErrorType } from '@/types/auth.types';
import { sessionRepository } from '@/db/session.repository';

export async function requireAuthSessions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = req.cookies[AUTH_SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new AuthError(401, AuthErrorType.SESSION_MISSING, 'Authentication session is missing');
    }

    const sessionData = await sessionRepository.findValidSessionById(sessionId);
    if (!sessionData) {
      throw new AuthError(
        401,
        AuthErrorType.SESSION_NOT_FOUND,
        'Authentication session is invalid',
      );
    }

    req.userId = sessionData.userId;

    next();
  } catch (error) {
    next(error);
  }
}
