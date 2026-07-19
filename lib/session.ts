// HMAC-signed session tokens for login cookies. Uses the Web Crypto API
// (not Node's `crypto` module) so this works identically in middleware
// (Edge runtime) and in API routes (Node runtime).

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionRole = 'user' | 'staff' | 'admin';

export interface SessionPayload {
  id: string;
  role: SessionRole;
  exp: number; // unix seconds
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = '';
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured on the server.');
  return secret;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export const SESSION_COOKIE_NAME = 'rc_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export async function createSessionToken(id: string, role: SessionRole): Promise<string> {
  const payload: SessionPayload = {
    id,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${base64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  try {
    const key = await getKey(getSecret());
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(sig) as BufferSource, encoder.encode(body));
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64urlDecode(body))) as SessionPayload;
    if (!payload.id || !payload.role) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
