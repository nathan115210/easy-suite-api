import type { Request, Response, NextFunction } from 'express';
import {
  type ErrorResponseBody,
  AUTH_SESSION_COOKIE_NAME,
  AuthErrorType,
  AuthError,
  sendAuthUser,
  type UserAuthResponseBody,
} from '../../../../types/auth.types';
import { setSessionCookie, clearSessionCookie } from './auth-sessions.cookies';
import { authSessionsService } from './auth-sessions.service';
import { sessionRepository } from '../../../db/session.repository';
import {
  SignupRequestSchema,
  SigninRequestSchema,
  type SignupRequestBody,
  type SigninRequestInput,
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
    setSessionCookie(res, result.session.id);
    sendAuthUser(res, 201, result.message, result.user);
  } catch (error) {
    next(error);
  }
}

export async function signinController(
  req: Request<Record<string, string>, unknown, SigninRequestInput>,
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
    setSessionCookie(res, result.session.id);
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
    const userId = req.userId;
    if (!userId) {
      throw new AuthError(
        401,
        AuthErrorType.SESSION_MISSING,
        'Authentication session missing or invalid',
      );
    }
    const user = await authSessionsService.getUserProfile(userId);
    sendAuthUser(res, 200, user.message, user.user);
  } catch (error) {
    if (error instanceof AuthError && error.code === AuthErrorType.USER_NOT_FOUND) {
      const sessionId = req.cookies?.[AUTH_SESSION_COOKIE_NAME];
      if (sessionId) {
        await sessionRepository.deleteById(sessionId).catch(() => {});
      }

      next(
        new AuthError(401, AuthErrorType.SESSION_NOT_FOUND, 'Authentication session is invalid'),
      );
      return;
    }

    next(error);
  }
}

export async function signoutController(
  req: Request,
  res: Response<{ message: string } | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = req.cookies?.[AUTH_SESSION_COOKIE_NAME];

    clearSessionCookie(res);

    await authSessionsService.signout(sessionId);

    res.status(200).json({
      message: 'Signout successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function signoutAllController(
  req: Request,
  res: Response<{ message: string } | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AuthError(
        401,
        AuthErrorType.SESSION_MISSING,
        'Authentication session missing or invalid',
      );
    }

    await authSessionsService.signoutAll(userId);

    clearSessionCookie(res);

    res.status(200).json({
      message: 'Signed out from all sessions',
    });
  } catch (error) {
    next(error);
  }
}
