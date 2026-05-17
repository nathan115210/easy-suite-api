import type { Request, Response, NextFunction } from 'express';
import { type ErrorResponseBody, AuthErrorType } from '@/types/auth.types';
import { type UserAuthTokenResponseBody, sendAuthTokenUser } from '@/types/auth-token.types';
import { tokenSignupService } from '@/modules/auth/auth-token/auth-token.service';
import {
  SignupRequestSchema,
  type SignupRequestBody,
} from '@/modules/auth/auth-token/auth-token.schema';
import { setRefreshTokenCookie } from '@/modules/auth/auth-token/auth-token.cookies';

/*
  Workflow for token-based signup:
    1. receive username, email, password
    2. validate input
    3. normalize username/email
    4. check duplicate username/email
    5. hash password
    6. create user
    7. generate opaque access token
    8. generate opaque refresh token
    9. hash both tokens
    10. create session row in DB
    11. set refresh token cookie
    12. return user + access token

The refresh token should not be returned in JSON.
It should be set as an httpOnly cookie: Set-Cookie: refreshToken=<opaque_refresh_token>; HttpOnly; SameSite=Lax
**/
/**

 * signup returns:
    - user + accessToken
    - refreshToken cookie
 
 */
export async function tokenSignupController(
  req: Request<Record<string, string>, unknown, SignupRequestBody>,
  res: Response<UserAuthTokenResponseBody | ErrorResponseBody>,
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
    const result = await tokenSignupService(parsed.data);
    // Set refresh token as httpOnly cookie
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
