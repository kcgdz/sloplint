import { phraseRule, SENTENCE_START } from './helpers.js';
import type { Rule } from '../types.js';

const inConclusion = phraseRule({
  id: 'closer/in-conclusion',
  category: 'closer',
  severity: 'warning',
  title: '"In conclusion"',
  why: 'An essay-template closer that announces a summary of what the reader just read.',
  suggestion: 'End on the last useful sentence, or a concrete next step.',
  patterns: [
    'in conclusion',
    'in summary',
    'to sum up',
    'to summarize',
    'to summarise',
    'in closing',
    'all in all',
    'at the end of the day',
    'all things considered',
  ],
  examples: {
    bad: [
      'In conclusion, sloplint helps.',
      'To sum up, the release is great.',
      "We fixed the cache.\n\nUltimately, it's about trust.",
    ],
    good: [
      'We reached a conclusion after testing.',
      'Ultimately, the cache was at fault.\n\nThe fix landed in #42.',
      'The summary table is below.',
    ],
  },
});

const lastParagraphOpener = /^(?:Ultimately|Overall|In the end),/u;

export const closer: Rule[] = [
  {
    ...inConclusion,
    check(doc, options) {
      const hits = inConclusion.check(doc, options);
      const last = doc.blocks.filter((b) => b.type === 'paragraph').at(-1);
      const m = last && lastParagraphOpener.exec(last.text);
      if (last && m) hits.push({ start: last.start, end: last.start + m[0].length - 1 });
      return hits.sort((a, b) => a.start - b.start);
    },
  },

  phraseRule({
    id: 'closer/engagement-bait',
    category: 'closer',
    severity: 'warning',
    title: '"What do you think? Let me know in the comments"',
    why: 'A generic call for engagement. It asks the reader to do the work of making the post matter.',
    suggestion: 'Ask a specific question only you could ask, or end without one.',
    patterns: [
      'let me know in the comments',
      /\bdrop\s+(?:a|your)\s+(?:comment|thoughts|take|🔥|👇)/iu,
      /\bshare\s+your\s+thoughts\s+(?:below|in\s+the\s+comments)\b/iu,
      'what do you think?',
      'agree or disagree?',
      'what would you add?',
      new RegExp(
        String.raw`${SENTENCE_START}(?:thoughts|agree|am I wrong|who['’]s with me)\?`,
        'imu',
      ),
      /(?:♻️\s*)?\brepost\s+(?:if|this|to)\b/iu,
      /\bfollow\s+(?:me\s+)?for\s+more\b/iu,
      'smash that like',
      'like and subscribe',
      'tag someone who',
      'comment below',
      'let that sink in',
      /\bif\s+you\s+found\s+this\s+(?:thread|post|article)\s+(?:helpful|useful|valuable)\b/iu,
      /\blike\s+and\s+(?:retweet|repost|share)\b/iu,
      /\bretweet\s+the\s+first\s+tweet\b/iu,
    ],
    examples: {
      bad: [
        'What do you think? Let me know in the comments.',
        'Thoughts?',
        'Agree? ♻️ Repost to help others.',
        'Follow me for more tips like this.',
      ],
      good: [
        'We asked users what they think of the new layout.',
        'The thoughts above are mine.',
        "Agreed, let's ship it.",
      ],
    },
  }),

  phraseRule({
    id: 'closer/hope-this-helps',
    category: 'closer',
    severity: 'warning',
    title: '"Hope this helps! Feel free to reach out"',
    why: 'Customer-service sign-offs that pad the end of a document or message.',
    suggestion: 'Delete it. If there is a real support channel, link it once.',
    patterns: [
      /\b(?:I\s+)?hope\s+(?:this|that)\s+helps\b/iu,
      /\bfeel\s+free\s+to\s+(?:reach\s+out|contact|ask|get\s+in\s+touch)\b/iu,
      /\b(?:don['’]t|do\s+not)\s+hesitate\s+to\b/iu,
      /\bhappy\s+(?:coding|hacking|building|writing)\s*[!.]/iu,
      /\blet\s+me\s+know\s+if\s+you\s+have\s+any\s+(?:other\s+|further\s+|more\s+)?questions\b/iu,
      /\bI\s+hope\s+you\s+(?:found\s+this|find\s+this)\s+(?:helpful|useful|informative)\b/iu,
      /\bhope\s+you\s+enjoyed\b/iu,
    ],
    examples: {
      bad: [
        'Hope this helps!',
        'Feel free to reach out with questions.',
        'Happy coding!',
        "Don't hesitate to contact me.",
      ],
      good: [
        'This helps when the cache is cold.',
        'Reach out to the on-call engineer if the job fails.',
        'Questions go in GitHub Discussions.',
      ],
    },
  }),

  phraseRule({
    id: 'closer/future-is-bright',
    category: 'closer',
    severity: 'warning',
    title: '"The future is bright"',
    why: 'A vague upbeat ending with no content. It could close any text ever written.',
    suggestion: 'End with what ships next, with a date if you have one.',
    patterns: [
      /\bthe\s+future\s+(?:is|looks)\s+(?:bright|exciting|promising)\b/iu,
      /\bthe\s+possibilities\s+are\s+(?:endless|limitless|infinite)\b/iu,
      /\bthe\s+sky['’]?s?\s+(?:is\s+)?the\s+limit\b/iu,
      /\b(?:this|it|that)\s+is\s+(?:just|only)\s+the\s+(?:beginning|start)\b/iu,
      /\bthe\s+best\s+is\s+yet\s+to\s+come\b/iu,
      /\bexciting\s+times\s+ahead\b/iu,
      /\bwe['’]re\s+just\s+getting\s+started\b/iu,
      /\bthe\s+future\s+of\s+[\p{L}\p{N} -]{1,30}\s+is\s+(?:here|now)\b/iu,
    ],
    examples: {
      bad: [
        'The possibilities are endless.',
        'This is just the beginning.',
        'The future of testing is here.',
      ],
      good: [
        'The future API will add pagination.',
        'Possibilities include caching and batching.',
        'We start at the beginning of the file.',
      ],
    },
  }),
];
