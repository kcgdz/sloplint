import { describe, expect, it } from 'vitest';
import { parseDirectives } from '../../src/core/ignore.js';
import { lint } from '../../src/core/lint.js';

const ids = (text: string): string[] => lint(text).findings.map((f) => `${f.line}:${f.ruleId}`);

describe('parseDirectives', () => {
  it('disable-next-line targets only the following line', () => {
    const m = parseDirectives('<!-- sloplint-disable-next-line vocab/delve -->\nx\ny');
    expect(m.isIgnored('vocab/delve', 2)).toBe(true);
    expect(m.isIgnored('vocab/delve', 3)).toBe(false);
    expect(m.isIgnored('vocab/tapestry', 2)).toBe(false);
  });

  it('accepts categories and multiple IDs', () => {
    const m = parseDirectives('<!-- sloplint-disable-line vocab, closer/hope-this-helps -->');
    expect(m.isIgnored('vocab/delve', 1)).toBe(true);
    expect(m.isIgnored('closer/hope-this-helps', 1)).toBe(true);
    expect(m.isIgnored('opener/lets-dive-in', 1)).toBe(false);
  });

  it('no IDs means every rule', () => {
    const m = parseDirectives('<!-- sloplint-disable-line -->');
    expect(m.isIgnored('anything/at-all', 1)).toBe(true);
  });

  it('disable/enable ranges', () => {
    const m = parseDirectives('a\n<!-- sloplint-disable -->\nb\nc\n<!-- sloplint-enable -->\nd');
    expect(m.isIgnored('vocab/delve', 1)).toBe(false);
    expect(m.isIgnored('vocab/delve', 3)).toBe(true);
    expect(m.isIgnored('vocab/delve', 4)).toBe(true);
    expect(m.isIgnored('vocab/delve', 6)).toBe(false);
  });

  it('disable without enable runs to end of file', () => {
    const m = parseDirectives('a\n<!-- sloplint-disable format -->\nb\n\n\nz');
    expect(m.isIgnored('format/excessive-bold', 6)).toBe(true);
    expect(m.isIgnored('vocab/delve', 6)).toBe(false);
  });

  it('disable-file covers everything', () => {
    const m = parseDirectives('x\ny\n<!-- sloplint-disable-file -->');
    expect(m.isIgnored('vocab/delve', 1)).toBe(true);
  });

  it('works in any comment syntax and ignores reasons after --', () => {
    const m = parseDirectives('// sloplint-disable-next-line vocab/delve -- quoting a customer\nx');
    expect(m.isIgnored('vocab/delve', 2)).toBe(true);
    expect(m.isIgnored('vocab/tapestry', 2)).toBe(false);
    const hash = parseDirectives('# sloplint-disable-next-line\nx');
    expect(hash.isIgnored('vocab/delve', 2)).toBe(true);
  });
});

describe('ignore directives in lint()', () => {
  it('suppresses findings end to end', () => {
    const text =
      'We delve.\n<!-- sloplint-disable-next-line vocab/delve -->\nWe delve again.\nWe delve once more.';
    expect(ids(text)).toEqual(['1:vocab/delve', '4:vocab/delve']);
  });
});
