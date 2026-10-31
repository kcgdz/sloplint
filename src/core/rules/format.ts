import { customRule, densityRule, EMOJI } from './helpers.js';
import type { RawFinding, Rule } from '../types.js';

/** Emoji, minus symbols that are pictographic in Unicode but not emoji in practice. */
const EMOJI_G = new RegExp(EMOJI.source, 'gu');
const NOT_EMOJI = /^[©®™←-⇿↔-↙]$/u;

function emojiIn(text: string, base: number): RawFinding[] {
  const out: RawFinding[] = [];
  for (const m of text.matchAll(EMOJI_G)) {
    if (NOT_EMOJI.test(m[0])) continue;
    out.push({ start: base + m.index, end: base + m.index + m[0].length });
  }
  return out;
}

export const format: Rule[] = [
  densityRule({
    id: 'format/em-dash-density',
    category: 'format',
    severity: 'info',
    title: 'Em-dash overuse',
    why: 'Em-dashes are fine. Many of them in a short text is one of the most recognised marks of model output.',
    suggestion: 'Use a period, comma, colon or parentheses for most of them.',
    patterns: [/—|(?<=\s)--(?=\s)|(?<=\s)–(?=\s)/u],
    defaultOptions: { minCount: 3, per100Words: 1 },
    examples: {
      bad: [
        'Fast — really fast — and simple — very simple.',
        'It works -- mostly -- unless -- of course -- it does not.',
        'We shipped — finally. Users noticed — immediately. Support tickets — gone.',
      ],
      good: [
        "It's fast — about 2ms per file.",
        'Pages 10–20 cover setup.',
        'Run `a -- b -- c -- d` to pass args.',
      ],
    },
  }),

  customRule({
    id: 'format/emoji-headings',
    category: 'format',
    severity: 'warning',
    title: 'Emoji in headings',
    why: 'A rocket or sparkle on every heading is the default look of generated READMEs and adds no information.',
    suggestion: 'Remove the emoji. Headings work as navigation; keep them plain.',
    defaultOptions: { minCount: 2 },
    examples: {
      bad: [
        '## 🚀 Features\n\n## 📦 Installation',
        '# Title ✨\n\n## Usage 🔥',
        '## ✅ Pros\n\n## ❌ Cons\n\n## 💡 Tips',
      ],
      good: [
        '## Features\n\n## Installation',
        '# 🦀 crabby\n\n## Install',
        '## Use `:rocket:` in commit messages\n\n## Use `:bug:` for fixes',
        '## Copyright © 2026\n\n## Trademarks™',
      ],
    },
    check(doc, options) {
      const hits = doc.blocks
        .filter((b) => b.type === 'heading')
        .map((h) => emojiIn(h.text, h.start))
        .filter((list) => list.length > 0);
      return hits.length >= Number(options.minCount) ? hits.flat() : [];
    },
  }),

  customRule({
    id: 'format/emoji-bullets',
    category: 'format',
    severity: 'warning',
    title: 'Emoji as bullet points',
    why: 'Lines that start with ✅ 🚀 👉 imitate a marketing template and make lists harder to scan.',
    suggestion: 'Use normal list markers. Keep at most one emoji where it carries meaning.',
    defaultOptions: { minCount: 3 },
    examples: {
      bad: [
        '✅ Fast\n✅ Simple\n✅ Free',
        '- 🚀 Deploy\n- 🔒 Secure\n- 📈 Scale',
        '👉 Step one\n\n👉 Step two\n\n👉 Step three',
      ],
      good: ['✅ Done', '- Deploy\n- Secure\n- Scale', '🚀 Launch day.\n\n🎉 Thanks all.'],
    },
    check(doc, options) {
      const lineStart = new RegExp(
        String.raw`^[ \t]*(?:(?:[-*+•]|\d{1,9}[.)])[ \t]+)?(?<e>${EMOJI.source})`,
        'gmu',
      );
      const hits: RawFinding[] = [];
      for (const m of doc.text.matchAll(lineStart)) {
        const e = m.groups?.e ?? '';
        if (!e || NOT_EMOJI.test(e)) continue;
        const start = m.index + m[0].length - e.length;
        hits.push({ start, end: start + e.length });
      }
      return hits.length >= Number(options.minCount) ? hits : [];
    },
  }),

  customRule({
    id: 'format/excessive-bold',
    category: 'format',
    severity: 'warning',
    title: 'Too much bold',
    why: 'When many phrases are bold, none of them stand out. Scattered bold is a common habit of chat models.',
    suggestion: 'Bold at most one phrase per section, the one a skimming reader must not miss.',
    defaultOptions: { minCount: 4, per100Words: 2 },
    examples: {
      bad: [
        'This tool is **fast**, **simple** and **secure**. It is **free** and works **offline**.',
        '**Important:** run the **migration** before you **deploy**, otherwise the **cache** breaks.',
      ],
      good: [
        'Run the migration **before** you deploy.',
        '- **Fast:** 2s builds\n- **Small:** 4 kB\n- **Safe:** no network\n- **Free:** MIT',
        '**Note:** this needs Node 20.',
      ],
    },
    check(doc, options) {
      const spans: RawFinding[] = [];
      const listLabel =
        /^[ \t]*(?:[-*+•]|\d{1,9}[.)])[ \t]+(?:\p{Extended_Pictographic}️?[ \t]*)?$/u;
      for (const m of doc.text.matchAll(/(\*\*|__)(?=\S)([^\n]*?\S)\1/g)) {
        const lineStart = doc.text.lastIndexOf('\n', m.index) + 1;
        if (listLabel.test(doc.text.slice(lineStart, m.index))) continue;
        spans.push({ start: m.index, end: m.index + m[0].length });
      }
      const density = (spans.length / Math.max(doc.words, 1)) * 100;
      if (spans.length < Number(options.minCount) || density < Number(options.per100Words))
        return [];
      return spans;
    },
  }),

  customRule({
    id: 'format/exclamation-overuse',
    category: 'format',
    severity: 'warning',
    title: 'Exclamation marks',
    why: 'Exclamation marks used as default punctuation read as forced enthusiasm.',
    suggestion: 'Use periods. Keep an exclamation mark for the one line that earns it.',
    defaultOptions: { minCount: 3, per100Words: 1.5 },
    examples: {
      bad: ["We're live! Try it now! You'll love it!", 'Huge news!!! v2 is out! Go!'],
      good: ['Done!', 'Run `if (a != b) {}` first.', 'Thanks! See you Friday.'],
    },
    check(doc, options) {
      const hits: RawFinding[] = [];
      for (const m of doc.text.matchAll(/!+(?!=)/g))
        hits.push({ start: m.index, end: m.index + m[0].length });
      const density = (hits.length / Math.max(doc.words, 1)) * 100;
      if (hits.length < Number(options.minCount) || density < Number(options.per100Words))
        return [];
      return hits;
    },
  }),

  customRule({
    id: 'format/hashtag-stuffing',
    category: 'format',
    severity: 'warning',
    title: 'Hashtag stuffing',
    why: 'A wall of hashtags at the end of a post is engagement bait and makes the text look automated.',
    suggestion: 'Keep one or two specific tags, or none.',
    defaultOptions: { maxPerBlock: 3 },
    examples: {
      bad: [
        'Shipped v2 today. #AI #DevTools #OpenSource #BuildInPublic',
        'New post!\n\n#tech #startup #founder #growth #productivity',
      ],
      good: [
        'Fixed in #123 and #456.',
        'Follow #rustlang for updates.',
        'Use #fff and #a0a0a0 for the background.',
      ],
    },
    check(doc, options) {
      const max = Number(options.maxPerBlock);
      const out: RawFinding[] = [];
      for (const b of doc.blocks) {
        const tags: RawFinding[] = [];
        for (const m of b.text.matchAll(/(?<![\p{L}\p{N}_&#/])#[\p{L}][\p{L}\p{N}_]*/gu)) {
          if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(m[0])) continue;
          tags.push({ start: b.start + m.index, end: b.start + m.index + m[0].length });
        }
        if (tags.length > max) out.push(...tags);
      }
      return out;
    },
  }),
];
