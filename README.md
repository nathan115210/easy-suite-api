# Easy Suite API

Easy Suite API is the backend monorepo for Easy Suite services. The repository is currently in its foundation stage: the workspace, tooling, API shell, database setup, shared utilities, tests, and documentation scaffolding are in place.

## Current Foundation

- Repo and pnpm workspace
- Turborepo task runner
- TypeScript
- ESLint and Prettier
- Docker PostgreSQL
- Express API
- Health check endpoint
- Shared utilities package
- Jest foundation
- Husky and lint-staged
- Drizzle foundation
- OpenAPI / Swagger docs foundation

## Workspace

```text
apps/
  easy-meal-api/      Express API service
packages/
  utils/              Shared logger, errors, and HTTP helpers
docs/                 Developer documentation
```

## Quick Start

Requirements:

- Node.js compatible with the installed dependencies
- pnpm `10.x`
- Docker

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
pnpm dev:db
```

Start the API:

```bash
pnpm dev:api easy-meal-api
```

The API runs on `http://localhost:8282` by default.

Useful local URLs:

- Health check: `http://localhost:8282/v1/health`
- Swagger UI: `http://localhost:8282/docs`

## Common Commands

```bash
pnpm dev
pnpm dev:app easy-meal-api
pnpm dev:api easy-meal-api
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:check
pnpm dev:db
pnpm dev:db:down
pnpm dev:db:reset
```

## Developer Docs

- [Development Setup](docs/development.md)
- [Contributor Guide](docs/contributing.md)
- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database](docs/database.md)
- [Testing and Quality](docs/testing-and-quality.md)

## Status

This project is not feature complete yet. Treat the current codebase as the baseline for future service development: app structure, tooling, local database, health check, shared utilities, tests, and OpenAPI docs are ready for the first product features.
