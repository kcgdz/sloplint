#!/usr/bin/env node
// Bundles the playground into playground-dist/ for GitHub Pages.
// The engine is imported straight from src/core, so the browser runs the
// exact same rules as the CLI.

import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'playground-dist');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(root, 'playground/src/main.ts')],
  outfile: join(out, 'app.js'),
  bundle: true,
  format: 'esm',
  target: ['es2022', 'chrome111', 'firefox113', 'safari16.4'],
  minify: true,
  sourcemap: true,
  loader: { '.md': 'text' },
  legalComments: 'none',
  logLevel: 'warning',
});

for (const file of ['index.html', 'styles.css']) {
  copyFileSync(join(root, 'playground', file), join(out, file));
}
// Serve files as-is, without Jekyll processing.
writeFileSync(join(out, '.nojekyll'), '');

console.log(`playground built to ${out}`);
