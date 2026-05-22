import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/loans', '/loan-products'];
const adminRoutes = ['/admin'];
const staffRoutes = ['/staff/dashboard'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const role = req.cookies.get('auth_role')?.value;
  const pathname = req.nextUrl.pathname;

  // Admin routes
  if (pathname !== '/admin/login' && adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!(token && role === 'admin')) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Staff routes
  if (staffRoutes.some((route) => pathname.startsWith(route))) {
    if (!(token && role === 'staff')) {
      const url = req.nextUrl.clone();
      url.pathname = '/staff/login';
      return NextResponse.redirect(url);
    }
  }

  // Customer routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
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

  if (pathname === '/login' && token) {
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

  if (pathname === '/staff/login' && token && role === 'staff') {
    const url = req.nextUrl.clone();
    url.pathname = '/staff/dashboard';
    return NextResponse.redirect(url);
  }

  if (pathname === '/admin/login' && token && role === 'admin') {
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
