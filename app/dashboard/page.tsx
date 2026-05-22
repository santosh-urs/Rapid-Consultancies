'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLoans } from '@/hooks/useLoans';
import { useAuth } from '@/hooks/useAuth';
import {
  parseDateUTC,
  addDaysUTC,
  addMonthsUTC,
  formatISODateOnly,
} from '@/lib/loanUtils';
import {
  Coins,
  TrendingDown,
  AlertCircle,
  Calendar,
  ArrowRight,
  Landmark,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700 animate-pulse',
  closed: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
};

// Build monthly/weekly payment schedule from loan start date + tenure
function buildSchedule(
  startDate: string,
  tenureMonths: number,
  principal: number,
  interestRate: number,
  loanType: string,
  outstanding: number
) {
  if (!startDate || tenureMonths <= 0) return [];

  const start = parseDateUTC(startDate);
  const schedule: {
    month: number;
    date: string;
    dateLabel: string;
    interestAmt: number;
    principalAmt: number;
    totalAmt: number;
  }[] = [];

  if (loanType === 'Weekly Loan') {
    const flatInterest = Math.round(principal * (interestRate / 100));
    const weeklyInterest = Math.round(flatInterest / 4);
    const weeklyPrincipal = Math.round(principal / 4);
    const weeklyTotal = Math.round((principal + flatInterest) / 4);
    for (let i = 1; i <= 4; i++) {
      const d = addDaysUTC(start, 7 * i);
      const dateStr = formatISODateOnly(d);
      const dateLabel = d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
      schedule.push({
        month: i,
        date: dateStr,
        dateLabel,
        interestAmt: weeklyInterest,
        principalAmt: weeklyPrincipal,
        totalAmt: weeklyTotal,
      });
    }
  } else if (loanType === 'Gold Loan') {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyInterest = Math.round(principal * monthlyRate);
    for (let i = 1; i <= tenureMonths; i++) {
      const d = addMonthsUTC(start, i);
      const dateStr = formatISODateOnly(d);
      const dateLabel = d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
      const isLast = i === tenureMonths;
      schedule.push({
        month: i,
        date: dateStr,
        dateLabel,
        interestAmt: monthlyInterest,
        principalAmt: isLast ? outstanding : 0,
        totalAmt: isLast ? monthlyInterest + outstanding : monthlyInterest,
      });
    }
  } else {
    const monthlyRate = interestRate / 100 / 12;
    const interestAmt = Math.round(principal * monthlyRate);
    const principalAmt = Math.round(principal / tenureMonths);
    const emi = interestAmt + principalAmt;
    for (let i = 1; i <= tenureMonths; i++) {
      const d = addMonthsUTC(start, i);
      const dateStr = formatISODateOnly(d);
      const dateLabel = d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
      schedule.push({
        month: i,
        date: dateStr,
        dateLabel,
        interestAmt,
        principalAmt,
        totalAmt: emi,
      });
    }
  }
  return schedule;
}

function PaymentSchedule({ loan }: { loan: any }) {
  const [expanded, setExpanded] = useState(false);
  const schedule = useMemo(
    () => buildSchedule(loan.startDate, loan.tenureMonths, loan.principal, loan.interestRate, loan.loanType, loan.outstanding),
    [loan]
  );
  if (!schedule.length) return null;

  // A month is CLEARED if its due date is strictly before the next_due_date stored in the DB.
  // This is set by staff when they click "Mark Cleared" — it advances the nextDueDate forward.
  const nextDue = loan.nextDueDate ? parseDateUTC(loan.nextDueDate) : null;

  const totalInterestPayable = schedule.reduce((s, r) => s + r.interestAmt, 0);
  const visible = expanded ? schedule : schedule.slice(0, 3);

  return (
    <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#888888]">Payment Schedule</span>
          <span className="ml-2 text-xs text-[#888888]">({loan.loanType === 'Weekly Loan' ? '4 weeks' : `${loan.tenureMonths} instalments`} · Total interest ₹{totalInterestPayable.toLocaleString('en-IN')})</span>
        </div>
        <button
          onClick={e => { e.preventDefault(); setExpanded(v => !v); }}
          className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
        >
          {expanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View all</>}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#F0F0F0]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F7F7F8] border-b border-[#F0F0F0]">
              <th className="px-3 py-2 text-left font-semibold text-[#888888]">{loan.loanType === 'Weekly Loan' ? 'Week' : 'Month'}</th>
              <th className="px-3 py-2 text-left font-semibold text-[#888888]">Due Date</th>
              <th className="px-3 py-2 text-right font-semibold text-[#888888]">Interest</th>
              {loan.loanType !== 'Gold Loan' && <th className="px-3 py-2 text-right font-semibold text-[#888888]">Principal</th>}
              <th className="px-3 py-2 text-right font-semibold text-[#888888]">Total Due</th>
              <th className="px-3 py-2 text-center font-semibold text-[#888888]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {visible.map(row => {
              const dueDate = parseDateUTC(row.date);
              // Cleared = this month's date is before the nextDueDate (staff advanced it after clearing)
              const isCleared = nextDue ? dueDate < nextDue : false;
              const isNext = loan.nextDueDate === row.date;
              return (
                <tr key={row.month} className={`${isCleared ? 'bg-emerald-50/60' : isNext ? 'bg-amber-50/60' : 'bg-white'} hover:bg-[#F7F7F8]`}>
                  <td className="px-3 py-2 text-[#555555] font-medium">{row.month}</td>
                  <td className="px-3 py-2 font-semibold text-text">
                    {row.dateLabel}
                    {isNext && <span className="ml-1 text-[9px] bg-brand text-white rounded-full px-1.5 py-0.5">Next</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-600 font-semibold">₹{row.interestAmt.toLocaleString('en-IN')}</td>
                  {loan.loanType !== 'Gold Loan' && (
                    <td className="px-3 py-2 text-right text-blue-600 font-semibold">₹{row.principalAmt.toLocaleString('en-IN')}</td>
                  )}
                  <td className="px-3 py-2 text-right font-bold text-text">₹{row.totalAmt.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-center">
                    {isCleared ? (
                      <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">✓ Cleared</span>
                    ) : isNext ? (
                      <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">Upcoming</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#F0F0F0] text-[#888888] px-2 py-0.5 text-[10px] font-semibold">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!expanded && schedule.length > 3 && (
        <button
          onClick={e => { e.preventDefault(); setExpanded(true); }}
          className="mt-2 text-xs text-brand hover:underline font-medium w-full text-center"
        >
          + {schedule.length - 3} more months
        </button>
      )}
    </div>
  );
}


export default function DashboardPage() {
  const { data, isLoading } = useLoans();
  const { user } = useAuth();

  const activeLoans = useMemo(() => data?.loans.filter(l => l.status !== 'closed') ?? [], [data]);

  const nearestDue = useMemo(() => {
    const dates = activeLoans
      .filter(l => l.nextDueDate)
      .map(l => parseDateUTC(l.nextDueDate));
    if (!dates.length) return 'N/A';
    return dates.sort((a, b) => +a - +b)[0].toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
  }, [activeLoans]);

  const totalOutstanding = useMemo(() => activeLoans.reduce((s, l) => s + (l.outstanding + l.interestDue), 0), [activeLoans]);
  const totalPrincipalRemaining = useMemo(() => activeLoans.reduce((s, l) => s + l.outstanding, 0), [activeLoans]);
  const totalInterest = useMemo(() => activeLoans.reduce((s, l) => s + l.interestDue, 0), [activeLoans]);

  return (
    <CustomerLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Customer'}`}
      subtitle="Here is your complete loan overview"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-brand">
                <Coins size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Active Loans</span>
              </div>
              <div className="text-3xl font-bold text-text">{activeLoans.length}</div>
              <div className="text-xs text-[#888888]">{data?.loans.length ?? 0} total accounts</div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-rose-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Total Outstanding</span>
              </div>
              <div className="text-3xl font-bold text-text">₹{totalOutstanding.toLocaleString('en-IN')}</div>
              <div className="text-xs text-[#888888]">Principal: ₹{totalPrincipalRemaining.toLocaleString('en-IN')} · Interest: ₹{totalInterest.toLocaleString('en-IN')}</div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Interest Due</span>
              </div>
              <div className="text-3xl font-bold text-text">₹{totalInterest.toLocaleString('en-IN')}</div>
              <div className="text-xs text-[#888888]">Accrued interest</div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Nearest Due</span>
              </div>
              <div className="text-2xl font-bold text-text">{nearestDue}</div>
              <div className="text-xs text-[#888888]">Next payment date</div>
            </div>
          </>
        )}
      </div>

      {/* Active Loans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-text">Active Loans</h2>
            <p className="text-xs text-[#888888] mt-0.5">Your repayment schedule with monthly due dates and amounts</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : activeLoans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-10 text-center text-sm text-[#888888]">
            No active loans found. Please visit your nearest branch.
          </div>
        ) : (
          <div className="space-y-6">
            {activeLoans.map(loan => (
              <div
                key={loan.id}
                className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-[#888888] uppercase tracking-wider mb-1">Loan ID</div>
                    <div className="text-xl font-bold text-text font-mono">{loan.loanId}</div>
                    {loan.loanType && (
                      <span className="inline-flex mt-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                        {loan.loanType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle[loan.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {loan.status}
                    </span>
                    <Link href={`/loans/${loan.loanId}`} className="text-brand hover:opacity-70">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-xl bg-[#F7F7F8] p-3">
                    <div className="text-xs text-[#888888] mb-1">Total Outstanding</div>
                    <div className="text-base font-bold text-text">₹{(loan.outstanding + loan.interestDue).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-xl bg-[#F7F7F8] p-3">
                    <div className="text-xs text-[#888888] mb-1">Principal Balance</div>
                    <div className="text-base font-semibold text-text">₹{loan.outstanding.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-xl bg-[#F7F7F8] p-3">
                    <div className="text-xs text-[#888888] mb-1">Interest Due</div>
                    <div className="text-base font-bold text-rose-600">₹{loan.interestDue.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-xl bg-[#F7F7F8] p-3">
                    <div className="text-xs text-[#888888] mb-1">Next Due</div>
                    <div className="text-base font-semibold text-text">{loan.nextDueDate ? parseDateUTC(loan.nextDueDate).toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#555555] pb-2">
                  {loan.loanType === 'Gold Loan' && loan.goldWeight > 0 && (
                    <span>Gold: <strong className="text-text">{loan.goldWeight}g · {loan.goldPurity}K</strong></span>
                  )}
                  <span>Rate: <strong className="text-text">{loan.interestRate}%{loan.loanType === 'Weekly Loan' ? ' Flat' : ' p.a.'}</strong></span>
                  <span>Tenure: <strong className="text-text">{loan.loanType === 'Weekly Loan' ? '1 month (4 weeks)' : `${loan.tenureMonths} months`}</strong></span>
                  <span>Start: <strong className="text-text">{loan.startDate}</strong></span>
                  <span>Maturity: <strong className="text-text">{loan.maturityDate}</strong></span>
                </div>

                {/* Payment Schedule */}
                <PaymentSchedule loan={loan} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branch Details */}
      <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={18} className="text-brand" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Branch Details</span>
        </div>
        <div className="text-lg font-bold text-text mb-1">{data?.branch ?? 'Musthafa Nagar Branch'}</div>
        <p className="text-sm text-[#555555] mb-4">Visit us for document verification, renewal, or customer support.</p>
        <div className="space-y-2 text-sm text-[#555555]">
          <div className="flex items-center gap-2"><MapPin size={14} className="text-brand shrink-0" /> Musthafa Nagar, Khammam</div>
          <div className="flex items-center gap-2"><Phone size={14} className="text-brand shrink-0" /> 9502453969</div>
          <div className="flex items-center gap-2"><Clock size={14} className="text-brand shrink-0" /> Mon–Sat, 9:00 AM – 6:00 PM</div>
        </div>
      </div>
    </CustomerLayout>
  );
}
