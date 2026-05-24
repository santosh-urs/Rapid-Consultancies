'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useLoanDetail } from '@/hooks/useLoans';
import { Skeleton } from '@/components/ui/Skeleton';
import { parseDateUTC } from '@/lib/loanUtils';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Coins,
  Calendar,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Landmark,
  CreditCard,
  Receipt,
} from 'lucide-react';

const statusStyle: Record<string, { cls: string; label: string }> = {
  active: { cls: 'bg-emerald-100 text-emerald-700', label: 'Active' },
  overdue: { cls: 'bg-red-100 text-red-700', label: 'Overdue' },
  closed: { cls: 'bg-gray-100 text-gray-500', label: 'Closed' },
  pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = Array.isArray(params?.id) ? params.id[0] ?? '' : params?.id ?? '';
  const { data, isLoading } = useLoanDetail(loanId);

  const totalPayable = useMemo(() => (data ? data.outstanding + data.interestDue : 0), [data]);
  const paidAmount = useMemo(() => (data ? data.principal - data.outstanding : 0), [data]);
  const progressPct = useMemo(() => {
    if (!data || data.principal === 0) return 0;
    return Math.min(100, Math.round((paidAmount / data.principal) * 100));
  }, [data, paidAmount]);

  const status = data?.status ?? 'active';
  const badge = statusStyle[status] ?? statusStyle.active;

  return (
    <CustomerLayout title="Loan Details" subtitle={loanId}>
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-sm text-brand font-medium mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-12 text-center text-sm text-[#888888]">
          Loan not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs text-[#888888] uppercase tracking-wider mb-1">Loan ID</div>
                <div className="text-2xl font-bold text-text font-mono">{data.loanId}</div>
              </div>
              <span className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-2 flex items-center justify-between text-xs text-[#888888]">
              <span>Repayment Progress</span>
              <span className="font-semibold text-text">{progressPct}% paid</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Core details grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Principal Amount', value: `₹${data.principal.toLocaleString('en-IN')}`, icon: Coins, color: 'text-brand' },
                { label: 'Outstanding Balance', value: `₹${(data.outstanding + data.interestDue).toLocaleString('en-IN')}`, icon: TrendingDown, color: 'text-rose-500' },
                { label: 'Interest Due', value: `₹${data.interestDue.toLocaleString('en-IN')}`, icon: AlertTriangle, color: 'text-amber-500' },
                { label: 'Interest Rate', value: `${data.interestRate}%${data.loanType === 'Weekly Loan' ? ' Flat' : ' p.a.'}`, icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Start Date', value: data.startDate, icon: Calendar, color: 'text-blue-500' },
                { label: 'Maturity Date', value: data.maturityDate, icon: Clock, color: 'text-purple-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-[#F7F7F8] p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon size={13} className={color} />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#888888]">{label}</div>
                  </div>
                  <div className="text-base font-bold text-text">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Details */}
          {data.loanType !== 'Weekly Loan' && data.goldWeight > 0 && (
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-brand" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Gold Collateral</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Gold Weight', value: `${data.goldWeight} grams` },
                  { label: 'Gold Purity', value: `${data.goldPurity} Karat` },
                  { label: 'Estimated Value', value: `₹${data.estimatedGoldValue.toLocaleString('en-IN')}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">{label}</div>
                    <div className="text-sm font-bold text-text">{value}</div>
                  </div>
                ))}
              </div>
              {data.goldImageUrl && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#888888] mb-2">Gold Photo</div>
                  <img
                    src={data.goldImageUrl}
                    alt="Gold collateral"
                    className="w-full max-h-72 object-cover rounded-xl border border-amber-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Payment Section */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Payment</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-[#F7F7F8] p-4">
                <div className="text-xs text-[#888888] mb-1">Principal Balance</div>
                <div className="text-lg font-bold text-text">₹{data.outstanding.toLocaleString('en-IN')}</div>
              </div>
              <div className="rounded-xl bg-[#F7F7F8] p-4">
                <div className="text-xs text-[#888888] mb-1">Interest Due</div>
                <div className="text-lg font-bold text-rose-600">₹{data.interestDue.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="rounded-xl bg-[#F7F7F8] p-4 flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-text">Total Payable</span>
              <span className="text-xl font-bold text-text">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-800">Online payment currently unavailable</div>
                <div className="text-xs text-amber-700 mt-0.5">Please visit your nearest branch to make a payment.</div>
              </div>
            </div>
          </div>

          {/* Penalties & Adjustments */}
          {data.penalties && data.penalties.length > 0 && (
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt size={16} className="text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Penalties & Adjustments</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E8E8]">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Date</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Description</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Reason</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Amount</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {data.penalties.map((p, i) => {
                      const diff = p.newOutstanding - p.currentOutstanding;
                      const isPenalty = diff > 0;
                      const diffStr = (isPenalty ? '+' : '') + `₹${diff.toLocaleString('en-IN')}`;
                      const dateStr = p.reviewedAt || p.requestedAt;
                      return (
                        <tr key={p.id || i} className="hover:bg-[#F9F9F9]">
                          <td className="py-3 text-[#555555]">
                            {dateStr ? parseDateUTC(dateStr).toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isPenalty ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isPenalty ? 'Outstanding Penalty' : 'Outstanding Waiver'}
                            </span>
                          </td>
                          <td className="py-3 text-[#555555] max-w-xs truncate" title={p.reason}>
                            {p.reason}
                          </td>
                          <td className={`py-3 font-semibold ${isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {diffStr}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
                              Applied
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Repayment History */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Repayment History</span>
            </div>
            {data.repaymentHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E8E8E8] bg-[#F7F7F8] p-8 text-center text-sm text-[#888888]">
                No repayments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E8E8]">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Date</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Amount</th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {data.repaymentHistory.map((row, i) => (
                      <tr key={i} className="hover:bg-[#F9F9F9]">
                        <td className="py-3 text-[#555555]">
                          {row.date ? parseDateUTC(row.date).toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 font-semibold text-text">₹{row.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (row as any).type === 'principal'
                              ? 'bg-blue-100 text-blue-700'
                              : (row as any).type === 'mixed'
                              ? 'bg-purple-100 text-purple-700'
                              : row.status.toLowerCase().includes('clear') || row.status.toLowerCase().includes('paid') || row.status.toLowerCase().includes('closed')
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Branch Info */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Branch</span>
            </div>
            <div className="font-semibold text-text mb-3">{data.branch ?? 'Musthafa Nagar Branch'}</div>
            <div className="space-y-1.5 text-sm text-[#555555]">
              <div className="flex items-center gap-2"><MapPin size={13} className="text-brand" /> Musthafa Nagar, Khammam</div>
              <div className="flex items-center gap-2"><Phone size={13} className="text-brand" /> 9502453969</div>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
