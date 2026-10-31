import { densityRule, phraseRule } from './helpers.js';
import type { Rule } from '../types.js';

export const hedge: Rule[] = [
  phraseRule({
    id: 'hedge/stacked',
    category: 'hedge',
    severity: 'warning',
    title: 'Stacked hedges ("may potentially")',
    why: 'Two hedges on one claim. The writer is protecting themselves instead of informing the reader.',
    suggestion: 'Keep one hedge, or state the condition under which the claim holds.',
    patterns: [
      /\b(?:may|might|could|can)\s+(?:potentially|possibly|perhaps|conceivably|maybe)\b/iu,
      /\bperhaps\s+(?:maybe|possibly|potentially)\b/iu,
      /\bpossibly\s+(?:might|could|may)\b/iu,
      /\bit\s+(?:may|might|could)\s+(?:be\s+)?(?:possible|argued)\s+that\b/iu,
      /\barguably\s+(?:perhaps|maybe|possibly)\b/iu,
    ],
    examples: {
      bad: [
        'This may potentially improve performance.',
        'It could be argued that tests are useful.',
        'Perhaps maybe we should wait.',
      ],
      good: [
        'This may improve performance.',
        'Potential issues are listed below.',
        'We could add a cache.',
      ],
    },
  }),

  phraseRule({
    id: 'hedge/worth-noting',
    category: 'hedge',
    severity: 'warning',
    title: '"It\'s worth noting that"',
    why: 'Throat-clearing before a fact. If it is worth noting, note it.',
    suggestion: 'Delete the lead-in and keep the fact.',
    patterns: [
      /\bit(?:['’]s|\s+is)\s+(?:also\s+)?(?:worth|important|crucial|essential|vital)\s+(?:to\s+)?(?:noting|mentioning|pointing\s+out|highlighting|note|remember|mention|understand|recognize|recognise|keep\s+in\s+mind)\b/iu,
      'it should be noted',
      /\bit\s+bears\s+(?:mentioning|repeating)\b/iu,
      'needless to say',
      'it goes without saying',
    ],
    examples: {
      bad: [
        "It's worth noting that the API is rate-limited.",
        'It is important to note that this is a beta.',
        'Needless to say, backups matter.',
      ],
      good: [
        'Note: the API is rate-limited.',
        'Worth reading: the RFC.',
        'It is important for the cache to be warm.',
      ],
    },
  }),

  densityRule({
    id: 'hedge/qualifier-density',
    category: 'hedge',
    severity: 'info',
    title: 'Qualifier pile-up',
    why: 'When most sentences carry "generally", "arguably" or "to some extent", the text commits to nothing.',
    suggestion: 'Commit where you can. Where you cannot, say what the exception is.',
    patterns: [
      'generally',
      'typically',
      /\bin\s+(?:many|most|some)\s+cases\b/iu,
      /\bto\s+(?:some|a\s+certain|a\s+large)\s+extent\b/iu,
      'in some ways',
      'somewhat',
      'arguably',
      'relatively',
      'potentially',
      'more or less',
      'in a sense',
      'for the most part',
      /\btends?\s+to\b/iu,
    ],
    defaultOptions: { minCount: 4, per100Words: 2 },
    examples: {
      bad: [
        'Generally, it is somewhat faster and arguably, in many cases, relatively stable.',
        'It typically works and is potentially, to some extent, more or less reliable.',
      ],
      good: [
        'It is generally faster.',
        'Builds typically take 2 minutes, and caching tends to help.',
        'It is faster on every benchmark we ran.',
      ],
    },
  }),
];
