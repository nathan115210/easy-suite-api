# CI and Local Workflow Testing

The base CI workflow runs the same baseline checks contributors should run before opening a pull request:

- Install dependencies
- Lint
- Typecheck
- Test

The GitHub Actions workflow lives at:

```text
.github/workflows/base.yml
```

## GitHub Actions

The workflow runs on:

- Pull requests
- Pushes to `main`

Current job:

```text
base
```

The job uses Ubuntu, pnpm, Node.js, and the repository lockfile to run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

## Local GitHub Actions Testing

Use `act` to run the GitHub Actions workflow locally in Docker.

Requirements:

- Docker running locally
- `act` `0.2.86` or newer installed locally

Install `act` on macOS:

```bash
brew install act
```

Upgrade `act` on macOS:

```bash
brew upgrade act
```

The local CI scripts check the installed `act` version before running because older versions may be blocked by known security advisories.

List local workflow jobs:

```bash
pnpm ci:local:list
```

Run the base job locally:

```bash
pnpm ci:local
```

The repository includes `.actrc` so local runs use:

```text
catthehacker/ubuntu:act-22.04
```

This image is lighter than `catthehacker/ubuntu:full-latest` while still including the baseline runtime tools needed by common GitHub Actions, including `node` for actions such as `actions/setup-node`.

On Apple Silicon, local `act` runs use `linux/arm64`. This avoids pulling a second `linux/amd64` copy of the same runner image just for local feedback.

If a future workflow needs tools that are missing from `act-22.04`, switch `.actrc` to `catthehacker/ubuntu:full-latest` for a closer but much heavier local runner.

## Notes

The local `act` run may need to pull the runner image the first time it is executed. That can take a few minutes depending on network speed.

Do not add domain-specific services or database migrations to the base workflow unless the project explicitly moves to that step.
