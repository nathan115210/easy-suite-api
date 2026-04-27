import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const appsDir = join(process.cwd(), 'apps');

export function getApps() {
  if (!existsSync(appsDir)) {
    return [];
  }

  // Apps are discovered from the workspace convention instead of hard-coded
  // root scripts. When a new API is added under apps/<name>, these workflow
  // scripts can run it as long as that app has a package.json with a dev script.
  return readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packageJsonPath = join(appsDir, entry.name, 'package.json');

      if (!existsSync(packageJsonPath)) {
        return null;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      return {
        dir: entry.name,
        name: packageJson.name,
      };
    })
    .filter(Boolean);
}

export function printAvailableApps(apps) {
  console.error('Available apps:');

  for (const app of apps) {
    console.error(`  - ${app.name}`);
  }
}

export function resolveApp(apps, requestedApp) {
  return apps.find((app) => app.name === requestedApp || app.dir === requestedApp);
}
