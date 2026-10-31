import type { Block, Doc, RawFinding, Rule, RuleOptions } from '../types.js';

/** Whitespace between words: spaces/tabs, or a single line break. */
const WS = '(?:[ \\t]+\\n?[ \\t]*|\\n[ \\t]*)';
const NOT_WORD_BEFORE = '(?<![\\p{L}\\p{N}_])';
const NOT_WORD_AFTER = '(?![\\p{L}\\p{N}_])';

/**
 * Compiles a literal phrase into a regex source:
 * - spaces match any run of inline whitespace (or one line break)
 * - apostrophes match both ' and ’
 * - hyphens are optional and may also be a space ("cutting-edge" / "cutting edge")
 * - `*` at the end of a word matches word suffixes ("empower*" → empowers, empowering)
 */
export function phraseSource(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => {
          const wildcard = part.endsWith('*');
          const core = (wildcard ? part.slice(0, -1) : part)
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/'/g, "['’]");
          return wildcard ? `${core}[\\p{L}]*` : core;
        })
        .join('[-‐‑ ]?'),
    )
    .join(WS);
}

export function compile(patterns: (string | RegExp)[]): RegExp[] {
  return patterns.map((p) =>
    typeof p === 'string'
      ? new RegExp(`${NOT_WORD_BEFORE}${phraseSource(p)}${NOT_WORD_AFTER}`, 'giu')
      : new RegExp(p.source, p.flags.includes('g') ? p.flags : `${p.flags}g`),
  );
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
}

/** Runs patterns over the masked text; drops overlapping matches (first, then longest, wins). */
export function findAll(text: string, regexes: RegExp[]): RawFinding[] {
  const hits: RawFinding[] = [];
  for (const re of regexes) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      // A pattern may use a capture group named "hit" to narrow the flagged range.
      const hit = m.groups?.hit;
      let start = m.index;
      if (hit !== undefined) start = m.index + m[0].indexOf(hit);
      const end = start + (hit ?? m[0]).length;
      if (end > start) hits.push({ start, end });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: RawFinding[] = [];
  for (const h of hits) {
    const last = out[out.length - 1];
    if (last && h.start < last.end) continue;
    out.push(h);
  }
  return out;
}

function allowList(options: RuleOptions): Set<string> {
  const allow = options.allow;
  return new Set(Array.isArray(allow) ? allow.map((a) => normalize(String(a))) : []);
}

type RuleMeta = Omit<Rule, 'check'>;

export interface PhraseRuleDef extends RuleMeta {
  patterns: (string | RegExp)[];
  /** Lowercased match (or its first word) → suggested replacement. */
  replacements?: Record<string, string>;
}

/** A rule that flags every occurrence of a fixed list of phrases. Option: `allow: string[]`. */
export function phraseRule(def: PhraseRuleDef): Rule {
  const regexes = compile(def.patterns);
  const { patterns: _p, replacements, ...meta } = def;
  return {
    ...meta,
    defaultOptions: { allow: [], ...def.defaultOptions },
    check(doc, options) {
      const allow = allowList(options);
      return findAll(doc.text, regexes)
        .filter((f) => !allow.has(normalize(doc.text.slice(f.start, f.end))))
        .map((f) => {
          if (!replacements) return f;
          const key = normalize(doc.text.slice(f.start, f.end));
          const replacement = replacements[key] ?? replacements[key.split(' ')[0] ?? ''];
          return replacement === undefined
            ? f
            : { ...f, replacement, suggestion: `Try "${replacement}".` };
        });
    },
  };
}

export interface DensityRuleDef extends PhraseRuleDef {
  defaultOptions: { minCount: number; per100Words: number; allow?: string[] };
  /** Matches inside these block types are not counted. */
  skipBlockTypes?: Block['type'][];
}

/**
 * A rule that only fires when a pattern is frequent: at least `minCount`
 * occurrences and at least `per100Words` occurrences per 100 words.
 * Every occurrence is reported once the threshold is crossed.
 */
export function densityRule(def: DensityRuleDef): Rule {
  const { skipBlockTypes, ...phraseDef } = def;
  const base = phraseRule(phraseDef);
  return {
    ...base,
    check(doc, options) {
      const skipped = doc.blocks.filter((b) => skipBlockTypes?.includes(b.type));
      const hits = base
        .check(doc, options)
        .filter((h) => !skipped.some((b) => h.start >= b.start && h.start < b.end));
      const minCount = Number(options.minCount);
      const per100 = Number(options.per100Words);
      const density = (hits.length / Math.max(doc.words, 1)) * 100;
      if (hits.length < minCount || density < per100) return [];
      const message = `${hits.length} in ${doc.words} words (${density.toFixed(1)} per 100). ${def.why}`;
      return hits.map((h) => ({ ...h, message }));
    },
  };
}

/** Rule with a hand-written check. */
export function customRule(def: Rule): Rule {
  return def;
}

export function sliceDoc(doc: Doc, f: RawFinding): string {
  return doc.text.slice(f.start, f.end);
}

/**
 * Lookbehind for "start of a sentence": start of line, after terminal punctuation,
 * or after a thread number such as "3/" or "3/7". Use with the `m` flag.
 */
export const SENTENCE_START = String.raw`(?<=^|[.!?]["'”’)]?[ \t]{1,3}|\n[ \t]*|^[ \t]*\d{1,2}\/\d{0,2}[ \t]+)`;

/** Extended pictographic emoji, including keycaps and flags. */
export const EMOJI =
  /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:️|‍\p{Extended_Pictographic})*/u;
