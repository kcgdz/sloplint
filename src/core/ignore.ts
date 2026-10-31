/**
 * Inline directives. They work inside any comment syntax, because only the
 * directive text itself is matched:
 *
 *   <!-- sloplint-disable-next-line vocab/delve -->
 *   <!-- sloplint-disable-line -->
 *   <!-- sloplint-disable format/em-dash-density -->  …  <!-- sloplint-enable -->
 *   <!-- sloplint-disable-file -->
 *
 * IDs may be full rule IDs (`vocab/delve`) or categories (`vocab`). No IDs means all rules.
 * Text after ` -- ` is a free-form reason and is ignored.
 */

type Ids = string[] | null;

interface Range {
  from: number;
  to: number;
  ids: Ids;
}

const DIRECTIVE =
  /sloplint-(disable-next-line|disable-line|disable-file|disable|enable)(?![\w-])([^\n]*)/g;

function parseIds(rest: string): Ids {
  let body = rest;
  for (const stop of ['-->', '*/', ' -- ']) {
    const i = body.indexOf(stop);
    if (i !== -1) body = body.slice(0, i);
  }
  const ids = body.match(/[a-z]+(?:\/[a-z0-9-]+)?/g);
  return ids && ids.length > 0 ? ids : null;
}

function matches(ids: Ids, ruleId: string): boolean {
  if (ids === null) return true;
  const category = ruleId.split('/')[0];
  return ids.some((id) => id === ruleId || id === category);
}

export interface IgnoreMatcher {
  isIgnored(ruleId: string, line: number): boolean;
}

export function parseDirectives(source: string): IgnoreMatcher {
  const ranges: Range[] = [];
  const open: Range[] = [];

  const lineOf = (offset: number): number => {
    let line = 1;
    for (let i = 0; i < offset; i++) if (source.charCodeAt(i) === 10) line++;
    return line;
  };

  for (const m of source.matchAll(DIRECTIVE)) {
    const kind = m[1];
    const ids = parseIds(m[2] ?? '');
    const line = lineOf(m.index);
    switch (kind) {
      case 'disable-file':
        ranges.push({ from: 1, to: Infinity, ids });
        break;
      case 'disable-line':
        ranges.push({ from: line, to: line, ids });
        break;
      case 'disable-next-line':
        ranges.push({ from: line + 1, to: line + 1, ids });
        break;
      case 'disable': {
        const r = { from: line, to: Infinity, ids };
        ranges.push(r);
        open.push(r);
        break;
      }
      case 'enable':
        for (let i = open.length - 1; i >= 0; i--) {
          const r = open[i]!;
          const closes = ids === null || r.ids === null || r.ids.some((id) => ids.includes(id));
          if (closes) {
            r.to = line;
            open.splice(i, 1);
          }
        }
        break;
    }
  }

  return {
    isIgnored(ruleId, line) {
      return ranges.some((r) => line >= r.from && line <= r.to && matches(r.ids, ruleId));
    },
  };
}
