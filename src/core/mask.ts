/**
 * Replaces every character that should not be linted with a space, keeping
 * newlines so that offsets, lines and columns stay identical to the source.
 *
 * Masked: YAML frontmatter, fenced and indented code, inline code, blockquotes,
 * HTML comments and tags, link destinations, reference definitions, URLs and
 * email addresses. Optionally, text inside double quotes.
 */
export interface MaskOptions {
  skipQuoted?: boolean;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const LIST_MARKER = /^ {0,3}(?:[-*+•]|\d{1,9}[.)])[ \t]/;

export function mask(source: string, options: MaskOptions = {}): string {
  const out = source.split('');

  const blank = (start: number, end: number): void => {
    for (let i = start; i < end; i++) {
      const ch = out[i];
      if (ch !== '\n' && ch !== '\r') out[i] = ' ';
    }
  };

  const blankAll = (re: RegExp, text: string): void => {
    for (const m of text.matchAll(re)) blank(m.index, m.index + m[0].length);
  };

  // YAML frontmatter.
  const fm = /^---[ \t]*\r?\n[\s\S]*?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  if (fm) blank(0, fm[0].length);

  // HTML comments (also hold the ignore directives, which are read from the source).
  blankAll(/<!--[\s\S]*?-->/g, source);

  // Line-based constructs: fences, blockquotes, indented code.
  let pos = 0;
  let fence: { char: string; len: number } | null = null;
  let prevBlank = true;
  let prevIndentedCode = false;
  let inList = false;
  const current = out.join('');
  for (const rawLine of current.split('\n')) {
    const start = pos;
    const end = pos + rawLine.length;
    pos = end + 1;
    const line = rawLine.replace(/\r$/, '');
    // Indentation and blankness come from the source, so text that follows a
    // multi-line HTML comment is not mistaken for an indented code block.
    const srcLine = source.slice(start, end).replace(/\r$/, '');
    const isBlank = srcLine.trim() === '';

    if (fence) {
      blank(start, end);
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close?.[1] && close[1][0] === fence.char && close[1].length >= fence.len) fence = null;
      prevBlank = false;
      continue;
    }

    const open = FENCE.exec(line);
    if (open?.[1]) {
      fence = { char: open[1][0] ?? '`', len: open[1].length };
      blank(start, end);
      prevBlank = false;
      prevIndentedCode = false;
      continue;
    }

    if (/^\s*>/.test(line)) {
      blank(start, end);
      prevBlank = false;
      prevIndentedCode = false;
      continue;
    }

    if (!isBlank && /^(?: {4}|\t)/.test(srcLine) && (prevBlank || prevIndentedCode) && !inList) {
      blank(start, end);
      prevIndentedCode = true;
      prevBlank = false;
      continue;
    }

    if (LIST_MARKER.test(srcLine)) inList = true;
    else if (!isBlank && !/^\s/.test(srcLine)) inList = false;

    if (!isBlank) prevIndentedCode = false;
    prevBlank = isBlank;
  }

  let text = out.join('');

  // Inline code spans: a run of N backticks closed by the same run, not crossing a blank line.
  blankAll(/(`+)(?:[^`\n]|`(?!\1)|\n(?![ \t]*\n))*?\1/g, text);
  text = out.join('');

  // Autolinks, raw URLs, emails.
  blankAll(/<(?:https?|mailto|ftp):[^>\s]+>/gi, text);
  blankAll(/\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()[\]]+/gi, text);
  blankAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, text);
  text = out.join('');

  // Markdown link destinations and reference labels; keep the visible link text.
  blankAll(/\]\([^)\n]*\)/g, text);
  blankAll(/\]\[[^\]\n]*\]/g, text);
  blankAll(/^ {0,3}\[[^\]\n]+\]:.*$/gm, text);
  // The "!" of an image is syntax, not punctuation.
  blankAll(/!(?=\[)/g, text);
  text = out.join('');

  // HTML tags (attributes often carry URLs).
  blankAll(/<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?\/?>/g, text);

  if (options.skipQuoted) {
    text = out.join('');
    blankAll(/"[^"\n]{1,400}"/g, text);
    blankAll(/“[^”\n]{1,400}”/g, text);
  }

  return out.join('');
}
