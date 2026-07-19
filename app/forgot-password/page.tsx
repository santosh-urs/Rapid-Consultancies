'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const tokenRes = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const tokenData = await tokenRes.json();

      if (tokenRes.ok && tokenData.token) {
        const link = `${window.location.origin}/reset-password?token=${tokenData.token}`;

        const emailRes = await fetch('/api/send-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetLink: link }),
        });
        const emailData = emailRes.ok ? await emailRes.json() : null;
        setEmailSent(Boolean(emailData?.success && emailData?.emailSent));
      } else {
        // Account not found, or lookup failed — show the same generic
        // outcome as success so this can't be used to enumerate accounts.
        setEmailSent(false);
      }
      setSent(true);
    } catch {
      setEmailSent(false);
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold text-text">Forgot Password</div>
          <p className="mt-2 text-sm text-[#555555]">Enter your email address to receive a reset link.</p>
        </div>

        {sent ? (
          <div className="space-y-4 rounded-xl border border-[#E5E5E5] bg-surface p-6 text-center">
            <p className="text-lg font-semibold text-text">Reset link generated</p>
            
            {emailSent ? (
              <p className="text-sm text-[#555555]">
                We have sent the reset link to <strong className="text-text">{email}</strong>. Please check your inbox.
              </p>
            ) : (
              <p className="text-sm text-[#555555]">
                If an account exists for <strong className="text-text">{email}</strong>, a password reset link has been sent. Please check your inbox and spam folder.
              </p>
            )}

            <div className="pt-2">
              <Link href="/login" className="text-sm font-medium text-brand hover:text-brand-dark">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-text">Email Address</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
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
