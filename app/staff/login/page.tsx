'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ identifier, password, role: 'staff' });
      router.push('/staff/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-3xl font-semibold text-text">Staff Portal</div>
          <p className="text-sm text-[#555555]">Branch staff access — Rapid Consultancy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Mobile Number or Email</label>
            <Input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Enter your mobile number or email"
              type="text"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">Password</label>
            <div className="relative">
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#888888]"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Staff Login'}
          </Button>

          <div className="flex items-center justify-between text-sm text-[#555555]">
            <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
              Customer login
            </Link>
            <Link href="/admin/login" className="font-medium text-[#555555] hover:text-text">
              Admin login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
