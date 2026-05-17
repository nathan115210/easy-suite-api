import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from '@/openapi/document';

export function registerSwaggerDocs(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
}
