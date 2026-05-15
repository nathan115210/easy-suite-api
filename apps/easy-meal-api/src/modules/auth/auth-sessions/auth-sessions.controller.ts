import type { Request, Response, NextFunction } from 'express';
import {
  type ErrorResponseBody,
  AUTH_SESSION_COOKIE_NAME,
  AuthErrorType,
  AuthError,
  sendAuthUser,
  setAuthSessionCookie,
  type UserAuthResponseBody,
} from '../../../../types/auth.types';
import { authSessionsService } from './auth-sessions.service';
import { sessionRepository } from '../../../db/session.repository';
import {
  SignupRequestSchema,
  SigninRequestSchema,
  type SignupRequestBody,
  type SigninRequestBody,
} from './auth-sessions.schema';

export async function signupController(
  req: Request<Record<string, string>, unknown, SignupRequestBody>,
  res: Response<UserAuthResponseBody | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  const parsed = SignupRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: AuthErrorType.VALIDATION_ERROR,
        message: 'Invalid request body',
        details: parsed.error.issues,
      },
    });
    return;
  }

  try {
    const result = await authSessionsService.signup(parsed.data);
    setAuthSessionCookie(res, result.session.id);
    sendAuthUser(res, 201, result.message, result.user);
  } catch (error) {
    next(error);
  }
}

export async function signinController(
  req: Request<Record<string, string>, unknown, SigninRequestBody>,
  res: Response<UserAuthResponseBody | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  const parsed = SigninRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: AuthErrorType.VALIDATION_ERROR,
        message: 'Invalid request body',
        details: parsed.error.issues,
      },
    });
    return;
  }

  try {
    const result = await authSessionsService.signin(parsed.data);
    setAuthSessionCookie(res, result.session.id);
    sendAuthUser(res, 200, result.message, result.user);
  } catch (error) {
    next(error);
  }
}

export async function getProfileController(
  req: Request,
  res: Response<UserAuthResponseBody | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authSessionsService.getUserProfile(req.userId!);
    sendAuthUser(res, 200, user.message, user.user);
  } catch (error) {
    if (error instanceof AuthError && error.code === AuthErrorType.USER_NOT_FOUND) {
      const sessionId = req.cookies?.[AUTH_SESSION_COOKIE_NAME];
      if (sessionId) {
        await sessionRepository.deleteById(sessionId).catch((cleanupError) => {
          req.log?.warn?.({ err: cleanupError, sessionId }, 'Failed to delete stale auth session');
        });
      }

      next(
        new AuthError(401, AuthErrorType.SESSION_NOT_FOUND, 'Authentication session is invalid'),
      );
      return;
    }

    next(error);
  }
}
