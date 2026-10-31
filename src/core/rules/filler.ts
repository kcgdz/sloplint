import { phraseRule } from './helpers.js';
import type { Rule } from '../types.js';

export const filler: Rule[] = [
  phraseRule({
    id: 'filler/ai-self-reference',
    category: 'filler',
    severity: 'error',
    title: 'Leftover assistant text and placeholders',
    why: 'Model disclaimers ("As an AI language model") or unfilled template slots ("[Your Name]") prove nobody read the text before publishing.',
    suggestion: 'Delete the disclaimer. Fill in or remove every placeholder.',
    patterns: [
      /\bas\s+an\s+AI(?:\s+language\s+model|\s+assistant|\s+model|,)/iu,
      /\bas\s+a\s+large\s+language\s+model\b/iu,
      /\bas\s+of\s+my\s+(?:last\s+)?(?:knowledge\s+)?(?:update|cutoff|training)\b/iu,
      /\bmy\s+(?:knowledge|training)\s+(?:cutoff|data)\b/iu,
      /\bI\s+(?:don['’]t|do\s+not)\s+have\s+(?:access\s+to\s+real-time|the\s+ability\s+to\s+browse|personal\s+(?:opinions|experiences|feelings))\b/iu,
      /\bI\s+(?:cannot|can['’]t|am\s+unable\s+to|['’]m\s+unable\s+to)\s+browse\s+the\s+(?:internet|web)\b/iu,
      'regenerate response',
      /\[(?:Your|Insert|Company|Recipient|Product|Client|Customer|First|Last|Full)\b[^\]\n]{0,40}\]/u,
    ],
    examples: {
      bad: [
        "As an AI language model, I can't predict prices.",
        'As of my last update, the API was in beta.',
        'Best regards,\n[Your Name]',
        'Thanks for considering [Company Name].',
      ],
      good: [
        'As an AI researcher, she studies alignment.',
        'Our AI model updates nightly.',
        'See [the docs](https://example.com) for details.',
        '- [x] Your name is set',
      ],
    },
  }),
];
