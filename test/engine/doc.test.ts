import { describe, expect, it } from 'vitest';
import { buildBlocks, buildDoc, countWords, positionAt, sentencesOf } from '../../src/core/doc.js';

describe('countWords', () => {
  it('counts words with apostrophes and hyphens as one', () => {
    expect(countWords("It's a well-known fact.")).toBe(4);
    expect(countWords('Ünicode wörds çount')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });
});

describe('positionAt', () => {
  it('maps offsets to 1-based line and column', () => {
    const doc = buildDoc('ab\ncd\n\nef');
    expect(positionAt(doc.lineStarts, 0)).toEqual({ line: 1, column: 1 });
    expect(positionAt(doc.lineStarts, 4)).toEqual({ line: 2, column: 2 });
    expect(positionAt(doc.lineStarts, 7)).toEqual({ line: 4, column: 1 });
    expect(positionAt(doc.lineStarts, 8)).toEqual({ line: 4, column: 2 });
  });
});

describe('buildBlocks', () => {
  it('splits headings, paragraphs, list items and tables', () => {
    const text =
      '# Title\n\nPara one\nstill one.\n\n- item a\n  more a\n- item b\n\n| a | b |\n|---|---|\n\nLast.';
    const types = buildBlocks(text).map((b) => b.type);
    expect(types).toEqual(['heading', 'paragraph', 'list-item', 'list-item', 'table', 'paragraph']);
  });

  it('treats thematic breaks as separators', () => {
    expect(buildBlocks('one\n---\ntwo').map((b) => b.text)).toEqual(['one', 'two']);
  });

  it('trims indentation from block ranges', () => {
    const [b] = buildBlocks('   indented para');
    expect(b?.text).toBe('indented para');
    expect(b?.start).toBe(3);
  });
});

describe('sentencesOf', () => {
  it('splits on terminal punctuation with absolute offsets', () => {
    const block = { start: 10, text: 'One. Two? Three!' };
    const s = sentencesOf(block);
    expect(s.map((x) => x.text)).toEqual(['One.', 'Two?', 'Three!']);
    expect(s[1]?.start).toBe(15);
  });

  it('ignores punctuation-only fragments', () => {
    expect(sentencesOf({ start: 0, text: '... !!' })).toEqual([]);
  });
});
