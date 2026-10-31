import { describe, expect, it } from 'vitest';
import { badgeMarkdown, computeScore, labelOf, MIN_WORDS, pointsOf } from '../../src/core/score.js';

describe('computeScore', () => {
  it('is 0 without findings', () => {
    expect(computeScore(0, 500)).toBe(0);
  });

  it('stays within 0..100', () => {
    for (const p of [1, 5, 50, 500, 50000]) {
      const s = computeScore(p, 10);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it('is monotonic in points and inverse in length', () => {
    expect(computeScore(10, 300)).toBeGreaterThan(computeScore(5, 300));
    expect(computeScore(10, 300)).toBeGreaterThan(computeScore(10, 900));
  });

  it('treats very short texts as MIN_WORDS long', () => {
    expect(computeScore(3, 5)).toBe(computeScore(3, MIN_WORDS));
  });

  it('keeps one warning in a 300-word text in the Human band', () => {
    expect(labelOf(computeScore(3, 300))).toBe('Human');
  });
});

describe('pointsOf', () => {
  it('weights severities', () => {
    expect(pointsOf([{ severity: 'error' }, { severity: 'warning' }, { severity: 'info' }])).toBe(
      9,
    );
  });
});

describe('labelOf', () => {
  it('maps bands', () => {
    expect(labelOf(0)).toBe('Human');
    expect(labelOf(14)).toBe('Human');
    expect(labelOf(15)).toBe('Light seasoning');
    expect(labelOf(40)).toBe('Sloppy');
    expect(labelOf(70)).toBe('Pure slop');
    expect(labelOf(100)).toBe('Pure slop');
  });
});

describe('badgeMarkdown', () => {
  it('produces a shields.io badge with the score and color', () => {
    expect(badgeMarkdown(87)).toBe(
      '![slop score](https://img.shields.io/badge/slop%20score-87%2F100%20Pure%20slop-red)',
    );
    expect(badgeMarkdown(3)).toContain('brightgreen');
  });
});
