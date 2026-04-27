import { spawnSync } from 'node:child_process';
import { getApps, printAvailableApps, resolveApp } from './workspace-apps.mjs';

const requestedApp = process.argv[2];
const apps = getApps();

if (!requestedApp) {
  console.error('Usage: pnpm dev:app <app-name>');
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

// Delegate to pnpm filtering so workspace dependency resolution stays exactly
// the same as running `pnpm --filter <package> dev` by hand.
const result = spawnSync(pnpm, ['--filter', app.name, 'dev'], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
