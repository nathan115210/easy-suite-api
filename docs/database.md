# Database

The project has a PostgreSQL and Drizzle foundation ready for application schema work.

## Local PostgreSQL

PostgreSQL runs through Docker Compose:

```bash
pnpm dev:db
```

Default local connection values come from `.env.example`:

```text
POSTGRES_DB=easy_meal
POSTGRES_USER=easy_meal
POSTGRES_PASSWORD=easy_meal
POSTGRES_PORT=5432
DATABASE_URL=postgresql://easy_meal:easy_meal@localhost:5432/easy_meal
```

Stop PostgreSQL:

```bash
pnpm dev:db:down
```

Reset the local database volume:

```bash
pnpm dev:db:reset
```

## Drizzle

Drizzle config lives at:

```text
apps/easy-meal-api/drizzle.config.ts
```

The schema entry point is:

```text
apps/easy-meal-api/src/db/schema/index.ts
```

The database client is initialized in:

```text
apps/easy-meal-api/src/db/index.ts
```

## Commands

Generate migrations:

```bash
pnpm db:generate
```

Run migrations:

```bash
pnpm db:migrate
```

Push schema changes directly:

```bash
pnpm db:push
```

Check schema and migration state:

```bash
pnpm db:check
```

## Development Notes

Use migrations for durable schema changes. `db:push` is useful during early local iteration, but migrations should become the default once product tables stabilize.

The API includes a periodic cleanup task for `user_sessions` that removes expired rows (`expires_at < NOW()`). This keeps session-table growth bounded over time without affecting active sessions.
