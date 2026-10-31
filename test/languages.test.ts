import { expect, it } from 'vitest';
import { lint } from '../src/index.js';

it.each([
  ['es', 'EN LA ERA DIGITAL ACTUAL, el trabajo cambia.'],
  ['fr', 'À L’ÈRE NUMÉRIQUE ACTUELLE, le travail change.'],
  ['de', 'IN DER HEUTIGEN SCHNELLLEBIGEN WELT ändert sich die Arbeit.'],
  ['pt', 'NO MUNDO ACELERADO DE HOJE, o trabalho muda.'],
  ['it', 'NEL MONDO FRENETICO DI OGGI cambia il lavoro.'],
  ['nl', 'IN HET HUIDIGE DIGITALE TIJDPERK verandert het werk.'],
  ['ru', 'В СОВРЕМЕННОМ БЫСТРО МЕНЯЮЩЕМСЯ МИРЕ работа меняется.'],
])('checks uppercase %s phrases with original source ranges', (language, text) => {
  const finding = lint(text).findings.find((f) => f.ruleId === `opener/${language}-stock-opening`);
  expect(finding).toBeDefined();
  expect(finding?.offset).toBe(0);
  expect(text.slice(finding!.offset, finding!.offset + finding!.length)).toBe(finding!.match);
});

it('reports Arabic source ranges inside mixed-direction text', () => {
  const text = 'Release 2: في عالم اليوم سريع التغير، نحتاج إلى أدوات.';
  const finding = lint(text).findings.find((f) => f.ruleId === 'opener/ar-stock-opening');
  expect(finding?.match).toBe('في عالم اليوم سريع التغير');
  expect(finding?.offset).toBe(11);
  expect(finding?.column).toBe(12);
});

it.each([
  ['ru', 'предважно отметить, чтоsuffix', 'hedge/ru-worth-noting'],
  ['ar', 'بمن الجدير بالذكر أنكم', 'hedge/ar-worth-noting'],
])('requires Unicode word boundaries for %s', (_language, text, id) => {
  expect(lint(text).findings.some((f) => f.ruleId === id)).toBe(false);
});

it('accepts curly apostrophes in Italian', () => {
  expect(
    lint('Nell’era digitale odierna tutto cambia.').findings.some(
      (f) => f.ruleId === 'opener/it-stock-opening',
    ),
  ).toBe(true);
});

it('checks different languages together', () => {
  const ids = lint(
    'Cabe destacar que es gratis. Il est important de noter que cela fonctionne.',
  ).findings.map((f) => f.ruleId);
  expect(ids).toContain('hedge/es-worth-noting');
  expect(ids).toContain('hedge/fr-worth-noting');
});

it('keeps masking, allow lists and disabling for language rules', () => {
  expect(lint('`cabe destacar que`').findings).toHaveLength(0);
  expect(
    lint('Cabe destacar que funciona.', { rules: { 'hedge/es-worth-noting': 'off' } }).findings,
  ).toHaveLength(0);
  expect(
    lint('Cabe destacar que funciona.', {
      rules: { 'hedge/es-worth-noting': ['warning', { allow: ['cabe destacar que'] }] },
    }).findings,
  ).toHaveLength(0);
});

it('allows whitespace changes but requires whole words', () => {
  expect(
    lint('Cabe\n destacar que funciona.').findings.some(
      (f) => f.ruleId === 'hedge/es-worth-noting',
    ),
  ).toBe(true);
  expect(lint('precabe destacar quesufijo').findings).toHaveLength(0);
});
