import { z } from 'zod';
import { registry } from '@/openapi/registry';
import { USERNAME_MIN_LENGTH, USERNAME_MIN_LENGTH_MESSAGE } from '@/types/auth.types';

export const AuthTokenSignupRequestSchema = registry.register(
  'TokenSignupRequest',
  z.object({
    username: z.string().min(USERNAME_MIN_LENGTH, { message: USERNAME_MIN_LENGTH_MESSAGE }).max(30),
    email: z.email(),
    password: z
      .string()
      .min(1, { message: 'Password is required' })
      .min(3, { message: 'Password must be at least 3 characters long' })
      .regex(/[A-Z]/, { message: 'Password must contain at least 1 uppercase letter' })
      .regex(/\d/, { message: 'Password must contain at least 1 number' }),
  }),
);

export const AuthTokenUserResponseSchema = registry.register(
  'AuthTokenUserResponse',
  z.object({
    message: z.string(),
    data: z.object({
      user: z.object({
        id: z.string(),
        username: z.string(),
        email: z.email(),
      }),
      accessToken: z.string(),
      accessTokenExpiresAt: z.string().datetime(),
    }),
  }),
);

export const AuthTokenSigninRequestSchema = registry.register(
  'TokenSigninRequest',
  z
    .object({
      identifier: z
        .string()
        .optional()
        .openapi({ description: 'Email or username', example: 'user@example.com' }),
      email: z
        .string()
        .email()
        .optional()
        .openapi({ description: 'User email address', example: 'user@example.com' }),
      username: z
        .string()
        .optional()
        .openapi({ description: 'User username', example: 'username123' }),
      password: z.string().min(1, { message: 'Password is required' }),
    })
    .refine((data) => data.identifier || data.email || data.username, {
      message: 'Email, username, or identifier is required',
      path: ['identifier'],
    })
    .transform((data) => ({
      identifier: (data.identifier || data.email || data.username) as string,
      password: data.password,
    })),
);

export type SignupRequestBody = z.infer<typeof AuthTokenSignupRequestSchema>;
export type SigninRequestBody = z.infer<typeof AuthTokenSigninRequestSchema>;
export type SigninRequestInput = z.input<typeof AuthTokenSigninRequestSchema>;

registry.registerPath({
  method: 'post',
  path: '/v1/auth-token/signup',
  summary: 'User Signup with Token-Based Authentication',
  tags: ['Auth Token'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: AuthTokenSignupRequestSchema,
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'User signed up successfully',
      content: {
        'application/json': {
          schema: AuthTokenUserResponseSchema,
        },
      },
    },
    '400': {
      description: 'Invalid request body or validation failure',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.unknown().optional(),
            }),
          }),
        },
      },
    },
    '409': {
      description: 'Email or username already in use',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
    '500': {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/auth-token/signin',
  summary: 'User Signin with Token-Based Authentication',
  tags: ['Auth Token'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: AuthTokenSigninRequestSchema,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User signed in successfully',
      content: {
        'application/json': {
          schema: AuthTokenUserResponseSchema,
        },
      },
    },
    '400': {
      description: 'Invalid request body or validation failure',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.unknown().optional(),
            }),
          }),
        },
      },
    },
    '401': {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
    '500': {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
});
