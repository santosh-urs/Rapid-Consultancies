'use client';

import { useEffect, useMemo, useState } from 'react';

type AuthRole = 'user' | 'admin' | 'staff';

interface LoginCredentials {
  identifier: string;
  password: string;
  role?: AuthRole;
}

interface PasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  mobile: string;
  role: AuthRole;
  branch?: string;
}

const storageKey = 'goldsecure-user';

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  // Belt-and-suspenders bfcache guard: `Cache-Control: no-store` on the
  // gated pages (next.config.mjs) is the primary fix, but if a browser ever
  // restores this page from the back/forward cache anyway (event.persisted),
  // force a real reload so middleware re-checks the session instead of
  // showing whatever was on screen right before logout.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const login = async ({ identifier, password, role = 'user' }: LoginCredentials) => {
    if (!identifier || !password) {
      throw new Error('Invalid credentials');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    setUser(data.user);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(data.user));
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // best-effort — the signed cookie also expires on its own
    }
  };

  const forgotPassword = async ({ email }: PasswordResetRequest) => {
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to process reset request.');
    }

    return { success: true, token: data.token };
  };

  const resetPassword = async ({ token, password }: ResetPasswordRequest) => {
    if (!token || password.length < 8) {
      throw new Error('Invalid reset request');
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid or expired reset link');
    }

    return true;
  };

  return useMemo(
    () => ({ user, login, logout, forgotPassword, resetPassword }),
    [user]
  );
}
