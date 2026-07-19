import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface AuthedUser {
  id: string;
  name: string;
  mobile: string;
  role: 'user' | 'staff' | 'admin';
  branch?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(`login:${getClientIp(req)}`, 8, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { identifier, password, role = 'user' } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    let user: AuthedUser;

    if (role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPhone = process.env.ADMIN_PHONE;
      const adminPass = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPass) {
        return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 });
      }

      const idClean = String(identifier).trim().toLowerCase().replace(/\D/g, '');
      const phoneClean = (adminPhone ?? '').replace(/\D/g, '');
      const identifierMatches =
        String(identifier).trim().toLowerCase() === adminEmail.toLowerCase() || idClean === phoneClean;

      if (!identifierMatches || password !== adminPass) {
        return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
      }

      user = { id: 'admin-001', name: 'Naveen — Rapid Consultancy', mobile: '7670870964', role: 'admin' };
    } else if (role === 'staff') {
      const { data, error } = await supabase.rpc('verify_staff_login', {
        p_identifier: identifier,
        p_password: password,
      });

      if (error) {
        console.error('Staff login RPC error:', error);
        return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 });
      }
      if (data?.status === 'not_found') {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }
      if (data?.status !== 'ok') {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      user = { id: data.id, name: data.name, mobile: data.mobile, role: 'staff', branch: data.branch };
    } else {
      const { data, error } = await supabase.rpc('verify_customer_login', {
        p_identifier: identifier,
        p_password: password,
      });

      if (error) {
        console.error('Customer login RPC error:', error);
        return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 });
      }
      if (data?.status === 'not_found') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      if (data?.status === 'deleted') {
        return NextResponse.json({ error: 'This account has been deleted.' }, { status: 403 });
      }
      if (data?.status !== 'ok') {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      user = { id: data.id, name: data.name, mobile: data.mobile, role: 'user' };
    }

    const token = await createSessionToken(user.id, user.role);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
