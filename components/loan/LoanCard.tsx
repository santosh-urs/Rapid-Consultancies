'use client';

import Link from 'next/link';
import { LoanSummary } from '@/hooks/useLoans';
import { StatusBadge } from '@/components/ui/Badge';

interface LoanCardProps {
  loan: LoanSummary;
}

export function LoanCard({ loan }: LoanCardProps) {
  return (
    <Link href={`/loans/${loan.loanId}`} className="block rounded-3xl border border-[#E5E5E5] bg-white p-5 transition hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-brand">Loan ID</div>
          <div className="mt-2 text-lg font-semibold text-text">{loan.loanId}</div>
        </div>
        <StatusBadge status={loan.status === 'active' ? 'active' : loan.status} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-surface p-4">
          <div className="text-xs text-[#555555]">Outstanding</div>
          <div className="mt-2 text-lg font-semibold text-text">₹{(loan.outstanding + loan.interestDue).toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-3xl bg-surface p-4">
          <div className="text-xs text-[#555555]">Next Due</div>
          <div className="mt-2 text-lg font-semibold text-text">{loan.nextDueDate}</div>
        </div>
      </div>
      <div className="mt-4 text-sm text-[#555555]">Interest due ₹{loan.interestDue.toLocaleString('en-IN')}</div>
    </Link>
  );
}
