import { closer } from './closer.js';
import { filler } from './filler.js';
import { format } from './format.js';
import { hedge } from './hedge.js';
import { opener } from './opener.js';
import { structure } from './structure.js';
import { vocab } from './vocab.js';
import { turkish } from './turkish.js';
import { languages } from './languages.js';
import type { Category, Rule } from '../types.js';

export const CATEGORIES: { id: Category; title: string; description: string }[] = [
  { id: 'opener', title: 'Openers', description: 'Stock first lines that delay the point.' },
  {
    id: 'vocab',
    title: 'Vocabulary',
    description: 'Words and phrases strongly associated with generated text.',
  },
  {
    id: 'structure',
    title: 'Structure',
    description: 'Sentence and paragraph shapes that repeat across generated text.',
  },
  { id: 'format', title: 'Formatting', description: 'Punctuation, emoji and emphasis habits.' },
  {
    id: 'hedge',
    title: 'Hedging',
    description: 'Qualifiers that keep a claim from committing to anything.',
  },
  {
    id: 'closer',
    title: 'Closers',
    description: 'Template endings, summaries and calls for engagement.',
  },
  {
    id: 'filler',
    title: 'Leftovers',
    description: 'Assistant disclaimers and unfilled placeholders.',
  },
];

export const rules: Rule[] = [
  ...opener,
  ...vocab,
  ...structure,
  ...format,
  ...hedge,
  ...closer,
  ...filler,
  ...turkish,
  ...languages,
];

export const rulesById: ReadonlyMap<string, Rule> = new Map(rules.map((r) => [r.id, r]));
