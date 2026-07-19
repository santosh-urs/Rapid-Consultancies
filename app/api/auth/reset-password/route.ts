import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyResetToken } from '@/lib/resetToken';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(`reset-password:${getClientIp(req)}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { token, password } = await req.json();
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Invalid reset request' }, { status: 400 });
    }

    const payload = verifyResetToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Reset link is invalid or has expired.' }, { status: 400 });
    }

    const table = payload.role === 'staff' ? 'staff' : 'customers';
    const { data, error } = await supabase
      .from(table)
      .update({ password })
      .ilike('email', payload.email)
      .select('email');

    if (error) {
      console.error('reset-password update error:', error);
      return NextResponse.json({ error: 'Unable to reset password. Please try again.' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
