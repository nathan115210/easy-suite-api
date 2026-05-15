# Development Setup

This guide explains how to run the current Easy Suite API foundation locally.

## Requirements

- Node.js compatible with the project dependencies
- pnpm `10.x`
- Docker

## Install Dependencies

From the repository root:

```bash
pnpm install
```

The repository is a pnpm workspace. Workspace packages are defined in `pnpm-workspace.yaml`:

- `apps/*`
- `packages/*`

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Current variables:

| Variable                      | Purpose                                                | Default                                                     |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `NODE_ENV`                    | Runtime environment                                    | `development`                                               |
| `PORT`                        | API port                                               | `8282`                                                      |
| `LOG_LEVEL`                   | Logger level                                           | `info`                                                      |
| `POSTGRES_DB`                 | Local PostgreSQL database                              | `easy_meal`                                                 |
| `POSTGRES_USER`               | Local PostgreSQL user                                  | `easy_meal`                                                 |
| `POSTGRES_PASSWORD`           | Local PostgreSQL password                              | `easy_meal`                                                 |
| `POSTGRES_PORT`               | Host PostgreSQL port                                   | `5432`                                                      |
| `DATABASE_URL`                | Drizzle and API database connection string             | `postgresql://easy_meal:easy_meal@localhost:5432/easy_meal` |
| `ALLOWED_ORIGIN`              | Frontend origin allowed for credentialed CORS requests | `http://localhost:3000`                                     |
| `SESSION_CLEANUP_ENABLED`     | Enable periodic expired-session cleanup job            | `true`                                                      |
| `SESSION_CLEANUP_INTERVAL_MS` | Interval for deleting expired sessions (milliseconds)  | `3600000`                                                   |

The API loads environment variables from the root `.env` file.

## Session Cleanup Job

The API starts a background cleanup job on startup to remove expired rows from `user_sessions`.

- Query behavior: delete sessions where `expires_at < NOW()`
- Trigger: immediate run on startup, then interval-based runs
- Controlled by: `SESSION_CLEANUP_ENABLED` and `SESSION_CLEANUP_INTERVAL_MS`

This cleanup does not replace logout behavior. A future logout endpoint should explicitly delete active session rows for the user action, while this job only removes already-expired sessions.

## Start Local PostgreSQL

```bash
pnpm dev:db
```

This starts the `postgres` service from `docker-compose.yml`.

Stop the database:

```bash
pnpm dev:db:down
```

Reset the database volume:

```bash
pnpm dev:db:reset
```

## Start the API

```bash
pnpm dev:api easy-meal-api
```

The `dev:api` script starts the local PostgreSQL container, then starts one API app by package name or app directory name.

Use `pnpm dev` when you want to run every workspace development task through Turborepo.

The current API service starts from `apps/easy-meal-api/src/server.ts`.

Examples:

```bash
pnpm dev:api easy-meal-api
pnpm dev:api apps-directory-name
```

When a new API is added under `apps/<api-name>`, contributors should not add a new root script like `dev:<api-name>`. Give the app package a `dev` script, then run it through `pnpm dev:api <package-name>`.

Default local URLs:

- API base: `http://localhost:8282`
- Health: `http://localhost:8282/v1/health`
- Meals: `http://localhost:8282/v1/meals`
- Swagger UI: `http://localhost:8282/docs`

## Try Meals Search Locally

After the API and database are running, seed the local meal data if needed:

```bash
pnpm --filter easy-meal-api db:seed
```

Then call the meals endpoint with optional search and filter query params:

```bash
curl "http://localhost:8282/v1/meals?q=pasta&difficulty=easy&cookTime=under_30&sort=created_desc"
```

Search by keyword only:

```bash
curl "http://localhost:8282/v1/meals?q=tomato%20pasta"
```

Supported query params:

| Parameter    | Values                                                           |
| ------------ | ---------------------------------------------------------------- |
| `q`          | Search text matched against meal titles                          |
| `difficulty` | `any`, `easy`, `medium`, `hard`                                  |
| `cookTime`   | `any`, `under_15`, `under_30`, `under_45`, `under_60`, `over_60` |
| `sort`       | `created_desc`, `created_asc`, `cook_time_asc`, `cook_time_desc` |

## Package Scripts

Root scripts are the main entry point:

| Command              | Purpose                             |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Run workspace development tasks     |
| `pnpm dev:api <app>` | Start PostgreSQL and run one API    |
| `pnpm build`         | Build workspace packages and apps   |
| `pnpm lint`          | Run ESLint through Turborepo        |
| `pnpm typecheck`     | Run TypeScript checks               |
| `pnpm test`          | Run tests                           |
| `pnpm db:generate`   | Generate Drizzle migrations         |
| `pnpm db:migrate`    | Apply Drizzle migrations            |
| `pnpm db:push`       | Push schema changes directly        |
| `pnpm db:check`      | Check Drizzle schema and migrations |
| `pnpm dev:db`        | Start local PostgreSQL              |
| `pnpm dev:db:down`   | Stop local PostgreSQL               |
| `pnpm dev:db:reset`  | Recreate local PostgreSQL volume    |

## Adding New Code

For app code, start in `apps/easy-meal-api/src`.

For shared helpers that can be reused by multiple apps, use `packages/utils/src`.

For new APIs, create a new directory under `apps/` with its own `package.json`. The package name and directory name are both accepted by `pnpm dev:api`, but package name is preferred in docs and examples because it is the workspace identity used by pnpm.

Before committing, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```
