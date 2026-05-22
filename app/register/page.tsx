'use client';

import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 text-brand mx-auto">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Account Creation Restricted</h1>
          <p className="mt-3 text-sm text-[#555555] leading-relaxed">
            Customer accounts are created by our staff after your loan is approved.
            Please visit your nearest <strong>Rapid Consultancy</strong> branch to apply for a loan.
          </p>
          <p className="mt-2 text-sm text-[#888888]">
            Once your loan is sanctioned, you will receive your login credentials.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
