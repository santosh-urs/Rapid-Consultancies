'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
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
      await login({ identifier, password });
      router.push('/dashboard');
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
          <div className="mb-4 text-3xl font-semibold text-text">Rapid Consultancy</div>
          <p className="text-sm text-[#555555]">Gold loan access — Musthafa Nagar, Khammam</p>
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
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-text">
              <span>Password</span>
            </div>
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
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-dark">
              Forgot Password?
            </Link>
            <Link href="/staff/login" className="text-sm font-medium text-[#555555] hover:text-text">
              Staff login
            </Link>
            <Link href="/admin/login" className="text-sm font-medium text-[#555555] hover:text-text">
              Admin login
            </Link>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Login'}
          </Button>
          <div className="border-t border-[#F0F0F0] pt-4 text-center text-sm text-[#555555]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
