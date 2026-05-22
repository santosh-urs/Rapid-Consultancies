'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { z } from 'zod';

const passwordSchema = z.string().min(8);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get('token') ?? '');
    }
  }, []);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rules = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }), [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!passwordSchema.safeParse(password).success || Object.values(rules).includes(false)) {
      setError('Password must meet all requirements.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError('Unable to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold text-text">Reset Password</div>
          <p className="mt-2 text-sm text-[#555555]">Create a new password for your account.</p>
        </div>

        {success ? (
          <div className="space-y-4 rounded-xl border border-[#E5E5E5] bg-surface p-6 text-center">
            <p className="text-lg font-semibold text-text">Password updated</p>
            <p className="text-sm text-[#555555]">You will be redirected to login shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-text">New Password</label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text">Confirm Password</label>
              <Input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <div className="space-y-2 rounded-xl border border-[#E5E5E5] bg-surface p-4 text-sm text-[#555555]">
              <p className="font-semibold text-text">Password must contain:</p>
              <div className="grid gap-2 text-xs">
                <span className={rules.length ? 'text-green-600' : 'text-[#888888]'}>• At least 8 characters</span>
                <span className={rules.uppercase ? 'text-green-600' : 'text-[#888888]'}>• One uppercase letter</span>
                <span className={rules.number ? 'text-green-600' : 'text-[#888888]'}>• One number</span>
                <span className={rules.special ? 'text-green-600' : 'text-[#888888]'}>• One special character</span>
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
            <div className="text-center text-sm text-[#555555]">
              <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
