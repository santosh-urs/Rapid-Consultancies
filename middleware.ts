import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

const protectedRoutes = ['/dashboard', '/profile', '/loans', '/loan-products'];
const adminRoutes = ['/admin'];
const staffRoutes = ['/staff/dashboard'];

export async function middleware(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const role = session?.role ?? null;
  const pathname = req.nextUrl.pathname;

  // Admin routes
  if (pathname !== '/admin/login' && adminRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Staff routes
  if (staffRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 'staff') {
      const url = req.nextUrl.clone();
      url.pathname = '/staff/login';
      return NextResponse.redirect(url);
    }
  }

  // Customer routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!role) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (role === 'staff') {
      const url = req.nextUrl.clone();
      url.pathname = '/staff/dashboard';
      return NextResponse.redirect(url);
    }
    if (role === 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Root path: always show landing page (no redirect)

  if (pathname === '/login' && role) {
    const url = req.nextUrl.clone();
    if (role === 'admin') {
      url.pathname = '/admin/dashboard';
    } else if (role === 'staff') {
      url.pathname = '/staff/dashboard';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  if (pathname === '/staff/login' && role === 'staff') {
    const url = req.nextUrl.clone();
    url.pathname = '/staff/dashboard';
    return NextResponse.redirect(url);
  }

  if (pathname === '/admin/login' && role === 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/login',
    '/staff/login',
    '/forgot-password',
    '/reset-password',
    '/dashboard/:path*',
    '/loans/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/staff/:path*',
    '/loan-products/:path*',
    '/loan-products',
  ],
};
