import { spawnSync } from 'node:child_process';
import { getApps, printAvailableApps, resolveApp } from './workspace-apps.mjs';

const requestedApp = process.argv[2];
const apps = getApps();

if (!requestedApp) {
  console.error('Usage: pnpm dev:api <app-name>');
  console.error('');
  printAvailableApps(apps);
  process.exit(1);
}

const app = resolveApp(apps, requestedApp);

if (!app) {
  console.error(`Unknown app: ${requestedApp}`);
  console.error('');
  printAvailableApps(apps);
  process.exit(1);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

// Local API development needs the shared PostgreSQL container before the app
// starts. Keep that setup here so contributors do not have to remember two
// commands for the common development loop.
const databaseResult = spawnSync(pnpm, ['dev:db'], {
  stdio: 'inherit',
});

if (databaseResult.status !== 0) {
  process.exit(databaseResult.status ?? 1);
}

// Delegate to pnpm filtering so workspace dependency resolution stays exactly
// the same as running `pnpm --filter <package> dev` by hand.
const appResult = spawnSync(pnpm, ['--filter', app.name, 'dev'], {
  stdio: 'inherit',
});

process.exit(appResult.status ?? 1);
