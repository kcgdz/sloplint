export type Severity = 'error' | 'warning' | 'info';

export type Category = 'opener' | 'vocab' | 'structure' | 'format' | 'hedge' | 'closer' | 'filler';

export type RuleOptions = Record<string, unknown>;

/** A severity, `'off'`, or a tuple of severity plus rule options. */
export type RuleSetting = Severity | 'off' | [Severity | 'off', RuleOptions?];

export interface Block {
  type: 'heading' | 'list-item' | 'paragraph' | 'table';
  /** Offset of the first character (inclusive). */
  start: number;
  /** Offset after the last character (exclusive). */
  end: number;
  /** Masked text of the block. */
  text: string;
}

export interface Doc {
  /** Original input. */
  source: string;
  /** Same length as `source`, with code, quotes, URLs and comments replaced by spaces. */
  text: string;
  blocks: Block[];
  /** Number of words in the masked text. */
  words: number;
  lineStarts: number[];
}

/** What a rule's `check` returns: a character range plus optional overrides. */
export interface RawFinding {
  start: number;
  end: number;
  message?: string;
  suggestion?: string;
  replacement?: string;
}

export interface RuleExamples {
  /** Each string must trigger the rule. */
  bad: string[];
  /** Each string must not trigger the rule. */
  good: string[];
}

export interface Rule {
  /** `category/kebab-name` */
  id: string;
  category: Category;
  severity: Severity;
  /** Short name of the pattern, used in tables. */
  title: string;
  /** Why readers perceive it as slop. */
  why: string;
  /** How to rewrite it. */
  suggestion: string;
  examples: RuleExamples;
  defaultOptions?: RuleOptions;
  check(doc: Doc, options: RuleOptions): RawFinding[];
}

export interface Finding {
  ruleId: string;
  category: Category;
  severity: Severity;
  /** 1-based. */
  line: number;
  /** 1-based, in UTF-16 code units. */
  column: number;
  endLine: number;
  endColumn: number;
  /** 0-based offset into the source. */
  offset: number;
  length: number;
  /** The flagged text, whitespace collapsed. */
  match: string;
  message: string;
  suggestion: string;
  replacement?: string;
}

export interface LintOptions {
  rules?: Record<string, RuleSetting>;
  /** Skip text inside double quotes. */
  skipQuoted?: boolean;
}

export type ScoreLabel = 'Human' | 'Light seasoning' | 'Sloppy' | 'Pure slop';

export interface LintResult {
  findings: Finding[];
  /** 0 (clean) to 100 (pure slop). */
  score: number;
  label: ScoreLabel;
  words: number;
  /** Severity-weighted sum of findings. */
  points: number;
}
