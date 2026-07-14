import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const targets = [
  {
    path: 'src/app/error.tsx',
    surface: 'app-error-boundary',
  },
  {
    path: 'src/app/global-error.tsx',
    surface: 'global-error-boundary',
  },
];

async function patchFile(relativePath, surface) {
  const absolutePath = resolve(process.cwd(), relativePath);
  let source = await readFile(absolutePath, 'utf8');

  if (!source.includes("from '@sentry/nextjs'")) {
    source = source.replace(
      /^(['"])use client\1;\s*/m,
      (match) =>
        `${match}\nimport * as Sentry from '@sentry/nextjs';\n`,
    );
  }

  if (!source.includes("from 'react'")) {
    const sentryImport =
      "import * as Sentry from '@sentry/nextjs';";

    source = source.replace(
      sentryImport,
      `${sentryImport}\nimport { useEffect } from 'react';`,
    );
  } else if (
    !/import\s*\{[^}]*\buseEffect\b[^}]*\}\s*from\s*['"]react['"]/.test(
      source,
    )
  ) {
    source = source.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]react['"];/,
      (_, imports) =>
        `import { ${imports.trim()}, useEffect } from 'react';`,
    );
  }

  if (!source.includes(`surface: '${surface}'`)) {
    const functionPattern =
      /(export\s+default\s+function\s+\w+\s*\(\s*\{\s*error\s*,\s*reset\s*\}\s*:\s*\w+\s*\)\s*\{)/m;

    if (!functionPattern.test(source)) {
      throw new Error(
        `Could not find the error boundary function in ${relativePath}`,
      );
    }

    source = source.replace(
      functionPattern,
      `$1
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        surface: '${surface}',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);
`,
    );
  }

  await writeFile(absolutePath, source, 'utf8');
  console.log(`Patched ${relativePath}`);
}

for (const target of targets) {
  await patchFile(target.path, target.surface);
}
