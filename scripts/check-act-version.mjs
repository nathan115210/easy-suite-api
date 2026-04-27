import { spawnSync } from 'node:child_process';

const minimumVersion = [0, 2, 86];

function parseVersion(output) {
  const match = output.match(/(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
}

function isAtLeast(version, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (version[index] > minimum[index]) {
      return true;
    }

    if (version[index] < minimum[index]) {
      return false;
    }
  }

  return true;
}

const result = spawnSync('act', ['--version'], {
  encoding: 'utf8',
});

if (result.error) {
  console.error('act is required to run local GitHub Actions workflows.');
  console.error('Install it with: brew install act');
  process.exit(1);
}

const version = parseVersion(`${result.stdout}${result.stderr}`);

if (!version) {
  console.error('Could not detect act version. Please upgrade act before running local CI.');
  console.error('Upgrade with: brew upgrade act');
  process.exit(1);
}

if (!isAtLeast(version, minimumVersion)) {
  console.error(
    `act ${version.join('.')} is below the required minimum ${minimumVersion.join('.')}.`,
  );
  console.error('Upgrade with: brew upgrade act');
  process.exit(1);
}
