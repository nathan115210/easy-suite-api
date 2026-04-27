import { execSync } from 'node:child_process';

const allowedBranchPattern = /^(feat|fix|chore)\/[a-z0-9][a-z0-9._-]*$/;

function getCurrentBranch() {
  return execSync('git branch --show-current', {
    encoding: 'utf8',
  }).trim();
}

const branchName = process.argv[2] ?? getCurrentBranch();

if (!branchName) {
  console.error('Could not detect the current git branch.');
  process.exit(1);
}

if (!allowedBranchPattern.test(branchName)) {
  console.error(`Invalid branch name: ${branchName}`);
  console.error('Branch names must match: feat/<name>, fix/<name>, or chore/<name>');
  console.error('Use lowercase letters, numbers, dots, underscores, or hyphens after the slash.');
  process.exit(1);
}
