import { expect, it } from 'vitest';
import { lint } from '../src/index.js';

it('handles Turkish uppercase without changing source positions', () => {
  const text = 'Özet: İŞTE SİZİN İÇİN HAZIRLADIĞIM metin.';
  const finding = lint(text).findings.find((f) => f.ruleId === 'filler/tr-assistant-preamble');
  expect(finding?.offset).toBe(6);
  expect(finding?.match).toBe('İŞTE SİZİN İÇİN HAZIRLADIĞIM');
});

it('checks mixed languages', () => {
  const ids = lint(
    "Günümüzün dijital çağında işler değişir. In today's fast-paced world, tools matter.",
  ).findings.map((f) => f.ruleId);
  expect(ids).toContain('opener/tr-stock-opening');
  expect(ids).toContain('opener/fast-paced-world');
});

it('preserves code masking and rule disabling', () => {
  expect(lint('`belirtmekte fayda var`').findings).toHaveLength(0);
  expect(
    lint('Belirtmekte fayda var.', { rules: { 'hedge/tr-worth-noting': 'off' } }).findings,
  ).toHaveLength(0);
});

it('does not flag a phrase embedded in a longer word', () => {
  expect(lint('Önbelirtmekte fayda varlık.').findings).toHaveLength(0);
});
