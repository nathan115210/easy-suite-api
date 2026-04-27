import { logger } from '@easy-suite/utils';
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  logger.info(`easy-meal-api running on http://localhost:${env.PORT}`);
});
