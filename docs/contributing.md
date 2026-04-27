# Contributor Guide

This project is still in its foundation stage. The goal for contributors is to keep conventions simple, repeatable, and easy to extend as more APIs and shared packages are added.

## Core Rules

- Use pnpm from the repository root.
- Keep app-specific code inside the owning app under `apps/`.
- Put shared helpers in `packages/` only when more than one app can reasonably reuse them.
- Prefer small, versioned route modules over large route files.
- Keep environment variables documented in `.env.example` and `docs/development.md`.
- Update OpenAPI docs when adding or changing public endpoints.
- Add or update tests for behavior changes.

## Running Apps

Use the API development workflow:

```bash
pnpm dev:api easy-meal-api
```

This starts the local PostgreSQL container and then starts the selected API app. The runner accepts either the app package name or the app directory name. Package name is preferred because it matches pnpm workspace filtering.

If the local services are already running and you only want to start the app process, use:

```bash
pnpm dev:app easy-meal-api
```

Do not add one-off root scripts like:

```json
{
  "dev:meal": "pnpm --filter easy-meal-api dev"
}
```

Those scripts do not scale as new APIs are added. Instead, every app should define its own local `dev` script, and contributors should run it through:

```bash
pnpm dev:api <app-package-name>
```

## Adding a New API App

Create a new app under `apps/`:

```text
apps/
  new-api/
    package.json
    src/
```

The app `package.json` should include a package name and a `dev` script:

```json
{
  "name": "new-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts"
  }
}
```

After that, the app can be started with:

```bash
pnpm dev:api new-api
```

No root script changes are needed.

## Before Opening a Pull Request

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

To test the GitHub Actions base workflow locally with Docker, run:

```bash
pnpm ci:local
```

If your change touches database schema, also run the relevant Drizzle command:

```bash
pnpm db:generate
pnpm db:check
```

## Documentation Expectations

Update docs in the same change when contributor behavior changes. Examples:

- New setup steps belong in `docs/development.md`.
- New app or package conventions belong in this guide.
- Architecture decisions belong in `docs/architecture.md`.
- Public API behavior belongs in `docs/api.md`.
- Database workflow changes belong in `docs/database.md`.
