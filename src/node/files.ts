import { existsSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { glob } from 'tinyglobby';

export const DEFAULT_EXTENSIONS = ['md', 'mdx', 'markdown', 'txt'];
const ALWAYS_IGNORED = ['**/node_modules/**', '**/.git/**'];

const toPosix = (p: string): string => p.replace(/\\/g, '/');

/**
 * Expands CLI inputs into a sorted list of file paths relative to `cwd`.
 * Files are taken as-is (any extension), directories are searched for prose
 * files, anything else is treated as a glob.
 */
export async function expandInputs(
  inputs: string[],
  options: { cwd?: string; ignore?: string[] } = {},
): Promise<{ files: string[]; unmatched: string[] }> {
  const cwd = options.cwd ?? process.cwd();
  const ignore = [...ALWAYS_IGNORED, ...(options.ignore ?? [])];
  const files = new Set<string>();
  const unmatched: string[] = [];
  const ext = `{${DEFAULT_EXTENSIONS.join(',')}}`;

  for (const input of inputs) {
    const abs = resolve(cwd, input);
    let patterns: string[];
    let explicitFile = false;
    if (existsSync(abs) && statSync(abs).isFile()) {
      patterns = [toPosix(relative(cwd, abs))];
      explicitFile = true;
    } else if (existsSync(abs) && statSync(abs).isDirectory()) {
      const dir = toPosix(relative(cwd, abs)) || '.';
      patterns = [`${dir}/**/*.${ext}`];
    } else {
      patterns = [toPosix(input)];
    }

    const found = explicitFile
      ? patterns
      : await glob(patterns, {
          cwd,
          ignore,
          dot: false,
          onlyFiles: true,
          expandDirectories: false,
        });
    if (found.length === 0) unmatched.push(input);
    for (const f of found) files.add(toPosix(f));
  }

  // Explicit files still honour config "ignore" globs.
  if (options.ignore?.length) {
    const kept = await glob([...files], { cwd, ignore, onlyFiles: true, expandDirectories: false });
    const keep = new Set(kept.map(toPosix));
    for (const f of [...files]) if (!keep.has(f)) files.delete(f);
  }

  return { files: [...files].sort(), unmatched };
}
