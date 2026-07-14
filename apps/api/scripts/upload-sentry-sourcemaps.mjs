import { spawnSync } from 'node:child_process';

const requiredVariables = [
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT_API',
  'SENTRY_RELEASE',
];

const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing Sentry environment variables: ${missingVariables.join(', ')}`,
  );
}

function run(args) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'sentry-cli', ...args],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(['sourcemaps', 'inject', 'dist']);

run([
  'sourcemaps',
  'upload',
  '--org',
  process.env.SENTRY_ORG,
  '--project',
  process.env.SENTRY_PROJECT_API,
  '--release',
  process.env.SENTRY_RELEASE,
  'dist',
]);
