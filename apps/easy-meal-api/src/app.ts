import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from '@easy-suite/utils';
import { v1Router } from './v1/router.js';
import { errorHandler } from './middlewares/error-handler.js';
import { registerSwaggerDocs } from './openapi/swagger.js';

export const app = express();

app.use(
  pinoHttp.default({
    logger,
  }),
);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Register Swagger documentation
registerSwaggerDocs(app);

app.use('/v1', v1Router);

app.use(errorHandler);
