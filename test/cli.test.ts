import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { run, VERSION, type Io } from '../src/node/run.js';

let dir: string;
let out: string[];
let err: string[];

function io(overrides: Partial<Io> = {}): Io {
  return {
    stdout: (s) => out.push(s),
    stderr: (s) => err.push(s),
    readStdin: async () => '',
    stdinIsTTY: true,
    cwd: dir,
    color: false,
    env: {},
    ...overrides,
  };
}

function write(rel: string, content: string): void {
  const p = join(dir, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, content);
}

const SLOP = "In today's fast-paced world, we delve into seamless tools.\n\nHope this helps!\n";
const CLEAN = 'The parser reads one file at a time.\n';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sloplint-'));
  out = [];
  err = [];
});

describe('cli', () => {
  it('prints help and version', async () => {
    expect(await run(['--help'], io())).toBe(0);
    expect(out.join()).toContain('Usage');
    out = [];
    expect(await run(['-v'], io())).toBe(0);
    expect(out).toEqual([VERSION]);
  });

  it('exits 2 with help when there is no input', async () => {
    expect(await run([], io())).toBe(2);
    expect(err.join()).toContain('Usage');
  });

  it('lints a file and exits 0 on warnings by default', async () => {
    write('a.md', SLOP);
    expect(await run(['a.md'], io())).toBe(0);
    const text = out.join('\n');
    expect(text).toContain('a.md');
    expect(text).toContain('opener/fast-paced-world');
    expect(text).toMatch(/Slop score: \d+\/100/);
  });

  it('exits 1 with --fail-on warning or --max-score', async () => {
    write('a.md', SLOP);
    expect(await run(['a.md', '--fail-on', 'warning'], io())).toBe(1);
    expect(await run(['a.md', '--max-score', '10'], io())).toBe(1);
    expect(await run(['a.md', '--max-score', '100'], io())).toBe(0);
  });

  it('exits 1 on errors by default', async () => {
    write('a.md', 'As an AI language model, I cannot say.');
    expect(await run(['a.md'], io())).toBe(1);
  });

  it('expands directories and globs, skipping node_modules', async () => {
    write('docs/a.md', CLEAN);
    write('docs/sub/b.txt', CLEAN);
    write('docs/c.js', 'delve');
    write('node_modules/x/README.md', SLOP);
    expect(await run(['.', '--json'], io())).toBe(0);
    const paths = JSON.parse(out.join('')).files.map((f: { path: string }) => f.path);
    expect(paths).toEqual(['docs/a.md', 'docs/sub/b.txt']);
  });

  it('reports unmatched inputs and exits 2 when nothing matched', async () => {
    expect(await run(['missing/*.md'], io())).toBe(2);
    expect(err.join()).toContain('no files matched');
  });

  it('reads stdin', async () => {
    const code = await run(
      ['--stdin', '--json', '--stdin-filename', 'msg.txt'],
      io({ readStdin: async () => SLOP }),
    );
    expect(code).toBe(0);
    const json = JSON.parse(out.join(''));
    expect(json.files[0].path).toBe('msg.txt');
    expect(json.files[0].findings.length).toBeGreaterThan(0);
  });

  it('reads piped stdin without flags', async () => {
    expect(await run(['--json'], io({ stdinIsTTY: false, readStdin: async () => SLOP }))).toBe(0);
    expect(JSON.parse(out.join('')).files[0].path).toBe('<stdin>');
  });

  it('emits JSON with summary and findings', async () => {
    write('a.md', SLOP);
    await run(['a.md', '--json'], io());
    const json = JSON.parse(out.join(''));
    expect(json.version).toBe(VERSION);
    expect(json.summary).toMatchObject({ files: 1 });
    expect(json.files[0].findings[0]).toMatchObject({
      ruleId: 'opener/fast-paced-world',
      line: 1,
      column: 1,
      severity: 'warning',
    });
  });

  it('emits GitHub annotations', async () => {
    write('a.md', SLOP);
    await run(['a.md', '-f', 'github'], io());
    const text = out.join('\n');
    expect(text).toMatch(
      /^::warning file=a\.md,line=1,col=1,endLine=1,endColumn=\d+,title=sloplint opener\/fast-paced-world::/m,
    );
    expect(text).toMatch(/^::notice file=a\.md,title=sloplint score::Slop score \d+\/100/m);
  });

  it('prints a badge', async () => {
    write('a.md', CLEAN);
    await run(['a.md', '--badge'], io());
    expect(out).toEqual([
      '![slop score](https://img.shields.io/badge/slop%20score-0%2F100%20Human-brightgreen)',
    ]);
  });

  it('applies --rule overrides', async () => {
    write('a.md', 'We delve.');
    await run(['a.md', '--json', '--rule', 'vocab/delve=off'], io());
    expect(JSON.parse(out.join('')).files[0].findings).toEqual([]);
  });

  it('rejects bad flags with exit 2', async () => {
    expect(await run(['--rule', 'nonsense'], io())).toBe(2);
    expect(await run(['--format', 'xml', 'a.md'], io())).toBe(2);
    expect(await run(['--max-score', '500', 'a.md'], io())).toBe(2);
    expect(await run(['--wat'], io())).toBe(2);
  });

  it('discovers .sloplintrc upward and applies rules, ignore and maxScore', async () => {
    write(
      '.sloplintrc',
      JSON.stringify({ rules: { 'vocab/delve': 'off' }, ignore: ['skip/**'], maxScore: 0 }),
    );
    write('sub/a.md', 'We delve.');
    write('skip/b.md', SLOP);
    const code = await run(['.', '--json'], io({ cwd: join(dir) }));
    const json = JSON.parse(out.join(''));
    expect(json.files.map((f: { path: string }) => f.path)).toEqual(['sub/a.md']);
    expect(json.files[0].findings).toEqual([]);
    expect(code).toBe(0);
  });

  it('reads config from package.json', async () => {
    write('package.json', JSON.stringify({ name: 'x', sloplint: { rules: { vocab: 'error' } } }));
    write('a.md', 'We delve.');
    expect(await run(['a.md'], io())).toBe(1);
  });

  it('--no-config ignores config files', async () => {
    write('.sloplintrc', JSON.stringify({ rules: { 'vocab/delve': 'error' } }));
    write('a.md', 'We delve.');
    expect(await run(['a.md'], io())).toBe(1);
    expect(await run(['a.md', '--no-config'], io())).toBe(0);
  });

  it('fails clearly on invalid config', async () => {
    write('.sloplintrc', '{ not json');
    write('a.md', CLEAN);
    expect(await run(['a.md'], io())).toBe(2);
    expect(err.join()).toContain('invalid JSON');
    err = [];
    write('.sloplintrc', JSON.stringify({ rules: { 'vocab/delve': 'loud' } }));
    expect(await run(['a.md'], io())).toBe(2);
    expect(err.join()).toContain('invalid setting');
  });

  it('warns about unknown rules and keys', async () => {
    write('.sloplintrc', JSON.stringify({ rules: { 'vocab/nope': 'off' }, colour: true }));
    write('a.md', CLEAN);
    expect(await run(['a.md'], io())).toBe(0);
    expect(err.join('\n')).toContain('unknown rule "vocab/nope"');
    expect(err.join('\n')).toContain('unknown key "colour"');
  });

  it('lists rules', async () => {
    await run(['--list-rules'], io());
    expect(out.join()).toContain('vocab/delve');
    out = [];
    await run(['--list-rules', '--json'], io());
    expect(JSON.parse(out.join('')).length).toBeGreaterThanOrEqual(30);
  });

  it('--quiet hides info findings but keeps them in the score', async () => {
    const text = 'Truly fast, incredibly simple, and absolutely free.';
    write('a.md', text);
    await run(['a.md'], io());
    const loud = out.join('\n');
    out = [];
    await run(['a.md', '-q'], io());
    const quiet = out.join('\n');
    expect(loud).toContain('vocab/intensifiers');
    expect(quiet).not.toContain('vocab/intensifiers');
    expect(quiet.match(/Slop score: (\d+)/)?.[1]).toBe(loud.match(/Slop score: (\d+)/)?.[1]);
  });
});
