import { describe, expect, it } from 'vitest';
import { decodeText, encodeText } from '../playground/src/share.js';

describe('playground share links', () => {
  it('round-trips text through a compressed fragment', async () => {
    const text = "In today's fast-paced world — ünïcödé, emoji 🚀, and\nnewlines.\n";
    const fragment = await encodeText(text);
    expect(fragment.startsWith('z=')).toBe(true);
    expect(fragment).toMatch(/^z=[A-Za-z0-9_-]+$/);
    expect(await decodeText(fragment)).toBe(text);
  });

  it('decodes the uncompressed fallback', async () => {
    const b64 = Buffer.from('plain text', 'utf8').toString('base64url');
    expect(await decodeText(`t=${b64}`)).toBe('plain text');
  });

  it('returns null for broken or unknown fragments', async () => {
    expect(await decodeText('z=not-valid-deflate')).toBeNull();
    expect(await decodeText('x=abc')).toBeNull();
    expect(await decodeText('')).toBeNull();
  });
});
