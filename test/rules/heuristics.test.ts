import { describe, expect, it } from 'vitest';
import { lint } from '../../src/core/lint.js';
import { rules } from '../../src/core/rules/index.js';

/** Findings for a single rule, with every other rule off. */
function only(ruleId: string, text: string, options?: Record<string, unknown>) {
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) throw new Error(`no rule ${ruleId}`);
  const settings = options
    ? { [ruleId]: [rule.severity, options] as [typeof rule.severity, Record<string, unknown>] }
    : {};
  return lint(text, { rules: settings }, [rule]).findings;
}

describe('structure/one-line-paragraphs', () => {
  const run = (n: number): string =>
    Array.from({ length: n }, (_, i) => `Line number ${i + 1}.`).join('\n\n');

  it('fires once per run at the threshold', () => {
    expect(only('structure/one-line-paragraphs', run(4))).toHaveLength(0);
    const f = only('structure/one-line-paragraphs', run(5));
    expect(f).toHaveLength(1);
    expect(f[0]?.message).toMatch(/^5 one-sentence paragraphs/);
  });

  it('is broken by a multi-sentence paragraph', () => {
    const text = `${run(3)}\n\nTwo sentences here. Really two.\n\n${run(3)}`;
    expect(only('structure/one-line-paragraphs', text)).toHaveLength(0);
  });

  it('ignores lines without terminal punctuation (greetings, signatures)', () => {
    const text = 'Hi Sam,\n\nThanks\n\nBest\n\nAlex\n\nPS\n\nSent from my phone';
    expect(only('structure/one-line-paragraphs', text)).toHaveLength(0);
  });

  it('respects minRun', () => {
    expect(only('structure/one-line-paragraphs', run(3), { minRun: 3 })).toHaveLength(1);
  });
});

describe('structure/question-endings', () => {
  it('needs both a minimum count and a ratio', () => {
    const three = 'Why?\n\nHow?\n\nWhen?';
    expect(only('structure/question-endings', three)).toHaveLength(3);
    const diluted = `${three}\n\n${Array.from({ length: 6 }, () => 'A statement.').join('\n\n')}`;
    expect(only('structure/question-endings', diluted)).toHaveLength(0);
  });

  it('points at the final question only', () => {
    const f = only('structure/question-endings', 'Intro text here. Why?\n\nHow?\n\nWhen?');
    expect(f[0]?.match).toBe('Why?');
  });
});

describe('structure/bold-label-bullets', () => {
  it('accepts both **Label:** and **Label**: forms and emoji prefixes', () => {
    const text = '- **A:** x\n- **B**: y\n- 🚀 **C:** z\n- __D__ — w';
    expect(only('structure/bold-label-bullets', text)).toHaveLength(1);
  });

  it('needs the run to be consecutive', () => {
    const text = '- **A:** x\n- **B:** y\n- plain\n- **C:** z\n- **D:** w';
    expect(only('structure/bold-label-bullets', text)).toHaveLength(0);
  });
});

describe('structure/rule-of-three', () => {
  it('stays quiet for a single factual list in a long text', () => {
    const text = `Runs on Linux, macOS, and Windows. ${'The parser reads one file. '.repeat(20)}`;
    expect(only('structure/rule-of-three', text)).toHaveLength(0);
  });
});

describe('closer/in-conclusion', () => {
  it('flags "Ultimately," only when it opens the last paragraph', () => {
    expect(only('closer/in-conclusion', 'Body.\n\nUltimately, ship it.')).toHaveLength(1);
    expect(only('closer/in-conclusion', 'Ultimately, ship it.\n\nThen rest.')).toHaveLength(0);
    expect(only('closer/in-conclusion', 'Body.\n\nOverall, good.')[0]?.match).toBe('Overall');
  });
});

describe('format/emoji-headings', () => {
  it('needs at least two decorated headings by default', () => {
    expect(only('format/emoji-headings', '# 🦀 crab\n\n## Usage')).toHaveLength(0);
    expect(only('format/emoji-headings', '# 🦀 crab\n\n## 📦 Usage')).toHaveLength(2);
  });

  it('handles ZWJ sequences and variation selectors as one emoji', () => {
    const f = only('format/emoji-headings', '## 👩‍💻 Dev\n\n## ❤️ Love');
    expect(f.map((x) => x.match)).toEqual(['👩‍💻', '❤️']);
  });
});

describe('format/excessive-bold', () => {
  it('does not count list labels', () => {
    const text = '- **A:** x\n- **B:** y\n- **C:** z\n- **D:** w\n- **E:** v';
    expect(only('format/excessive-bold', text)).toHaveLength(0);
  });

  it('respects the density threshold in long texts', () => {
    const text = `**a** **b** **c** **d** ${'word '.repeat(400)}`;
    expect(only('format/excessive-bold', text)).toHaveLength(0);
  });
});

describe('format/exclamation-overuse', () => {
  it('counts a run of !!! once', () => {
    expect(only('format/exclamation-overuse', 'Wow!!! Nice!')).toHaveLength(0);
  });
});

describe('format/em-dash-density', () => {
  it('counts spaced double hyphens and en dashes, not ranges', () => {
    expect(only('format/em-dash-density', 'a -- b – c — d')).toHaveLength(3);
    expect(only('format/em-dash-density', '10–20, 30–40, 50–60')).toHaveLength(0);
  });

  it('stays quiet when dashes are sparse', () => {
    const text = `One — two. ${'Plain words in a sentence. '.repeat(60)} Three — four. Five — six.`;
    expect(only('format/em-dash-density', text)).toHaveLength(0);
  });
});

describe('format/hashtag-stuffing', () => {
  it('is per block', () => {
    expect(only('format/hashtag-stuffing', '#a #b\n\n#c #d')).toHaveLength(0);
    expect(only('format/hashtag-stuffing', '#a #b #c #d')).toHaveLength(4);
  });

  it('does not treat headings as hashtags', () => {
    expect(only('format/hashtag-stuffing', '# One\n## Two\n### Three\n#### Four')).toHaveLength(0);
  });
});

describe('vocab/leverage-utilize', () => {
  it('flags only the verb in "leverage the …"', () => {
    const f = only('vocab/leverage-utilize', 'Leverage the cache.');
    expect(f[0]?.match).toBe('Leverage');
    expect(f[0]?.replacement).toBe('use');
  });
});

describe('opener/chatbot-preamble', () => {
  it('is an error by default', () => {
    expect(only('opener/chatbot-preamble', "Sure! Here's the summary.")[0]?.severity).toBe('error');
  });
});
