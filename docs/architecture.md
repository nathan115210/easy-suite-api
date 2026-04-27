# Architecture

The repository is a TypeScript pnpm monorepo managed with Turborepo.

## High-Level Layout

```text
apps/
  easy-meal-api/
    src/
      app.ts
      server.ts
      config/
      db/
      middlewares/
      openapi/
      v1/
    tests/
packages/
  utils/
    src/
docs/
```

## Applications

### `apps/easy-meal-api`

The first API service. It uses:

- Express for HTTP routing
- Helmet and CORS for baseline middleware
- `pino-http` for request logging
- Zod for environment validation
- Drizzle ORM with PostgreSQL
- Swagger UI for OpenAPI documentation
- Jest and Supertest for tests

Important files:

| File                               | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `src/server.ts`                    | Starts the HTTP server                    |
| `src/app.ts`                       | Creates and configures the Express app    |
| `src/config/env.ts`                | Loads and validates environment variables |
| `src/v1/router.ts`                 | Versioned API router                      |
| `src/db/index.ts`                  | PostgreSQL pool and Drizzle client        |
| `src/db/schema/index.ts`           | Drizzle schema entry point                |
| `src/openapi/document.ts`          | OpenAPI document generator                |
| `src/openapi/swagger.ts`           | Swagger UI registration                   |
| `src/middlewares/error-handler.ts` | Central Express error handler             |

## Packages

### `packages/utils`

Shared utility package exported as `@easy-suite/utils`.

Current exports:

- Logger helpers
- Error helpers
- HTTP helpers

Keep utilities here only when they are useful across apps or packages. App-specific logic should stay inside the app that owns it.

## API Versioning

Routes are mounted under `/v1`.

Current endpoint:

```text
GET /v1/health
```

Future routes should be added to the versioned router or split into route modules and mounted from `src/v1/router.ts`.

## Configuration

Runtime configuration is validated with Zod in `apps/easy-meal-api/src/config/env.ts`.

The local development source of truth is the root `.env` file, copied from `.env.example`.

## Task Orchestration

Turborepo runs workspace tasks from the root package scripts. Build tasks depend on upstream package builds, while development and database tasks are intentionally uncached.

For running a single API locally with its supporting database, use:

```bash
pnpm dev:api <app-package-name>
```

This command discovers apps from `apps/*/package.json`, starts the shared local PostgreSQL container, and delegates to `pnpm --filter <package> dev`. This keeps the root `package.json` stable as more APIs are added.

For running only the app process, use:

```bash
pnpm dev:app <app-package-name>
```
