import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Easy Suite API',
      version: '0.1.0',
      description: 'Central API monorepo for Easy Suite services.',
    },
    servers: [{ url: 'http://127.0.0.1:8282', description: 'Local development' }],
  });
}
