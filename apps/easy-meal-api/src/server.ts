import { logger } from '@easy-suite/utils';
import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  logger.info(`easy-meal-api running on http://localhost:${env.PORT}`);
});
