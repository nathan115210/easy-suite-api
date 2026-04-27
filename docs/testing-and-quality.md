# Testing and Quality

The repository has a baseline quality setup for TypeScript, linting, formatting, tests, and pre-commit checks.

## TypeScript

Run type checks from the repository root:

```bash
pnpm typecheck
```

Shared TypeScript settings live in:

```text
tsconfig.base.json
```

The API has its own app-level config:

```text
apps/easy-meal-api/tsconfig.json
```

## Linting

Run ESLint:

```bash
pnpm lint
```

The root ESLint config is:

```text
eslint.config.js
```

## Formatting

Prettier is configured with:

```text
.prettierrc
.prettierignore
```

Formatting is also wired into `lint-staged` for staged files.

## Tests

Run tests:

```bash
pnpm test
```

The current API test foundation uses Jest and Supertest.

Current integration test:

```text
apps/easy-meal-api/tests/integration/health.test.ts
```

## Git Hooks

Husky is installed through the root `prepare` script. `lint-staged` currently runs:

- Prettier for staged TypeScript, JavaScript, JSON, Markdown, YAML, and YML files
- ESLint fix for staged TypeScript and JavaScript files

## Suggested Pre-Commit Check

Before committing or opening a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```
