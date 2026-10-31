/**
 * Encodes text into a URL fragment. Uses deflate when the browser supports
 * CompressionStream (`z=` prefix), plain UTF-8 otherwise (`t=` prefix).
 * The fragment never reaches a server.
 */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  if (typeof CompressionStream === 'function') {
    return `z=${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  }
  return `t=${toBase64Url(bytes)}`;
}

export async function decodeText(fragment: string): Promise<string | null> {
  try {
    const [kind, data] = [fragment.slice(0, 2), fragment.slice(2)];
    if (kind === 't=') return new TextDecoder().decode(fromBase64Url(data));
    if (kind === 'z=' && typeof DecompressionStream === 'function') {
      return new TextDecoder().decode(
        await pipe(fromBase64Url(data), new DecompressionStream('deflate-raw')),
      );
    }
  } catch {
    // A truncated or edited link; fall back to the default text.
  }
  return null;
}
