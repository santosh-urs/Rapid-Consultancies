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

    const isEmail = identifier.includes('@');
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
      const inputClean = identifier.replace(/\D/g, '');
      const query = supabase.from('staff').select('*').eq('is_active', true);
      const { data: staffRows, error } = isEmail
        ? await query.ilike('email', identifier.trim())
        : await query.ilike('mobile', `%${inputClean}`);

      if (error) {
        console.error('Supabase staff lookup error:', error);
        throw new Error('Database connection failed. Please try again.');
      }

      const staffMember = staffRows?.[0] ?? null;

      if (!staffMember) {
        throw new Error('Staff member not found');
      }

      if (staffMember.password !== password) {
        throw new Error('Invalid password');
      }

      authenticatedUser = {
        id: staffMember.id,
        name: staffMember.name,
        mobile: staffMember.mobile,
        role: 'staff',
        branch: staffMember.branch,
      };
    } else {
      const inputClean = identifier.replace(/\D/g, '');
      const custQuery = supabase.from('customers').select('*');
      const { data: matches, error } = isEmail
        ? await custQuery.ilike('email', identifier.trim())
        : await custQuery.ilike('mobile', `%${inputClean}`);

      if (error) {
        console.error('Supabase customer lookup error:', error);
        throw new Error('Database connection failed. Please try again.');
      }

      if (!matches || matches.length === 0) {
        throw new Error('Account not found');
      }

      const customer = matches.find((c: any) => c.password && c.password === password);

      if (customer && customer.password && customer.password.startsWith('DELETED_')) {
        throw new Error('This account has been deleted.');
      }

      if (!customer) {
        const deletedCust = matches.find((c: any) => c.password && c.password.startsWith('DELETED_') && c.password.substring(8) === password);
        if (deletedCust) {
          throw new Error('This account has been deleted.');
        }
        throw new Error('Invalid password');
      }

      authenticatedUser = {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
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
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }

    const { data: custMatches, error: custErr } = await supabase
      .from('customers')
      .select('email, id')
      .ilike('email', email.trim());

    if (custErr) {
      console.error('Customer lookup error:', custErr);
      throw new Error('Database lookup failed. Please try again.');
    }

    let role: AuthRole = 'user';
    let matchedEmail = '';

    if (custMatches && custMatches.length > 0) {
      role = 'user';
      matchedEmail = custMatches[0].email;
    } else {
      const { data: staffMatches, error: staffErr } = await supabase
        .from('staff')
        .select('email, id')
        .ilike('email', email.trim());

      if (staffErr) {
        console.error('Staff lookup error:', staffErr);
        throw new Error('Database lookup failed. Please try again.');
      }

      if (staffMatches && staffMatches.length > 0) {
        role = 'staff';
        matchedEmail = staffMatches[0].email;
      } else {
        throw new Error('No account found with this email address.');
      }
    }

    const payload = {
      email: matchedEmail,
      role,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    const token = btoa(JSON.stringify(payload));
    return { success: true, token };
  };

  const resetPassword = async ({ token, password }: ResetPasswordRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!token || password.length < 8) {
      throw new Error('Invalid reset request');
    }

    try {
      const payload = JSON.parse(atob(token));
      const { email, role, expires } = payload;
      if (!email || !role || !expires) {
        throw new Error('Invalid reset token format');
      }
      if (Date.now() > expires) {
        throw new Error('Reset link has expired');
      }

      if (role === 'staff') {
        const { error } = await supabase
          .from('staff')
          .update({ password })
          .ilike('email', email);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .update({ password })
          .ilike('email', email);
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw new Error(err.message || 'Invalid or expired reset link');
    }
  };

  return useMemo(
    () => ({ user, login, logout, forgotPassword, resetPassword }),
    [user]
  );
}
