import { config } from 'dotenv';
import { z } from 'zod';

config({
  path: '../../.env',
});

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8282),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.string().default('info'),
  SESSION_CLEANUP_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  SESSION_CLEANUP_INTERVAL_MS: z.coerce
    .number()
    .positive()
    .default(1000 * 60 * 60),
});

export const env = EnvSchema.parse(process.env);
