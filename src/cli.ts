#!/usr/bin/env node
import { run } from './node/run.js';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString('utf8');
}

const color =
  !('NO_COLOR' in process.env) &&
  (process.env.FORCE_COLOR !== undefined || (process.stdout.isTTY ?? false));

run(process.argv.slice(2), {
  stdout: (s) => process.stdout.write(`${s}\n`),
  stderr: (s) => process.stderr.write(`${s}\n`),
  readStdin,
  stdinIsTTY: process.stdin.isTTY ?? false,
  cwd: process.cwd(),
  color,
  env: process.env,
}).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    process.stderr.write(`sloplint: unexpected error: ${(err as Error).stack ?? String(err)}\n`);
    process.exitCode = 2;
  },
);
