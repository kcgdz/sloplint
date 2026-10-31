import { buildDoc, positionAt } from './doc.js';
import { parseDirectives } from './ignore.js';
import { rules as allRules } from './rules/index.js';
import { computeScore, labelOf, pointsOf } from './score.js';
import type {
  Finding,
  LintOptions,
  LintResult,
  Rule,
  RuleOptions,
  RuleSetting,
  Severity,
} from './types.js';

export interface ResolvedSetting {
  severity: Severity | 'off';
  options: RuleOptions;
}

/**
 * Lookup order: exact rule ID, then `category/*`, then `category`, then the rule default.
 */
export function resolveSetting(
  rule: Rule,
  settings: Record<string, RuleSetting> = {},
): ResolvedSetting {
  const setting =
    settings[rule.id] ?? settings[`${rule.category}/*`] ?? settings[rule.category] ?? undefined;
  const defaults = rule.defaultOptions ?? {};
  if (setting === undefined) return { severity: rule.severity, options: defaults };
  if (Array.isArray(setting)) {
    return { severity: setting[0], options: { ...defaults, ...(setting[1] ?? {}) } };
  }
  return { severity: setting, options: defaults };
}

export function lint(
  source: string,
  options: LintOptions = {},
  ruleset: Rule[] = allRules,
): LintResult {
  const doc = buildDoc(source, { skipQuoted: options.skipQuoted ?? false });
  const ignore = parseDirectives(source);
  const findings: Finding[] = [];

  for (const rule of ruleset) {
    const { severity, options: ruleOptions } = resolveSetting(rule, options.rules);
    if (severity === 'off') continue;
    for (const raw of rule.check(doc, ruleOptions)) {
      const startPos = positionAt(doc.lineStarts, raw.start);
      if (ignore.isIgnored(rule.id, startPos.line)) continue;
      const endPos = positionAt(doc.lineStarts, raw.end);
      const finding: Finding = {
        ruleId: rule.id,
        category: rule.category,
        severity,
        line: startPos.line,
        column: startPos.column,
        endLine: endPos.line,
        endColumn: endPos.column,
        offset: raw.start,
        length: raw.end - raw.start,
        match: source.slice(raw.start, raw.end).replace(/\s+/g, ' ').trim(),
        message: raw.message ?? rule.why,
        suggestion: raw.suggestion ?? rule.suggestion,
      };
      if (raw.replacement !== undefined) finding.replacement = raw.replacement;
      findings.push(finding);
    }
  }

  const deduped = dedupeWithinCategory(findings);
  const points = pointsOf(deduped);
  const score = computeScore(points, doc.words);
  return { findings: deduped, score, label: labelOf(score), words: doc.words, points };
}

const RANK: Record<Severity, number> = { error: 3, warning: 2, info: 1 };

/**
 * Two rules of the same category flagging overlapping text (e.g. "In today's
 * digital landscape" matching two opener rules) count once: the higher
 * severity wins, then the longer match. Overlaps across categories are kept,
 * since they describe different problems.
 */
function dedupeWithinCategory(findings: Finding[]): Finding[] {
  const ordered = [...findings].sort(
    (a, b) => RANK[b.severity] - RANK[a.severity] || b.length - a.length || a.offset - b.offset,
  );
  const kept: Finding[] = [];
  for (const f of ordered) {
    const overlaps = kept.some(
      (k) =>
        k.category === f.category &&
        k.ruleId !== f.ruleId &&
        f.offset < k.offset + k.length &&
        k.offset < f.offset + f.length,
    );
    if (!overlaps) kept.push(f);
  }
  return kept.sort((a, b) => a.offset - b.offset || a.ruleId.localeCompare(b.ruleId));
}
