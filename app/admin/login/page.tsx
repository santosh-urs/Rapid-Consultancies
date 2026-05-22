'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ identifier: username, password, role: 'admin' });
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Invalid admin username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-3xl font-semibold text-text">Admin Portal</div>
          <p className="text-sm text-[#555555]">Sign in to manage customers, loans, and access requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Email or Mobile Number</label>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Email or mobile number"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">Password</label>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Admin login'}
          </Button>

          <div className="text-center text-sm text-[#555555]">
            <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
              Return to customer login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
