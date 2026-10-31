import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import pkg from '../../package.json' with { type: 'json' };
import { lint } from '../core/lint.js';
import { CATEGORIES, rules } from '../core/rules/index.js';
import { badgeMarkdown } from '../core/score.js';
import type { RuleSetting, Severity } from '../core/types.js';
import {
  formatGithub,
  formatJson,
  formatStylish,
  summarize,
  type FileResult,
} from '../formatters/index.js';
import { ConfigError, loadConfig, type SloplintConfig } from './config.js';
import { expandInputs } from './files.js';

export const VERSION: string = pkg.version;

export interface Io {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  readStdin: () => Promise<string>;
  stdinIsTTY: boolean;
  cwd: string;
  color: boolean;
  env: Record<string, string | undefined>;
}

const HELP = `sloplint ${VERSION}
Lint prose for AI-slop patterns. Offline and deterministic.

Usage
  sloplint [files, directories or globs...] [options]
  cat draft.md | sloplint --stdin

Options
  -f, --format <name>        stylish (default), json, github
      --json                 Same as --format json
  -c, --config <path>        Use this config file instead of searching for .sloplintrc
      --no-config            Ignore config files
      --rule <id=severity>   Override a rule, e.g. --rule vocab/delve=off (repeatable)
      --max-score <n>        Exit 1 if any file scores above n (0-100)
      --fail-on <level>      Exit 1 on findings at this level or above: error (default), warning, info, none
      --skip-quoted          Don't lint text inside double quotes
      --stdin                Read text from stdin
      --stdin-filename <n>   Name to report for stdin input (default: <stdin>)
  -q, --quiet                Hide info-level findings (they still count toward the score)
      --badge                Print a shields.io badge for the overall score and nothing else
      --list-rules           List all rules
      --no-color             Disable colors
  -h, --help                 Show this help
  -v, --version              Show the version

Exit codes: 0 ok, 1 findings over threshold, 2 usage or config error.
Docs: https://github.com/kcgdz/sloplint`;

const SEVERITY_RANK: Record<Severity, number> = { info: 1, warning: 2, error: 3 };

class UsageError extends Error {}

function parseRuleFlag(value: string): [string, RuleSetting] {
  const m = /^([a-z]+(?:\/(?:[a-z0-9-]+|\*))?)[=:](off|info|warning|error)$/.exec(value.trim());
  if (!m?.[1] || !m[2])
    throw new UsageError(`Invalid --rule "${value}". Expected <id>=<off|info|warning|error>.`);
  return [m[1], m[2] as RuleSetting];
}

function listRules(json: boolean): string {
  if (json) {
    return JSON.stringify(
      rules.map(({ id, category, severity, title, why, suggestion, examples }) => ({
        id,
        category,
        severity,
        title,
        why,
        suggestion,
        examples,
      })),
      null,
      2,
    );
  }
  const lines: string[] = [];
  for (const cat of CATEGORIES) {
    lines.push(`${cat.title}`);
    for (const r of rules.filter((x) => x.category === cat.id)) {
      lines.push(`  ${r.id.padEnd(34)} ${r.severity.padEnd(8)} ${r.title}`);
    }
    lines.push('');
  }
  lines.push(`${rules.length} rules.`);
  return lines.join('\n');
}

export async function run(argv: string[], io: Io): Promise<number> {
  try {
    return await main(argv, io);
  } catch (err) {
    if (err instanceof UsageError || err instanceof ConfigError) {
      io.stderr(`sloplint: ${err.message}`);
      return 2;
    }
    throw err;
  }
}

async function main(argv: string[], io: Io): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        format: { type: 'string', short: 'f' },
        json: { type: 'boolean' },
        config: { type: 'string', short: 'c' },
        'no-config': { type: 'boolean' },
        rule: { type: 'string', multiple: true },
        'max-score': { type: 'string' },
        'fail-on': { type: 'string' },
        'skip-quoted': { type: 'boolean' },
        stdin: { type: 'boolean' },
        'stdin-filename': { type: 'string' },
        quiet: { type: 'boolean', short: 'q' },
        badge: { type: 'boolean' },
        'list-rules': { type: 'boolean' },
        'no-color': { type: 'boolean' },
        color: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (err) {
    throw new UsageError(`${(err as Error).message}\nRun "sloplint --help" for usage.`);
  }
  const { values, positionals } = parsed;

  if (values.help) {
    io.stdout(HELP);
    return 0;
  }
  if (values.version) {
    io.stdout(VERSION);
    return 0;
  }

  const format = values.json ? 'json' : (values.format ?? 'stylish');
  if (!['stylish', 'json', 'github'].includes(format)) {
    throw new UsageError(`Unknown format "${format}". Use stylish, json or github.`);
  }
  if (values['list-rules']) {
    io.stdout(listRules(format === 'json'));
    return 0;
  }

  // Config: file, then CLI overrides.
  let config: SloplintConfig = {};
  if (!values['no-config']) {
    const loaded = loadConfig(values.config, io.cwd);
    config = loaded.config;
    for (const w of loaded.warnings) io.stderr(`sloplint: warning: ${w}`);
  }
  const ruleSettings: Record<string, RuleSetting> = { ...config.rules };
  for (const r of values.rule ?? []) {
    const [id, setting] = parseRuleFlag(r);
    ruleSettings[id] = setting;
  }

  let maxScore = config.maxScore;
  if (values['max-score'] !== undefined) {
    maxScore = Number(values['max-score']);
    if (!Number.isFinite(maxScore) || maxScore < 0 || maxScore > 100) {
      throw new UsageError(`--max-score must be a number from 0 to 100.`);
    }
  }
  const failOn = values['fail-on'] ?? config.failOn ?? 'error';
  if (!['error', 'warning', 'info', 'none'].includes(failOn)) {
    throw new UsageError(`--fail-on must be error, warning, info or none.`);
  }
  const skipQuoted = values['skip-quoted'] ?? config.skipQuoted ?? false;
  const lintOptions = { rules: ruleSettings, skipQuoted };

  // Inputs.
  const inputs = positionals.filter((p) => p !== '-');
  const wantsStdin =
    values.stdin || positionals.includes('-') || (inputs.length === 0 && !io.stdinIsTTY);
  if (inputs.length === 0 && !wantsStdin) {
    io.stderr(HELP);
    return 2;
  }

  const results: FileResult[] = [];
  if (wantsStdin) {
    const text = await io.readStdin();
    if (inputs.length === 0 && text.trim() === '' && !values.stdin && !positionals.includes('-')) {
      io.stderr(HELP);
      return 2;
    }
    results.push({ path: values['stdin-filename'] ?? '<stdin>', result: lint(text, lintOptions) });
  }

  if (inputs.length > 0) {
    const { files, unmatched } = await expandInputs(inputs, {
      cwd: io.cwd,
      ignore: config.ignore ?? [],
    });
    for (const u of unmatched) io.stderr(`sloplint: no files matched "${u}".`);
    if (files.length === 0 && results.length === 0) return 2;
    for (const file of files) {
      const text = readFileSync(resolve(io.cwd, file), 'utf8');
      results.push({ path: file, result: lint(text, lintOptions) });
    }
  }

  // Output.
  const quiet = values.quiet ?? false;
  if (values.badge) io.stdout(badgeMarkdown(summarize(results).score));
  else if (format === 'json') io.stdout(formatJson(results, VERSION));
  else if (format === 'github') io.stdout(formatGithub(results, { quiet }));
  else {
    const color = values['no-color'] ? false : values.color ? true : io.color;
    io.stdout(formatStylish(results, { color, quiet }));
  }

  // Exit code.
  const threshold = failOn === 'none' ? Infinity : SEVERITY_RANK[failOn as Severity];
  const failedSeverity = results.some((r) =>
    r.result.findings.some((f) => SEVERITY_RANK[f.severity] >= threshold),
  );
  const failedScore = maxScore !== undefined && results.some((r) => r.result.score > maxScore);
  return failedSeverity || failedScore ? 1 : 0;
}
