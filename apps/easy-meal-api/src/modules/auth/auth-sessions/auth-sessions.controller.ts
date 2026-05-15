import type { Request, Response, NextFunction } from 'express';
import {
  UserAuthResponseBody,
  type ErrorResponseBody,
  AUTH_SESSION_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AuthErrorType,
  RegisterUserBody,
  SigninRequestBody,
  AuthError,
} from '../../../../types/auth.types';
import { authSessionsService } from './auth-sessions.service';
import { SignupRequestSchema, SigninRequestSchema } from './auth-sessions.schema';

export async function signupController(
  req: Request<Record<string, string>, unknown, RegisterUserBody>,
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
    res.cookie(AUTH_SESSION_COOKIE_NAME, result.session.id, AUTH_COOKIE_OPTIONS);

    res.status(201).json({
      message: result.message,
      data: {
        user: result.user,
      },
    });
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
    res.cookie(AUTH_SESSION_COOKIE_NAME, result.session.id, AUTH_COOKIE_OPTIONS);

    res.status(200).json({
      message: result.message,
      data: {
        user: result.user,
      },
    });
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
      throw new AuthError(401, AuthErrorType.SESSION_MISSING, 'Authentication session is missing');
    }

    const user = await authSessionsService.getUserProfile(userId);

    res.status(200).json({
      message: user.message,
      data: {
        user: user.user,
      },
    });
  } catch (error) {
    next(error);
  }
}
