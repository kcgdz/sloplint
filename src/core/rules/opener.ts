import { phraseRule, SENTENCE_START } from './helpers.js';
import type { Rule } from '../types.js';

export const opener: Rule[] = [
  phraseRule({
    id: 'opener/fast-paced-world',
    category: 'opener',
    severity: 'warning',
    title: '"In today\'s fast-paced world"',
    why: 'A stock opener that delays the point and could precede any text about anything.',
    suggestion: 'Delete it and open with the concrete problem or the news.',
    patterns: [
      /\bin\s+today['’]s\s+(?:[\w-]+\s+){0,2}(?:world|age|era|society|day\s+and\s+age)\b/iu,
      /\bin\s+today['’]s\s+(?:hyper[-\s]?)?(?:competitive|digital|fast[-\s]paced|ever[-\s](?:changing|evolving)|rapidly\s+(?:changing|evolving)|modern|connected|interconnected|data[-\s]driven|always[-\s]on)\b/iu,
      /\bin\s+(?:this|our|the|an?)\s+(?:fast[-\s]paced|ever[-\s](?:changing|evolving)|rapidly\s+(?:changing|evolving)|hyper[-\s]?connected|always[-\s]on|increasingly\s+(?:digital|connected|complex|competitive))\s+(?:world|age|era|landscape|environment|society|economy|market)\b/iu,
      'in this day and age',
    ],
    examples: {
      bad: [
        "In today's fast-paced world, developers need better tools.",
        "In today's digital age, every business needs a website.",
        'In this ever-evolving world of AI, staying ahead matters.',
        'In this day and age, nobody reads manuals.',
      ],
      good: [
        "Today's release fixes the login bug.",
        'The world record was set in 1998.',
        "In today's standup we agreed to ship on Friday.",
      ],
    },
  }),

  phraseRule({
    id: 'opener/ever-evolving-landscape',
    category: 'opener',
    severity: 'warning',
    title: '"The ever-evolving landscape"',
    why: '"Landscape" and "navigating the complexities" are filler metaphors that signal generated text.',
    suggestion: 'Name the field and the specific change you mean.',
    patterns: [
      /\b(?:ever|constantly|rapidly|fast)[-\s](?:evolving|changing|shifting)\s+(?:landscape|world|field|space|industry|ecosystem|terrain|realm)\b/iu,
      /\b(?:the|today['’]s)\s+(?:digital|tech|technology|modern|business|AI|competitive|software|marketing|SaaS|startup)\s+landscape\b/iu,
      /\bnavigat(?:e|es|ed|ing)\s+the\s+(?:complexit(?:y|ies)|intricacies|(?:complex|intricate|ever[-\s]\w+|murky|choppy|uncharted)\s+(?:landscape|world|waters|terrain|maze|realm))\b/iu,
    ],
    examples: {
      bad: [
        'In the ever-evolving landscape of web development, tooling matters.',
        'Navigating the complexities of modern deployment can be daunting.',
        'The digital landscape has changed.',
      ],
      good: [
        'The landscape photos load lazily.',
        'Rapidly changing requirements broke the schema twice.',
        'We navigate the file tree with arrow keys.',
      ],
    },
  }),

  phraseRule({
    id: 'opener/imagine-a-world',
    category: 'opener',
    severity: 'warning',
    title: '"Imagine a world where…"',
    why: 'An ad-copy hook that asks the reader to do work before you have told them anything.',
    suggestion: 'State what the thing does. If the scenario matters, describe a real one.',
    patterns: [
      'imagine a world where',
      'imagine a world in which',
      'imagine if you could',
      'imagine never having to',
      'imagine being able to',
      /\bpicture\s+this\s*[:.!—–]/iu,
      'what if I told you',
    ],
    examples: {
      bad: [
        'Imagine a world where deployments never fail.',
        "Picture this: it's 2 a.m. and your pager goes off.",
        'Imagine never having to write a migration again.',
        "What if I told you there's a better way?",
      ],
      good: [
        'Imagine is a song by John Lennon.',
        'The test should imagine a user with no permissions.',
        'Picture this component as a pipeline.',
      ],
    },
  }),

  phraseRule({
    id: 'opener/lets-dive-in',
    category: 'opener',
    severity: 'warning',
    title: '"Let\'s dive in"',
    why: 'Announces that content is coming instead of delivering it.',
    suggestion: 'Delete the sentence. The next paragraph is the start.',
    patterns: [
      /\blet['’]?s\s+(?:dive|jump)\s+(?:right\s+)?(?:in|into|deep|deeper)\b/iu,
      /\blet\s+us\s+dive\b/iu,
      'dive right in',
      'buckle up',
      'without further ado',
      "let's unpack",
      "let's break it down",
      "let's get into it",
    ],
    examples: {
      bad: [
        "Let's dive in.",
        'Without further ado, here are the results.',
        'Buckle up, because this release is big.',
        "Let's unpack what that means.",
      ],
      good: [
        'We dive into the parser internals in part two.',
        'The diving team won.',
        'Break the task into steps.',
      ],
    },
  }),

  phraseRule({
    id: 'opener/rhetorical-hook',
    category: 'opener',
    severity: 'warning',
    title: '"Have you ever wondered…?"',
    why: 'A rhetorical question used as a hook. Readers skip it to find the actual claim.',
    suggestion: 'Replace the question with the answer.',
    patterns: [
      /(?<![\p{L}\p{N}'’])(?:have\s+you\s+ever|ever)\s+(?:wondered|felt|found\s+yourself|struggled|wished|asked\s+yourself|been\s+frustrated|dreamed)\b[^?\n]{0,200}\?/iu,
      /(?<![\p{L}\p{N}'’])(?:are\s+you\s+)?(?:tired|sick)\s+of\s[^?\n]{1,150}\?/iu,
      /(?<![\p{L}\p{N}'’])(?:do|are)\s+you\s+(?:struggling|struggle|frustrated|overwhelmed)\b[^?\n]{0,150}\?/iu,
      /(?<![\p{L}\p{N}'’])what\s+if\s+you\s+could\b[^?\n]{0,150}\?/iu,
    ],
    examples: {
      bad: [
        'Have you ever wondered why your builds are slow?',
        'Tired of flaky tests?',
        'Are you struggling to keep up with your inbox?',
        'What if you could ship twice as fast?',
      ],
      good: [
        'I wondered why the build was slow, so I profiled it.',
        'Have you run the migration yet?',
        'Ever since the upgrade, builds take 4 minutes.',
      ],
    },
  }),

  phraseRule({
    id: 'opener/chatbot-preamble',
    category: 'opener',
    severity: 'error',
    title: '"Certainly! Here\'s…"',
    why: 'Chat-assistant preamble pasted into the final text. It tells the reader nobody edited this.',
    suggestion: 'Delete the preamble and keep only the content.',
    patterns: [
      /\b(?:what\s+an?\s+)?(?:great|excellent|good|fantastic)\s+question\s*[!,.]/iu,
      new RegExp(
        String.raw`${SENTENCE_START}(?:certainly|absolutely|of course|sure thing|sure)\s*[!,.]\s*(?:here['’]?s|here is|here are|below is|below are|I['’]d be happy|I can help|let['’]s)`,
        'imu',
      ),
      /\b(?:here\s+is|here['’]s|below\s+is)\s+an?\s+(?:comprehensive|detailed|thorough|complete|concise)\s+(?:overview|guide|breakdown|summary|look|explanation|list|version|draft)\b/iu,
    ],
    examples: {
      bad: [
        "Certainly! Here's a README for your project.",
        'Great question! The answer depends on your setup.',
        'Here is a comprehensive overview of the API.',
        'Absolutely! Below is the updated version.',
      ],
      good: [
        'Certainly not before Friday.',
        'Sure, that works for me.',
        'Here is the overview of the API.',
        'The question was a good one.',
      ],
    },
  }),

  phraseRule({
    id: 'opener/hope-finds-you-well',
    category: 'opener',
    severity: 'warning',
    title: '"I hope this email finds you well"',
    why: 'Template email openers spend the most-read line of the message on nothing.',
    suggestion: 'Open with the reason you are writing.',
    patterns: [
      /\bhope\s+(?:this|my|the)\s+(?:e-?mail|message|note|letter)\s+finds\s+you\b/iu,
      /\bhope\s+(?:you['’]re|you\s+are|you\s+have\s+been|all\s+is)\s+(?:doing\s+)?(?:well|great|good)\b/iu,
      /\bhope\s+you['’]re\s+having\s+a\s+(?:great|good|wonderful|productive)\s+(?:day|week|morning)\b/iu,
      'I wanted to reach out',
      "I'm reaching out",
      'I am reaching out',
      /\b(?:just\s+)?circling\s+back\b/iu,
      'just following up',
      'just checking in',
      'touching base',
    ],
    examples: {
      bad: [
        'I hope this email finds you well.',
        'Just circling back on my last note.',
        'I wanted to reach out about your hiring plans.',
        "Hope you're doing well!",
      ],
      good: [
        'The well was dry.',
        'We reached out to three vendors and two replied.',
        "Following up on Tuesday's call: the contract is attached.",
      ],
    },
  }),
];
