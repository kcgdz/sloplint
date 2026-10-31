import { countWords, sentencesOf } from '../doc.js';
import {
  compile,
  customRule,
  densityRule,
  findAll,
  phraseRule,
  SENTENCE_START,
} from './helpers.js';
import type { Block, RawFinding, Rule } from '../types.js';

/** Splits blocks into runs of directly adjacent blocks of the same type. */
function runsOf(blocks: Block[], predicate: (b: Block) => boolean): Block[][] {
  const runs: Block[][] = [];
  let run: Block[] = [];
  for (const b of blocks) {
    if (predicate(b)) run.push(b);
    else {
      if (run.length) runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

const notJustRegexes = compile([
  /\b(?:it['’]?s|it\s+is|this\s+is|that['’]?s|that\s+is|[\p{L}]+\s+(?:is|are))\s+not\s+(?:just|only|merely|simply)\s+[^.!?\n]{1,80}?[,;:—–]\s*(?:it['’]?s|it\s+is|this\s+is|that['’]?s|they['’]?re|they\s+are|but|we['’]re)\b/iu,
  /\b(?:isn['’]t|aren['’]t|wasn['’]t|weren['’]t)\s+(?:just|only|merely|simply)\s+[^.!?\n]{1,80}?[,;:—–]\s*(?:it['’]?s|it\s+is|this\s+is|that['’]?s|they['’]?re|they\s+are|but|we['’]re)\b/iu,
  /\b(?:it['’]s\s+not|it\s+is\s+not|it\s+isn['’]t|this\s+isn['’]t|this\s+is\s+not)\s+(?:just\s+)?about\s+[^.!?\n]{1,80}[.!]\s+(?:it['’]s|it\s+is|this\s+is)\s+about\b/iu,
  /\bmore\s+than\s+just\s+an?\b/iu,
  // "Rejection isn't failure — it's feedback." Without "just", only the dash form is a strong signal.
  /\b(?:isn['’]t|aren['’]t|is\s+not|are\s+not)\s+[^.!?\n,;:]{1,40}?\s*[—–]\s*(?:it['’]s|it\s+is|they['’]re|they\s+are)\b/iu,
  // "Don't just work harder — work smarter."
  /\bdon['’]t\s+just\s+[^.!?\n;]{1,60}?\s*[—–]\s*[\p{L}]/iu,
]);

export const structure: Rule[] = [
  customRule({
    id: 'structure/not-just-x',
    category: 'structure',
    severity: 'warning',
    title: '"It\'s not just X, it\'s Y"',
    why: 'A manufactured contrast. It denies a claim nobody made in order to restate the same claim louder.',
    suggestion: 'State Y directly. If X matters, give it its own sentence.',
    examples: {
      bad: [
        "It's not just a linter, it's a writing coach.",
        "This isn't just a tool — it's a movement.",
        "It's not about speed. It's about trust.",
        'Sloplint is more than just a linter.',
        "Rejection isn't failure — it's feedback.",
        "Don't just work harder — work smarter.",
      ],
      good: [
        "It's not just slow; the query also locks the table.",
        "The flag isn't required — the default is fine.",
        "Don't just copy the key; rotate it.",
        'This is not only a bug fix but also a refactor.',
        "The cache isn't just for reads; writes go through it too.",
      ],
    },
    check: (doc) => findAll(doc.text, notJustRegexes),
  }),

  densityRule({
    id: 'structure/rule-of-three',
    category: 'structure',
    severity: 'info',
    title: 'Everything in threes',
    why: 'Triplets ("fast, simple, and powerful") on repeat give text a sing-song cadence that readers associate with generated copy.',
    suggestion: 'Keep the one or two items that matter. Vary list length.',
    patterns: [
      /(?<![\p{L}\p{N}])[\p{L}][\p{L}'’-]*(?:[ \t]+[\p{L}][\p{L}'’-]*){0,2},[ \t]+[\p{L}][\p{L}'’-]*(?:[ \t]+[\p{L}][\p{L}'’-]*){0,2},?[ \t]+(?:and|or)[ \t]+[\p{L}][\p{L}'’-]*/iu,
    ],
    defaultOptions: { minCount: 3, per100Words: 1.5 },
    skipBlockTypes: ['table'],
    examples: {
      bad: [
        'Fast, simple, and powerful. Clean, modern, and elegant. Learn, build, and grow.',
        'Write, test, and ship. Plan, track, and measure. Secure, private, and free.',
        'We value speed, quality, and trust. Our tools are fast, safe, and fun. Join, share, and grow.',
      ],
      good: [
        'It runs on Linux, macOS, and Windows.',
        'Install it, then run it.',
        'Fast and simple.',
        '| a | tweet, thread, or post |\n| b | readme, docs, or wiki |\n| c | email, memo, or note |',
      ],
    },
  }),

  customRule({
    id: 'structure/colon-reveal',
    category: 'structure',
    severity: 'warning',
    title: '"The result? …"',
    why: 'A fake suspense beat: a one-word question answered immediately. Common in generated social posts.',
    suggestion: 'Merge it into one sentence: "Builds got 40% faster."',
    examples: {
      bad: [
        'The result? Builds are 40% faster.',
        "The best part? It's free.",
        'The secret? Caching everything.',
      ],
      good: [
        "What was the result? We don't know yet.",
        'The result is a 40% faster build.',
        '## The result?',
      ],
    },
    check(doc) {
      const re = compile([
        new RegExp(
          String.raw`${SENTENCE_START}the\s+(?:(?:best|worst|crazy|wild)\s+part|result|kicker|secret|catch|answer|truth|twist|bottom\s+line|outcome|payoff|magic|punchline|verdict|difference|real\s+question)\?(?=\s+\S)`,
          'imu',
        ),
      ]);
      const headings = doc.blocks.filter((b) => b.type === 'heading');
      return findAll(doc.text, re).filter(
        (f) => !headings.some((h) => f.start >= h.start && f.start < h.end),
      );
    },
  }),

  phraseRule({
    id: 'structure/heres-why',
    category: 'structure',
    severity: 'warning',
    title: '"Here\'s why:"',
    why: 'A drumroll line that delays the content it announces.',
    suggestion: 'Delete it and start with the reason.',
    patterns: [
      /(?<![\p{L}])here(?:['’]s|\s+is)\s+(?:why|how|the\s+thing|the\s+kicker|the\s+deal|the\s+catch|the\s+truth|the\s+secret|where\s+it\s+gets\s+(?:interesting|good|wild|tricky)|what\s+you\s+need\s+to\s+know|the\s+breakdown|what\s+I(?:['’]ve)?\s+learned|the\s+playbook)(?=[ \t]*(?:[:.!—–]|$))/imu,
    ],
    examples: {
      bad: [
        "Here's why:",
        "Here's the thing: nobody reads docs.",
        "Here's what you need to know.",
        "Here's where it gets interesting.",
        "Here's what I learned:",
      ],
      good: [
        "Here's why the build failed: the cache key changed.",
        "Here's how to install it on Windows.",
        'Here is the config file.',
      ],
    },
  }),

  phraseRule({
    id: 'structure/whether-youre',
    category: 'structure',
    severity: 'warning',
    title: '"Whether you\'re a beginner or an expert"',
    why: 'Addresses every possible reader at once, which means it speaks to none of them.',
    suggestion: 'Name the reader you wrote this for, or drop the sentence.',
    patterns: [
      /\bwhether\s+you['’]re\s+an?\s+[^,.!?\n]{1,40}?\s+or\s+(?:an?\s+|just\s+)/iu,
      /\bwhether\s+you\s+are\s+an?\s+[^,.!?\n]{1,40}?\s+or\s+(?:an?\s+|just\s+)/iu,
    ],
    examples: {
      bad: [
        "Whether you're a seasoned developer or just starting out, this guide is for you.",
        "Whether you're a solo founder or an enterprise team, we've got you covered.",
        'Whether you are a student or a professional, sloplint helps.',
      ],
      good: [
        "Whether you're on macOS or Linux, run the same command.",
        'Check whether you are a member of the admin group.',
        "Whether it's cached or not depends on the header.",
      ],
    },
  }),

  customRule({
    id: 'structure/one-line-paragraphs',
    category: 'structure',
    severity: 'warning',
    title: 'Run of one-sentence paragraphs',
    why: 'Many consecutive one-sentence paragraphs ("broetry") is a LinkedIn growth-hack format that reads as filler.',
    suggestion: 'Group related sentences into paragraphs.',
    defaultOptions: { minRun: 5, maxWords: 25 },
    examples: {
      bad: [
        'I got fired.\n\nIt hurt.\n\nThen I learned something.\n\nRejection is data.\n\nNow I run a company.',
        'We shipped.\n\nUsers came.\n\nThe servers melted.\n\nWe fixed it.\n\nNow we scale.\n\nLesson learned.',
      ],
      good: [
        'We shipped.\n\nUsers came.\n\nThe servers melted.',
        'We shipped v2 on Monday. Signups doubled by Wednesday.\n\nThe database fell over twice. We added a read replica and a queue.',
        '- one.\n- two.\n- three.\n- four.\n- five.',
      ],
    },
    check(doc, options) {
      const minRun = Number(options.minRun);
      const maxWords = Number(options.maxWords);
      const isShort = (b: Block): boolean =>
        b.type === 'paragraph' &&
        /[.!?…]["'”’)]*\s*$/u.test(b.text) &&
        sentencesOf(b).length === 1 &&
        countWords(b.text) <= maxWords;
      return runsOf(doc.blocks, isShort)
        .filter((run) => run.length >= minRun)
        .map((run): RawFinding => {
          const first = run[0]!;
          return {
            start: first.start,
            end: first.end,
            message: `${run.length} one-sentence paragraphs in a row. Many consecutive one-sentence paragraphs read as filler.`,
          };
        });
    },
  }),

  customRule({
    id: 'structure/question-endings',
    category: 'structure',
    severity: 'warning',
    title: 'Paragraphs ending in questions',
    why: 'When most paragraphs end on a question, the text keeps asking instead of saying.',
    suggestion: 'Answer the question in the text, or cut it.',
    defaultOptions: { minCount: 3, ratio: 0.4 },
    examples: {
      bad: [
        'Builds are slow. Why does that happen?\n\nCaches miss a lot. What can we do?\n\nWe could add a CDN. But is it worth it?',
        'Ever shipped on a Friday?\n\nWho has time for tests?\n\nIs speed the only thing that matters?',
      ],
      good: [
        '## Why is it slow?\n\nThe cache misses.\n\n## How do I fix it?\n\nWarm the cache.\n\n## Does it work offline?\n\nYes.',
        'Is it fast? Yes.\n\nIt runs in 2ms per file.\n\nIt works offline.',
        'Should you upgrade? Only if you use plugins.\n\nWhat breaks? The config format.\n\nMigration takes about ten minutes with the codemod.',
      ],
    },
    check(doc, options) {
      const paragraphs = doc.blocks.filter((b) => b.type === 'paragraph');
      const enders = paragraphs.filter((b) => /\?["'”’)*_]*\s*$/u.test(b.text));
      if (enders.length < Number(options.minCount)) return [];
      if (enders.length / paragraphs.length < Number(options.ratio)) return [];
      return enders.map((b) => {
        const last = sentencesOf(b).at(-1);
        return {
          start: last?.start ?? b.start,
          end: last?.end ?? b.end,
          message: `${enders.length} of ${paragraphs.length} paragraphs end with a question.`,
        };
      });
    },
  }),

  customRule({
    id: 'structure/bold-label-bullets',
    category: 'structure',
    severity: 'info',
    title: '"**Label:** description" bullets',
    why: 'Long lists where every item opens with a bolded label and colon are a signature of generated READMEs.',
    suggestion: 'Use plain bullets, a table, or prose. Bold only the item a reader must not miss.',
    defaultOptions: { minRun: 4 },
    examples: {
      bad: [
        '- **Fast:** builds in 2s\n- **Simple:** one command\n- **Safe:** no network\n- **Free:** MIT licensed',
        '1. **Install:** run npm i\n2. **Configure:** add a file\n3. **Run:** call the CLI\n4. **Ship:** push it',
      ],
      good: [
        '- **Fast:** builds in 2s\n- **Simple:** one command\n- **Safe:** no network',
        '- builds in 2s\n- one command\n- no network\n- MIT licensed',
        '- **Note** the flag\n- **Read** the docs\n- run it\n- ship it',
      ],
    },
    check(doc, options) {
      const label =
        /^\s*(?:[-*+•]|\d{1,9}[.)])\s+(?:\p{Extended_Pictographic}️?\s*)?(?:(?:\*\*|__)[^*_\n]{1,60}(?:\*\*|__)\s*[:—–-]|(?:\*\*|__)[^*_\n]{1,60}:(?:\*\*|__))/u;
      return runsOf(doc.blocks, (b) => b.type === 'list-item' && label.test(b.text))
        .filter((run) => run.length >= Number(options.minRun))
        .map((run) => {
          const first = run[0]!;
          const lineEnd = doc.text.indexOf('\n', first.start);
          return {
            start: first.start,
            end: lineEnd === -1 ? first.end : Math.min(lineEnd, first.end),
            message: `${run.length} bullets in a row open with a bold label and colon.`,
          };
        });
    },
  }),
];
