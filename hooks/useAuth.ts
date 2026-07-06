'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
const authCookieName = 'auth_token';
const authRoleCookieName = 'auth_role';
const authTokenValue = 'goldsecure-token';
const adminAuthTokenValue = 'goldsecure-admin-token';
const staffAuthTokenValue = 'goldsecure-staff-token';

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : null;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${authCookieName}=`))
    ?.split('=')[1] ?? null;
}

function getAuthRole(): AuthRole | null {
  if (typeof window === 'undefined') return null;
  const role = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${authRoleCookieName}=`))
    ?.split('=')[1];

  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'staff';
  if (role === 'user') return 'user';
  return null;
}

function setAuthToken(value: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${authCookieName}=${value}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict`;
}

function setAuthRole(role: AuthRole) {
  if (typeof window === 'undefined') return;
  document.cookie = `${authRoleCookieName}=${role}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict`;
}

function removeAuthToken() {
  if (typeof window === 'undefined') return;
  document.cookie = `${authCookieName}=; path=/; max-age=0`;
  document.cookie = `${authRoleCookieName}=; path=/; max-age=0`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      return;
    }

    const token = getAuthToken();
    const role = getAuthRole();

    if (token && role === 'admin') {
      setUser({ id: 'admin-001', name: 'Naveen — Rapid Consultancy', mobile: '7670870964', role: 'admin' });
    } else if (token && role === 'staff') {
      // staff user should be in localStorage; if not, clear token
      removeAuthToken();
    } else if (token) {
      removeAuthToken();
    }
  }, []);

  const login = async ({ identifier, password, role = 'user' }: LoginCredentials) => {
    await new Promise((resolve) => setTimeout(resolve, 450));

    if (!identifier || !password) {
      throw new Error('Invalid credentials');
    }

    let authenticatedUser: User;

    if (role === 'admin') {
      const verifyRes = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (!verifyRes.ok) {
        throw new Error('Invalid admin credentials');
      }
      authenticatedUser = {
        id: 'admin-001',
        name: 'Naveen — Rapid Consultancy',
        mobile: '7670870964',
        role: 'admin',
      };
    } else if (role === 'staff') {
      const { data, error } = await supabase.rpc('verify_staff_login', {
        p_identifier: identifier,
        p_password: password,
      });

      if (error) {
        console.error('Staff login RPC error:', error);
        throw new Error('Database connection failed. Please try again.');
      }

      if (data?.status === 'not_found') throw new Error('Staff member not found');
      if (data?.status !== 'ok') throw new Error('Invalid password');

      authenticatedUser = {
        id: data.id,
        name: data.name,
        mobile: data.mobile,
        role: 'staff',
        branch: data.branch,
      };
    } else {
      const { data, error } = await supabase.rpc('verify_customer_login', {
        p_identifier: identifier,
        p_password: password,
      });

      if (error) {
        console.error('Customer login RPC error:', error);
        throw new Error('Database connection failed. Please try again.');
      }

      if (data?.status === 'not_found') throw new Error('Account not found');
      if (data?.status === 'deleted') throw new Error('This account has been deleted.');
      if (data?.status !== 'ok') throw new Error('Invalid password');

      authenticatedUser = {
        id: data.id,
        name: data.name,
        mobile: data.mobile,
        role: 'user',
      };
    }

    setUser(authenticatedUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(authenticatedUser));
      if (role === 'admin') {
        setAuthToken(adminAuthTokenValue);
      } else if (role === 'staff') {
        setAuthToken(staffAuthTokenValue);
      } else {
        setAuthToken(authTokenValue);
      }
      setAuthRole(role);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
      removeAuthToken();
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
