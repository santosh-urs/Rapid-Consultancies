import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createResetToken } from '@/lib/resetToken';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(`forgot-password:${getClientIp(req)}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { email } = await req.json();
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { data: custMatches, error: custErr } = await supabase
      .from('customers')
      .select('email')
      .ilike('email', cleanEmail);
    if (custErr) {
      console.error('forgot-password customer lookup error:', custErr);
      return NextResponse.json({ error: 'Database lookup failed. Please try again.' }, { status: 500 });
    }

    let role: 'user' | 'staff' | null = null;
    let matchedEmail = '';

    if (custMatches && custMatches.length > 0) {
      role = 'user';
      matchedEmail = custMatches[0].email;
    } else {
      const { data: staffMatches, error: staffErr } = await supabase
        .from('staff')
        .select('email')
        .ilike('email', cleanEmail);
      if (staffErr) {
        console.error('forgot-password staff lookup error:', staffErr);
        return NextResponse.json({ error: 'Database lookup failed. Please try again.' }, { status: 500 });
      }
      if (staffMatches && staffMatches.length > 0) {
        role = 'staff';
        matchedEmail = staffMatches[0].email;
      }
    }

    if (!role) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
    }

    const token = createResetToken(matchedEmail, role);
    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
