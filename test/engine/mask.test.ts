import { describe, expect, it } from 'vitest';
import { mask } from '../../src/core/mask.js';

/** Returns the visible (unmasked) words of the masked text. */
const visible = (s: string, opts = {}): string => mask(s, opts).replace(/\s+/g, ' ').trim();

describe('mask', () => {
  it('keeps length and newlines identical', () => {
    const src = 'a `code` b\n```\nx\n```\nhttps://example.com c\r\n> quote\n';
    const out = mask(src);
    expect(out.length).toBe(src.length);
    expect([...out].filter((c) => c === '\n').length).toBe(
      [...src].filter((c) => c === '\n').length,
    );
    expect(out.includes('\r')).toBe(true);
  });

  it('masks fenced code blocks with backticks and tildes', () => {
    expect(visible('before\n```js\nconst delve = 1;\n```\nafter')).toBe('before after');
    expect(visible('before\n~~~\ndelve\n~~~\nafter')).toBe('before after');
  });

  it('masks an unclosed fence to the end of the document', () => {
    expect(visible('ok\n```\ndelve\nseamless')).toBe('ok');
  });

  it('does not close a fence with a shorter or different fence', () => {
    expect(visible('````\n```\ndelve\n````\nafter')).toBe('after');
    expect(visible('```\n~~~\ndelve\n```\nafter')).toBe('after');
  });

  it('masks inline code, including multi-backtick spans', () => {
    expect(visible('use `delve()` here')).toBe('use here');
    expect(visible('use ``a ` b`` here')).toBe('use here');
  });

  it('masks indented code after a blank line but not list continuations', () => {
    expect(visible('text\n\n    code line\n\nafter')).toBe('text after');
    expect(visible('- item\n\n    continued text')).toBe('- item continued text');
  });

  it('masks blockquotes', () => {
    expect(visible("mine\n> In today's fast-paced world\n> more\nmine again")).toBe(
      'mine mine again',
    );
  });

  it('masks URLs, autolinks, and emails', () => {
    expect(visible('see https://example.com/unlock-potential now')).toBe('see now');
    expect(visible('see <https://example.com/x> now')).toBe('see now');
    expect(visible('see www.seamless.io now')).toBe('see now');
    expect(visible('mail growth@synergy.io now')).toBe('mail now');
  });

  it('masks link destinations but keeps link text', () => {
    expect(visible('[the docs](https://x.io/delve "title") here')).toBe('[the docs here');
    expect(visible('[the docs][ref] here\n\n[ref]: https://x.io')).toBe('[the docs here');
  });

  it('masks the ! of images', () => {
    expect(mask('![logo](a.png)').includes('!')).toBe(false);
  });

  it('masks HTML comments and tags', () => {
    expect(visible('a <!-- delve --> b')).toBe('a b');
    expect(visible('a <img src="https://x.io/seamless.png" alt="x"> b')).toBe('a b');
    expect(visible('a <!--\nmulti\nline\n--> b')).toBe('a b');
  });

  it('masks YAML frontmatter only at the start', () => {
    expect(visible('---\ntitle: Delve\n---\nbody')).toBe('body');
    expect(visible('body\n---\ntitle: x\n---')).toContain('title');
  });

  it('masks double-quoted text only with skipQuoted', () => {
    expect(visible('He said "delve deeper" today')).toContain('delve');
    expect(visible('He said "delve deeper" today', { skipQuoted: true })).toBe('He said today');
    expect(visible('He said “delve deeper” today', { skipQuoted: true })).toBe('He said today');
  });
});
