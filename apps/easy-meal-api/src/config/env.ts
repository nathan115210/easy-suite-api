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
});

export const env = EnvSchema.parse(process.env);
