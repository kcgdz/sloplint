import pc from 'picocolors';
import { computeScore, labelOf } from '../core/score.js';
import type { Finding, LintResult, ScoreLabel, Severity } from '../core/types.js';

export interface FileResult {
  path: string;
  result: LintResult;
}

export interface Summary {
  files: number;
  findings: number;
  errors: number;
  warnings: number;
  infos: number;
  words: number;
  points: number;
  score: number;
  label: ScoreLabel;
}

export function summarize(results: FileResult[]): Summary {
  const all = results.flatMap((r) => r.result.findings);
  const words = results.reduce((n, r) => n + r.result.words, 0);
  const points = results.reduce((n, r) => n + r.result.points, 0);
  const score = computeScore(points, words);
  const count = (s: Severity): number => all.filter((f) => f.severity === s).length;
  return {
    files: results.length,
    findings: all.length,
    errors: count('error'),
    warnings: count('warning'),
    infos: count('info'),
    words,
    points,
    score,
    label: labelOf(score),
  };
}

export interface FormatOptions {
  color?: boolean;
  /** Hide info-level findings from the listing (they still count toward the score). */
  quiet?: boolean;
}

// ---------------------------------------------------------------- stylish

function scoreColor(
  label: ScoreLabel,
  c: ReturnType<typeof pc.createColors>,
): (s: string) => string {
  switch (label) {
    case 'Human':
      return c.green;
    case 'Light seasoning':
      return c.cyan;
    case 'Sloppy':
      return c.yellow;
    default:
      return c.red;
  }
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function formatStylish(results: FileResult[], options: FormatOptions = {}): string {
  const c = pc.createColors(options.color ?? false);
  const sev: Record<Severity, string> = {
    error: c.red('error  '),
    warning: c.yellow('warning'),
    info: c.blue('info   '),
  };
  const lines: string[] = [];

  for (const { path, result } of results) {
    const shown = options.quiet
      ? result.findings.filter((f) => f.severity !== 'info')
      : result.findings;
    const colorize = scoreColor(result.label, c);
    lines.push(
      `${c.underline(path)}  ${c.dim('slop score')} ${colorize(c.bold(`${result.score}/100`))} ${colorize(result.label)}`,
    );
    if (shown.length === 0) {
      lines.push(c.dim('  no findings'), '');
      continue;
    }
    const posWidth = Math.max(...shown.map((f) => `${f.line}:${f.column}`.length));
    const indent = ' '.repeat(2 + posWidth + 2 + 7 + 2);
    for (const f of shown) {
      const pos = `${f.line}:${f.column}`.padEnd(posWidth);
      lines.push(
        `  ${c.dim(pos)}  ${sev[f.severity]}  ${c.bold(`"${truncate(f.match, 60)}"`)}  ${c.dim(f.ruleId)}`,
      );
      lines.push(`${indent}${f.message}`);
      lines.push(`${indent}${c.green('fix:')} ${f.suggestion}`);
    }
    lines.push('');
  }

  const s = summarize(results);
  const colorize = scoreColor(s.label, c);
  const counts = `${plural(s.errors, 'error')}, ${plural(s.warnings, 'warning')}, ${s.infos} info`;
  lines.push(
    s.findings === 0
      ? c.green(`No slop found in ${plural(s.files, 'file')} (${s.words} words).`)
      : `${plural(s.findings, 'finding')} (${counts}) in ${plural(s.files, 'file')}, ${s.words} words.`,
  );
  lines.push(`Slop score: ${colorize(c.bold(`${s.score}/100`))} ${colorize(`(${s.label})`)}`);
  return lines.join('\n');
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// ---------------------------------------------------------------- json

export function formatJson(results: FileResult[], version: string): string {
  return JSON.stringify(
    {
      version,
      summary: summarize(results),
      files: results.map(({ path, result }) => ({
        path,
        score: result.score,
        label: result.label,
        words: result.words,
        points: result.points,
        findings: result.findings,
      })),
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------- github

const escapeData = (s: string): string =>
  s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escapeProperty = (s: string): string =>
  escapeData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');

const COMMAND: Record<Severity, string> = { error: 'error', warning: 'warning', info: 'notice' };

/** GitHub Actions workflow commands, one annotation per finding plus a score notice per file. */
export function formatGithub(results: FileResult[], options: FormatOptions = {}): string {
  const lines: string[] = [];
  for (const { path, result } of results) {
    const shown = options.quiet
      ? result.findings.filter((f) => f.severity !== 'info')
      : result.findings;
    for (const f of shown) lines.push(annotation(path, f));
    lines.push(
      `::notice file=${escapeProperty(path)},title=${escapeProperty('sloplint score')}::${escapeData(`Slop score ${result.score}/100 (${result.label}), ${plural(result.findings.length, 'finding')}`)}`,
    );
  }
  const s = summarize(results);
  lines.push(
    `Slop score: ${s.score}/100 (${s.label}), ${plural(s.findings, 'finding')} in ${plural(s.files, 'file')}.`,
  );
  return lines.join('\n');
}

function annotation(path: string, f: Finding): string {
  const props = [
    `file=${escapeProperty(path)}`,
    `line=${f.line}`,
    `col=${f.column}`,
    `endLine=${f.endLine}`,
    `endColumn=${f.endColumn}`,
    `title=${escapeProperty(`sloplint ${f.ruleId}`)}`,
  ].join(',');
  return `::${COMMAND[f.severity]} ${props}::${escapeData(`"${f.match}": ${f.message} Fix: ${f.suggestion}`)}`;
}
