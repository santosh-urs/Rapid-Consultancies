import crypto from 'crypto';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface ResetTokenPayload {
  email: string;
  role: 'user' | 'staff';
  expires: number;
}

function getSecret(): string {
  const secret = process.env.RESET_TOKEN_SECRET;
  if (!secret) throw new Error('RESET_TOKEN_SECRET is not configured on the server.');
  return secret;
}

export function createResetToken(email: string, role: 'user' | 'staff'): string {
  const payload: ResetTokenPayload = { email, role, expires: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyResetToken(token: string): ResetTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: ResetTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload.email || !payload.role || !payload.expires) return null;
  if (Date.now() > payload.expires) return null;

  return payload;
}
