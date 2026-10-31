export { lint, resolveSetting } from './lint.js';
export { buildDoc, positionAt } from './doc.js';
export { mask } from './mask.js';
export { parseDirectives } from './ignore.js';
export {
  badgeMarkdown,
  computeScore,
  labelOf,
  LABEL_COLORS,
  MIN_WORDS,
  SCORE_K,
  SEVERITY_WEIGHT,
} from './score.js';
export { CATEGORIES, rules, rulesById } from './rules/index.js';
export type * from './types.js';
