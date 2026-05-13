import type { Request, Response, NextFunction } from 'express';
import {
  SignupResponseBody,
  type ErrorResponseBody,
  AUTH_SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  AuthErrorType,
  RegisterUserBody,
} from '../../../../types/auth.types';
import { authSessionsService } from './auth-sessions.service';
import { SignupRequestSchema } from './auth-sessions.schema';

export async function signupController(
  req: Request<Record<string, string>, unknown, RegisterUserBody>,
  res: Response<SignupResponseBody | ErrorResponseBody>,
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
    res.cookie(AUTH_SESSION_COOKIE_NAME, result.session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
    });

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
