import type { Request, Response, NextFunction } from 'express';
import { type ErrorResponseBody, AuthErrorType } from '@/types/auth.types';
import { type UserAuthTokenResponseBody, sendAuthTokenUser } from '@/types/auth-token.types';
import {
  tokenSignupService,
  tokenSigninService,
} from '@/modules/auth/auth-token/auth-token.service';
import {
  AuthTokenSignupRequestSchema,
  type SignupRequestBody,
  type SigninRequestInput,
  AuthTokenSigninRequestSchema,
} from '@/modules/auth/auth-token/auth-token.schema';
import { setRefreshTokenCookie } from '@/modules/auth/auth-token/auth-token.cookies';

export async function tokenSignupController(
  req: Request<Record<string, string>, unknown, SignupRequestBody>,
  res: Response<UserAuthTokenResponseBody | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  const parsed = AuthTokenSignupRequestSchema.safeParse(req.body);
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
    const result = await tokenSignupService(parsed.data);
    setRefreshTokenCookie(res, result.refreshToken);
    sendAuthTokenUser(
      res,
      201,
      result.message,
      result.user,
      result.accessToken,
      result.accessTokenExpiresAt,
    );
  } catch (error) {
    next(error);
  }
}

export async function tokenSigninController(
  req: Request<Record<string, string>, unknown, SigninRequestInput>,
  res: Response<UserAuthTokenResponseBody | ErrorResponseBody>,
  next: NextFunction,
): Promise<void> {
  const parsed = AuthTokenSigninRequestSchema.safeParse(req.body);
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
    const result = await tokenSigninService(parsed.data);
    setRefreshTokenCookie(res, result.refreshToken);
    sendAuthTokenUser(
      res,
      200,
      result.message,
      result.user,
      result.accessToken,
      result.accessTokenExpiresAt,
    );
  } catch (error) {
    next(error);
  }
}
