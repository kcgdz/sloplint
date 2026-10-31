import { describe, expect, it } from 'vitest';
import { lint } from '../src/core/lint.js';
import { CATEGORIES, rules } from '../src/core/rules/index.js';

/**
 * Every rule documents at least three bad and three good examples (two for
 * multi-paragraph structural rules). This suite asserts each bad example
 * triggers the rule and each good example does not, with every other rule
 * turned off so examples are tested in isolation.
 */
function hits(ruleId: string, text: string): number {
  const result = lint(
    text,
    {},
    rules.filter((r) => r.id === ruleId),
  );
  return result.findings.length;
}

describe('rule catalog', () => {
  it('has at least 30 rules', () => {
    expect(rules.length).toBeGreaterThanOrEqual(30);
  });

  it('has unique, well-formed IDs that match their category', () => {
    const ids = new Set<string>();
    for (const rule of rules) {
      expect(rule.id).toMatch(/^[a-z]+\/[a-z0-9-]+$/);
      expect(rule.id.split('/')[0]).toBe(rule.category);
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
    }
  });

  it('only uses known categories', () => {
    const known = new Set(CATEGORIES.map((c) => c.id));
    for (const rule of rules) expect(known.has(rule.category)).toBe(true);
  });

  it('documents every rule', () => {
    for (const rule of rules) {
      expect(rule.title.length, rule.id).toBeGreaterThan(0);
      expect(rule.why.length, rule.id).toBeGreaterThan(20);
      expect(rule.suggestion.length, rule.id).toBeGreaterThan(10);
      expect(rule.examples.bad.length, rule.id).toBeGreaterThanOrEqual(2);
      expect(rule.examples.good.length, rule.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the noisy rules at info by default', () => {
    const info = [
      'format/em-dash-density',
      'structure/rule-of-three',
      'vocab/gravitas',
      'vocab/journey',
      'vocab/intensifiers',
      'hedge/qualifier-density',
    ];
    for (const id of info) expect(rules.find((r) => r.id === id)?.severity, id).toBe('info');
  });
});

for (const rule of rules) {
  describe(rule.id, () => {
    for (const text of rule.examples.bad) {
      it(`flags: ${JSON.stringify(text).slice(0, 70)}`, () => {
        expect(hits(rule.id, text)).toBeGreaterThan(0);
      });
    }
    for (const text of rule.examples.good) {
      it(`ignores: ${JSON.stringify(text).slice(0, 70)}`, () => {
        expect(hits(rule.id, text)).toBe(0);
      });
    }
  });
}
