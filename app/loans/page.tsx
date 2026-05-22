'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useLoans } from '@/hooks/useLoans';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowRight, Coins } from 'lucide-react';

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
};

export default function LoansPage() {
  const { data, isLoading } = useLoans();
  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'other'>('all');

  const filteredLoans = useMemo(() => {
    let list = data?.loans ?? [];
    if (activeTab === 'weekly') {
      list = list.filter(l => l.loanType === 'Weekly Loan');
    } else if (activeTab === 'other') {
      list = list.filter(l => l.loanType !== 'Weekly Loan');
    }
    return list;
  }, [data, activeTab]);

  const grouped = useMemo(() => {
    const active = filteredLoans.filter(l => l.status !== 'closed');
    const closed = filteredLoans.filter(l => l.status === 'closed');
    return { active, closed };
  }, [filteredLoans]);

  return (
    <CustomerLayout title="My Loans" subtitle="All your gold loan accounts">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : !data?.loans.length ? (
        <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-12 text-center">
          <Coins size={32} className="text-[#888888] mx-auto mb-3" />
          <div className="text-sm text-[#888888]">No loans found. Please visit your nearest branch.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 select-none">
            {[
              { id: 'all', label: 'All Loans' },
              { id: 'weekly', label: 'Weekly Loans' },
              { id: 'other', label: 'Gold & Other Loans' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand text-white shadow-sm font-bold scale-[1.02]'
                    : 'bg-white border border-[#E8E8E8] text-[#555555] hover:border-brand/40 hover:text-brand'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {grouped.active.length === 0 && grouped.closed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-12 text-center">
              <Coins size={28} className="text-[#888888] mx-auto mb-3 opacity-60" />
              <div className="text-sm text-[#888888]">No loans found in this category.</div>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.active.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">Active & Overdue</h2>
                  <div className="space-y-3">
                    {grouped.active.map(loan => (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.loanId}`}
                        className="flex items-center justify-between rounded-2xl border border-[#E8E8E8] bg-white p-5 hover:shadow-sm hover:border-brand/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <Coins size={18} className="text-brand" />
                          </div>
                          <div>
                            <div className="font-bold text-text font-mono flex items-center gap-2">
                              {loan.loanId}
                              {loan.loanType && (
                                <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                                  {loan.loanType}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#888888] mt-0.5">
                              ₹{(loan.outstanding + loan.interestDue).toLocaleString('en-IN')} outstanding · Due {loan.nextDueDate || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[loan.status]}`}>
                            {loan.status}
                          </span>
                          <ArrowRight size={16} className="text-[#888888] group-hover:text-brand transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {grouped.closed.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">Closed Loans</h2>
                  <div className="space-y-3">
                    {grouped.closed.map(loan => (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.loanId}`}
                        className="flex items-center justify-between rounded-2xl border border-[#E8E8E8] bg-white p-5 hover:shadow-sm transition-all group opacity-70"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Coins size={18} className="text-gray-400" />
                          </div>
                          <div>
                            <div className="font-bold text-text font-mono flex items-center gap-2">
                              {loan.loanId}
                              {loan.loanType && (
                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                                  {loan.loanType}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#888888] mt-0.5">Fully repaid · Started {loan.startDate}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500">Closed</span>
                          <ArrowRight size={16} className="text-[#888888] group-hover:text-text transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  );
}
