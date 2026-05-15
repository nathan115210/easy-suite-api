import { z } from 'zod';
import { registry } from '../../../openapi/registry';

export const SignupRequestSchema = registry.register(
  'SignupRequest',
  z.object({
    username: z.string().min(3).max(30),
    email: z.email(),
    password: z.string().min(6).max(50),
  }),
);

export const SignupResponseSchema = registry.register(
  'SignupResponse',
  z.object({
    message: z.string(),
    data: z.object({
      user: z.object({
        id: z.string(),
        username: z.string(),
        email: z.email(),
      }),
    }),
  }),
);

export const SigninResponseSchema = registry.register(
  'SigninResponse',
  z.object({
    message: z.string(),
    data: z.object({
      user: z.object({
        id: z.string(),
        username: z.string(),
        email: z.email(),
      }),
    }),
  }),
);

export const SigninRequestSchema = registry.register(
  'SigninRequest',
  z
    .object({
      email: z.email().optional(),
      username: z.string().optional(),
      password: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!data.email && !data.username) {
        ctx.addIssue({
          code: 'custom',
          message: 'Either email or username is required',
          path: ['email'],
        });
      }
    }),
);

registry.registerPath({
  method: 'post',
  path: '/v1/auth-sessions/signup',
  summary: 'User Signup with Session Management',
  tags: ['Auth Sessions'],
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
          schema: SignupResponseSchema,
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
  path: '/v1/auth-sessions/signin',
  summary: 'User Signin with Session Management',
  tags: ['Auth Sessions'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SigninRequestSchema,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User signed in successfully',
      content: {
        'application/json': {
          schema: SigninResponseSchema,
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
