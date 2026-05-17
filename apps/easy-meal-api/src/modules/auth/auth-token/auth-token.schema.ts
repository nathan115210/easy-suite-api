import { z } from 'zod';
import { registry } from '@/openapi/registry';
import { USERNAME_MIN_LENGTH, USERNAME_MIN_LENGTH_MESSAGE } from '@/types/auth.types';

export const SignupRequestSchema = registry.register(
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

export const AuthTokenSignupResponseSchema = registry.register(
  'AuthTokenSignupResponse',
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

export type SignupRequestBody = z.infer<typeof SignupRequestSchema>;

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
          schema: SignupRequestSchema,
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'User signed up successfully',
      content: {
        'application/json': {
          schema: AuthTokenSignupResponseSchema,
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
