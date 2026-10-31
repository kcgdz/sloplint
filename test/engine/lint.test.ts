import { describe, expect, it } from 'vitest';
import { lint, resolveSetting } from '../../src/core/lint.js';
import { rulesById } from '../../src/core/rules/index.js';

const delve = rulesById.get('vocab/delve')!;

describe('resolveSetting', () => {
  it('falls back to the rule default', () => {
    expect(resolveSetting(delve).severity).toBe('warning');
  });

  it('prefers exact ID over category wildcard over category', () => {
    expect(resolveSetting(delve, { vocab: 'info' }).severity).toBe('info');
    expect(resolveSetting(delve, { vocab: 'info', 'vocab/*': 'error' }).severity).toBe('error');
    expect(resolveSetting(delve, { 'vocab/*': 'error', 'vocab/delve': 'off' }).severity).toBe(
      'off',
    );
  });

  it('merges tuple options over defaults', () => {
    const r = resolveSetting(delve, { 'vocab/delve': ['error', { allow: ['delve'] }] });
    expect(r).toEqual({ severity: 'error', options: { allow: ['delve'] } });
  });
});

describe('lint', () => {
  it('returns a clean result for clean text', () => {
    const r = lint('The parser reads one file at a time and reports line numbers.');
    expect(r.findings).toEqual([]);
    expect(r.score).toBe(0);
    expect(r.label).toBe('Human');
  });

  it('reports precise positions and the original text', () => {
    const r = lint('Line one.\nWe  delve\tinto it.');
    const f = r.findings.find((x) => x.ruleId === 'vocab/delve')!;
    expect(f).toMatchObject({
      line: 2,
      column: 5,
      endLine: 2,
      endColumn: 10,
      match: 'delve',
      severity: 'warning',
    });
    expect(f.offset).toBe(14);
  });

  it('turns rules off and changes severity', () => {
    expect(lint('We delve.', { rules: { 'vocab/delve': 'off' } }).findings).toEqual([]);
    expect(lint('We delve.', { rules: { vocab: 'error' } }).findings[0]?.severity).toBe('error');
  });

  it('honours the allow option of phrase rules', () => {
    const text = 'A robust, seamless API.';
    const r = lint(text, {
      rules: { 'vocab/hype-adjectives': ['warning', { allow: ['robust'] }] },
    });
    expect(r.findings.map((f) => f.match)).toEqual(['seamless']);
  });

  it('honours density thresholds from options', () => {
    const text = 'It is crucial.';
    expect(lint(text).findings).toEqual([]);
    const r = lint(text, {
      rules: { 'vocab/gravitas': ['info', { minCount: 1, per100Words: 0 }] },
    });
    expect(r.findings).toHaveLength(1);
  });

  it('provides replacements for simple word swaps', () => {
    const f = lint('We utilize Redis.').findings[0]!;
    expect(f.replacement).toBe('use');
    expect(f.suggestion).toBe('Try "use".');
  });

  it('sorts findings by position', () => {
    const offsets = lint('Hope this helps! We delve. In conclusion, robust.').findings.map(
      (f) => f.offset,
    );
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it('skips quoted text when asked', () => {
    const text = 'The customer wrote "we want to delve deeper" in the ticket.';
    expect(lint(text).findings).toHaveLength(1);
    expect(lint(text, { skipQuoted: true }).findings).toHaveLength(0);
  });
});

describe('cross-rule overlap', () => {
  it('counts overlapping findings from the same category once', () => {
    const r = lint("In today's digital landscape, teams struggle.");
    expect(r.findings.filter((f) => f.category === 'opener')).toHaveLength(1);
  });

  it('keeps overlapping findings from different categories', () => {
    const r = lint('Truly seamless, incredibly robust, absolutely effortless.');
    const cats = new Set(r.findings.map((f) => f.category));
    expect(cats.has('vocab')).toBe(true);
    expect(r.findings.length).toBeGreaterThanOrEqual(6);
  });
});
