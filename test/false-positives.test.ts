import { describe, expect, it } from 'vitest';
import { lint } from '../src/core/lint.js';

/**
 * Regression suite for text that must stay clean. Every case here contains a
 * slop phrase in a place sloplint must not look (code, quotes, URLs, markup),
 * or ordinary technical English that resembles a pattern.
 */
const clean = (text: string): string[] => lint(text).findings.map((f) => `${f.ruleId}: ${f.match}`);

describe('masked regions', () => {
  it.each([
    [
      'fenced code',
      'Install it:\n\n```bash\necho "In today\'s fast-paced world, let\'s delve in"\n```\n',
    ],
    ['inline code', 'Call `unlockPotential()` and `delve()` from the hook.'],
    ['indented code', 'Example:\n\n    const seamless = robust && delve;\n'],
    [
      'blockquote',
      "> In today's fast-paced world, it's not just a tool, it's a movement.\n\nThat quote is from a 2023 ad.",
    ],
    ['URL', 'Docs live at https://example.com/delve-into-seamless-unlock-potential.'],
    ['link target', 'Read [the guide](https://example.com/the-future-is-bright) first.'],
    ['HTML comment', 'Done. <!-- TODO: hope this helps, delve, seamless -->'],
    ['HTML attribute', '<img src="logo.png" alt="seamless robust delve">'],
    [
      'frontmatter',
      '---\ndescription: A seamless, robust way to delve\n---\n\nThe parser reads files.',
    ],
    ['email address', 'Write to synergy@delve.io with the log.'],
  ])('%s', (_name, text) => {
    expect(clean(text)).toEqual([]);
  });
});

describe('ordinary technical English', () => {
  it.each([
    'Run the installer with elevated privileges.',
    'Unlock the account after three failed attempts.',
    'We fit a robust regression with robust standard errors.',
    'The test harness boots a fake server.',
    'CPU utilization dropped to 30%.',
    "The fund's leverage ratio is 2.1.",
    'Recurse into the next level of the tree.',
    'The customer journey map is in Figma.',
    'Fixed in #123, see also #456 and #789.',
    'The Kerberos realm is EXAMPLE.COM.',
    'Pages 10–20 cover setup; flags go after `--`.',
    'It runs on Linux, macOS, and Windows.',
    'This is not only faster but also smaller.',
    'Copyright © 2026. All rights reserved™.',
    'Use the `!` operator to negate. Image: ![diagram](d.png)',
    '- [x] Your account is set up',
    'Is it slow? Only on the first run.',
  ])('%s', (text) => {
    expect(clean(text)).toEqual([]);
  });
});

describe('real-world clean READMEs', () => {
  it('keeps a plain README at zero findings', () => {
    const readme = `# tidyjson

Format JSON files in place. Keeps key order, fixes trailing commas, and exits non-zero on invalid input.

## Install

\`\`\`bash
npm i -g tidyjson
\`\`\`

## Usage

\`\`\`bash
tidyjson config/*.json
\`\`\`

Options:

- \`--check\`: report files that would change, without writing
- \`--indent <n>\`: spaces per level (default 2)

## Why

Most formatters reorder keys, which makes diffs noisy. tidyjson only touches whitespace and commas.

## License

MIT
`;
    const r = lint(readme);
    expect(r.findings).toEqual([]);
    expect(r.score).toBe(0);
  });
});
