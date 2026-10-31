import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lint } from '../src/core/lint.js';

/**
 * The examples double as calibration data for the score curve: generated
 * "before" texts must land in the Pure slop band, and their rewrites must stay
 * in the Human band with nothing above info level.
 */
const root = join(import.meta.dirname, '..', 'examples');
const names = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe('examples', () => {
  it('has the five showcase examples', () => {
    expect(names.sort()).toEqual([
      'cold-email',
      'landing-page',
      'linkedin-post',
      'readme',
      'tweet-thread',
    ]);
  });

  for (const name of names) {
    describe(name, () => {
      const before = lint(readFileSync(join(root, name, 'before.md'), 'utf8'));
      const after = lint(readFileSync(join(root, name, 'after.md'), 'utf8'));

      it('before scores 70 or more', () => {
        expect(before.score).toBeGreaterThanOrEqual(70);
      });

      it('after scores under 15', () => {
        expect(after.score).toBeLessThan(15);
      });

      it('after has no warnings or errors', () => {
        expect(
          after.findings
            .filter((f) => f.severity !== 'info')
            .map((f) => `${f.line}:${f.ruleId} ${f.match}`),
        ).toEqual([]);
      });
    });
  }
});
