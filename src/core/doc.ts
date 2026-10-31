import { mask, type MaskOptions } from './mask.js';
import type { Block, Doc } from './types.js';

const HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const LIST_ITEM = /^\s*(?:[-*+•]|\d{1,9}[.)])[ \t]+/;
const RULE_LINE = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|=+)[ \t]*$/;
const TABLE_ROW = /^\s*\|/;
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function countWords(text: string): number {
  let n = 0;
  for (const _ of text.matchAll(WORD)) n++;
  return n;
}

export function lineStartsOf(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

export function buildBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  const close = (): void => {
    if (current) {
      current.text = text.slice(current.start, current.end);
      blocks.push(current);
      current = null;
    }
  };

  let pos = 0;
  for (const rawLine of text.split('\n')) {
    const start = pos;
    const end = pos + rawLine.length - (rawLine.endsWith('\r') ? 1 : 0);
    pos += rawLine.length + 1;
    const line = text.slice(start, end);

    if (line.trim() === '') {
      close();
      continue;
    }
    if (HEADING.test(line)) {
      close();
      blocks.push({ type: 'heading', start, end, text: line });
      continue;
    }
    if (RULE_LINE.test(line)) {
      close();
      continue;
    }
    if (TABLE_ROW.test(line)) {
      if (current?.type !== 'table') {
        close();
        current = { type: 'table', start, end, text: '' };
      } else current.end = end;
      continue;
    }
    if (LIST_ITEM.test(line)) {
      close();
      current = { type: 'list-item', start, end, text: '' };
      continue;
    }
    if (current && current.type !== 'table') current.end = end;
    else {
      close();
      current = { type: 'paragraph', start, end, text: '' };
    }
  }
  close();

  // Trim leading indentation from block ranges so findings point at real text.
  for (const b of blocks) {
    const lead = b.text.length - b.text.trimStart().length;
    const trail = b.text.length - b.text.trimEnd().length;
    b.start += lead;
    b.end -= trail;
    b.text = text.slice(b.start, b.end);
  }
  return blocks.filter((b) => b.text.length > 0);
}

export function buildDoc(source: string, options: MaskOptions = {}): Doc {
  const text = mask(source, options);
  return {
    source,
    text,
    blocks: buildBlocks(text),
    words: countWords(text),
    lineStarts: lineStartsOf(source),
  };
}

export interface Position {
  line: number;
  column: number;
}

export function positionAt(lineStarts: number[], offset: number): Position {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((lineStarts[mid] ?? 0) <= offset) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: offset - (lineStarts[lo] ?? 0) + 1 };
}

export interface Span {
  start: number;
  end: number;
  text: string;
}

/** Splits a block into sentences. Offsets are absolute. */
export function sentencesOf(block: Pick<Block, 'start' | 'text'>): Span[] {
  const spans: Span[] = [];
  const re = /[^.!?\n]+(?:[.!?]+["'”’)\]*_]*|\n|$)/g;
  for (const m of block.text.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (!t || !/[\p{L}\p{N}]/u.test(t)) continue;
    const start = block.start + m.index + lead;
    spans.push({ start, end: start + t.length, text: t });
  }
  return spans;
}

/** Removes a leading list marker / heading hashes and inline emphasis markers for analysis. */
export function stripMarkers(text: string): string {
  return text
    .replace(/^\s*(?:[-*+•]|\d{1,9}[.)]|#{1,6})\s+/, '')
    .replace(/[*_]{1,3}/g, '')
    .trim();
}
