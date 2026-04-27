import { readFileSync } from 'node:fs';

const commitMessagePath = process.argv[2];
const conventionalCommitWithScopePattern =
  /^(feat|fix|chore|docs|test|refactor|style|perf|build|ci|revert)\([a-z0-9-]+\): .+$/;

if (!commitMessagePath) {
  console.error('Missing commit message file path.');
  process.exit(1);
}

const [commitSubject = ''] = readFileSync(commitMessagePath, 'utf8').split('\n');

if (!conventionalCommitWithScopePattern.test(commitSubject)) {
  console.error(`Invalid commit message: ${commitSubject}`);
  console.error('Commit messages must match: type(scope): message');
  console.error('Example: chore(ci): add base workflow');
  process.exit(1);
}
