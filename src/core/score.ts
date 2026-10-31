import type { Finding, ScoreLabel, Severity } from './types.js';

/** Points each finding adds before normalisation. */
export const SEVERITY_WEIGHT: Record<Severity, number> = { error: 5, warning: 3, info: 1 };

/**
 * Texts shorter than this are scored as if they had this many words, so a
 * single phrase in a one-line commit message doesn't max out the score.
 */
export const MIN_WORDS = 50;

/** Curve steepness. Calibrated against `examples/` (see test/examples.test.ts). */
export const SCORE_K = 10;

export function pointsOf(findings: Pick<Finding, 'severity'>[]): number {
  return findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
}

/**
 * Score = 100 × (1 − e^(−density / K)), where density is weighted points per 100 words.
 * Monotonic, length-normalised, and capped below 100 for any finite input.
 */
export function computeScore(points: number, words: number): number {
  if (points <= 0) return 0;
  const density = (points / Math.max(words, MIN_WORDS)) * 100;
  return Math.min(100, Math.round(100 * (1 - Math.exp(-density / SCORE_K))));
}

export function labelOf(score: number): ScoreLabel {
  if (score < 15) return 'Human';
  if (score < 40) return 'Light seasoning';
  if (score < 70) return 'Sloppy';
  return 'Pure slop';
}

export const LABEL_COLORS: Record<ScoreLabel, string> = {
  Human: 'brightgreen',
  'Light seasoning': 'yellowgreen',
  Sloppy: 'orange',
  'Pure slop': 'red',
};

export function badgeMarkdown(score: number): string {
  const label = labelOf(score);
  const msg = encodeURIComponent(`${score}/100 ${label}`).replace(/-/g, '--');
  return `![slop score](https://img.shields.io/badge/slop%20score-${msg}-${LABEL_COLORS[label]})`;
}
