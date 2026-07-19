import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(`admin-verify:${getClientIp(req)}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { identifier, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPhone = process.env.ADMIN_PHONE;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPass) {
      return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 });
    }

    const idClean = (identifier ?? '').trim().toLowerCase().replace(/\D/g, '');
    const phoneClean = (adminPhone ?? '').replace(/\D/g, '');

    const identifierMatches =
      identifier.trim().toLowerCase() === adminEmail.toLowerCase() ||
      idClean === phoneClean;

    if (!identifierMatches || password !== adminPass) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
