'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  calculateDynamicInterest,
  getTotalInterestDue,
  parseDateUTC,
  addDaysUTC,
  addMonthsUTC,
  formatISODateOnly,
  inferTenureMonths,
  type MonthAdjustment,
} from '@/lib/loanUtils';

// Groups loan_interest_adjustments rows (per-month staff charges) by loan id.
async function fetchMonthAdjustmentsByLoan(loanDbIds: string[]): Promise<Record<string, MonthAdjustment[]>> {
  if (loanDbIds.length === 0) return {};
  const { data, error } = await supabase
    .from('loan_interest_adjustments')
    .select('loan_id,due_date,amount,reason')
    .in('loan_id', loanDbIds);
  if (error || !data) return {};
  const grouped: Record<string, MonthAdjustment[]> = {};
  for (const row of data as any[]) {
    (grouped[row.loan_id] ||= []).push(row);
  }
  return grouped;
}

export interface LoanSummary {
  id: string;
  loanId: string;
  status: 'active' | 'pending' | 'closed';
  principal: number;
  outstanding: number;
  interestDue: number;
  interestRate: number;
  nextDueDate: string;
  startDate: string;
  maturityDate: string;
  goldWeight: number;
  goldPurity: number;
  estimatedGoldValue: number;
  goldImageUrl?: string;
  loanType: string;
  tenureMonths: number;
}

interface LoanDetail extends LoanSummary {
  branch: string;
  repaymentHistory: Array<{ date: string; amount: number; status: string; type?: string }>;
  penalties?: Array<{
    id: string;
    currentOutstanding: number;
    newOutstanding: number;
    reason: string;
    requestedBy: string;
    requestedAt: string;
    status: string;
    reviewedBy?: string;
    reviewedAt?: string;
    adminNotes?: string;
  }>;
}


function generateRepaymentHistory(loan: {
  startDate: string;
  nextDueDate: string;
  maturityDate: string;
  principal: number;
  outstanding: number;
  interestRate: number;
  tenureMonths: number;
  loanType: string;
  status: string;
}) {
  if (!loan.startDate || loan.tenureMonths <= 0) return [];
  const start = parseDateUTC(loan.startDate);
  const nextDue = loan.nextDueDate ? parseDateUTC(loan.nextDueDate) : null;
  const history: { date: string; amount: number; status: string }[] = [];

  if (loan.loanType === 'Weekly Loan') {
    const flatInterest = Math.round(loan.principal * (loan.interestRate / 100));
    const weeklyInterest = Math.round(flatInterest / 4);
    const weeklyPrincipal = Math.round(loan.principal / 4);
    const weeklyTotal = Math.round((loan.principal + flatInterest) / 4);
    for (let i = 1; i <= 4; i++) {
      const d = addDaysUTC(start, 7 * i);
      const isCleared = loan.status === 'closed' || (nextDue ? d < nextDue : false);
      if (isCleared) {
        history.push({
          date: formatISODateOnly(d),
          amount: weeklyTotal,
          status: 'Cleared (Interest + Principal)',
        });
      }
    }
  } else if (loan.loanType === 'Gold Loan') {
    const monthlyRate = loan.interestRate / 100 / 12;
    const monthlyInterest = Math.round(loan.principal * monthlyRate);
    // For closed loans, outstanding is already 0; use principal as the repaid amount
    const closingPrincipal = loan.status === 'closed' ? loan.principal : loan.outstanding;
    for (let i = 1; i <= loan.tenureMonths; i++) {
      const d = addMonthsUTC(start, i);
      const isLast = i === loan.tenureMonths;
      const isCleared = loan.status === 'closed' || (nextDue ? d < nextDue : false);
      if (isCleared) {
        history.push({
          date: formatISODateOnly(d),
          amount: isLast ? monthlyInterest + closingPrincipal : monthlyInterest,
          status: isLast ? 'Loan Closed (Cleared)' : `Month ${i} Interest Cleared`,
        });
      }
    }
  } else {
    // Normal EMI
    const monthlyRate = loan.interestRate / 100 / 12;
    const interestAmt = Math.round(loan.principal * monthlyRate);
    const principalAmt = Math.round(loan.principal / loan.tenureMonths);
    const emi = interestAmt + principalAmt;
    for (let i = 1; i <= loan.tenureMonths; i++) {
      const d = addMonthsUTC(start, i);
      const isCleared = loan.status === 'closed' || (nextDue ? d < nextDue : false);
      if (isCleared) {
        history.push({
          date: formatISODateOnly(d),
          amount: emi,
          status: `Month ${i} EMI Cleared`,
        });
      }
    }
  }

  return history;
}

export function useLoans() {
  const [data, setData] = useState<{ loans: LoanSummary[]; formattedTotalOutstanding: string; formattedTotalInterestDue: string; branch: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'user') {
      setIsLoading(false);
      return;
    }

    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const { data: dbLoans, error: loansErr } = await supabase
          .from('loans')
          .select('*')
          .eq('customer_id', user.id);

        if (loansErr) throw loansErr;

        const monthAdjByLoan = await fetchMonthAdjustmentsByLoan((dbLoans || []).map((l: any) => l.id));

        const mappedLoans: LoanSummary[] = (dbLoans || []).map((l: any) => {
          const goldWeight = Number(l.gold_weight);
          const loanType = l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');
          const tenureMonths = l.tenure_months ? Number(l.tenure_months) : (() => {
            if (!l.start_date || !l.maturity_date) return 0;
            return inferTenureMonths(l.start_date, l.maturity_date);
          })();
          return {
            id: l.id,
            loanId: l.loan_id,
            status: l.status,
            principal: Number(l.principal),
            outstanding: Number(l.outstanding),
            interestDue: getTotalInterestDue({
              ...l,
              loanType,
              tenureMonths,
            }, monthAdjByLoan[l.id] || []),
            interestRate: Number(l.interest_rate),
            nextDueDate: l.next_due_date || '',
            startDate: l.start_date,
            maturityDate: l.maturity_date,
            goldWeight,
            goldPurity: Number(l.gold_purity),
            estimatedGoldValue: Number(l.estimated_gold_value),
            goldImageUrl: l.gold_image_url || '',
            loanType,
            tenureMonths,
          };
        });

        const totalOutstanding = mappedLoans.reduce((sum, loan) => sum + (loan.outstanding + loan.interestDue), 0);
        const totalInterest = mappedLoans.reduce((sum, loan) => sum + loan.interestDue, 0);

        // Fetch customer branch
        let userBranch = 'Musthafa Nagar Branch';
        const { data: custData } = await supabase
          .from('customers')
          .select('branch')
          .eq('id', user.id)
          .maybeSingle();
        if (custData?.branch) {
          userBranch = custData.branch;
        }

        setData({
          loans: mappedLoans,
          formattedTotalOutstanding: totalOutstanding.toLocaleString('en-IN'),
          formattedTotalInterestDue: totalInterest.toLocaleString('en-IN'),
          branch: userBranch,
        });
      } catch (error) {
        console.error('Error in useLoans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();

    if (!user || user.role !== 'user') return;
    const channel = supabase
      .channel(`rt-customer-loans-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans', filter: `customer_id=eq.${user.id}` }, fetchLoans)
      .on('postgres_changes',
        // No customer_id column on this table to filter by — refetch on any change and let
        // fetchLoans re-scope to this customer's own loan ids.
        { event: '*', schema: 'public', table: 'loan_interest_adjustments' },
        fetchLoans
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { data, isLoading };
}

export function useLoanDetail(loanId: string) {
  const [data, setData] = useState<LoanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;

    const fetchLoanDetail = async () => {
      setIsLoading(true);
      try {
        const { data: l, error } = await supabase
          .from('loans')
          .select('*')
          .eq('loan_id', loanId)
          .maybeSingle();

        if (error) throw error;

        if (l) {
          const tenureMonths = l.tenure_months ? Number(l.tenure_months) : (() => {
            if (!l.start_date || !l.maturity_date) return 0;
            return inferTenureMonths(l.start_date, l.maturity_date);
          })();

          const goldWeight = Number(l.gold_weight);
          const loanType = l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');

          const monthAdjustments = await fetchMonthAdjustmentsByLoan([l.id]);
          const loanMonthAdjustments = monthAdjustments[l.id] || [];

          const mappedDetail: LoanDetail = {
            id: l.id,
            loanId: l.loan_id,
            status: l.status,
            principal: Number(l.principal),
            outstanding: Number(l.outstanding),
            interestDue: getTotalInterestDue({
              ...l,
              loanType,
              tenureMonths,
            }, loanMonthAdjustments),
            interestRate: Number(l.interest_rate),
            nextDueDate: l.next_due_date || '',
            startDate: l.start_date,
            maturityDate: l.maturity_date,
            goldWeight,
            goldPurity: Number(l.gold_purity),
            estimatedGoldValue: Number(l.estimated_gold_value),
            goldImageUrl: l.gold_image_url || '',
            loanType,
            tenureMonths,
            branch: l.branch,
            repaymentHistory: [],
          };

          // Generate repayment history from schedule (cleared months via next_due_date)
          const scheduleHistory = generateRepaymentHistory(mappedDetail);

          // Fetch explicit payment records (principal-only and mixed admin payments)
          const { data: paymentsData, error: paymentsErr } = await supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', loanId)
            .order('payment_date', { ascending: true });

          if (paymentsErr) throw paymentsErr;

          const paymentRecords: Array<{ date: string; amount: number; status: string; type: string }> =
            (paymentsData || []).map((p: any) => ({
              date: p.payment_date,
              amount: Number(p.amount),
              status:
                p.payment_type === 'principal'
                  ? 'Principal Payment Cleared'
                  : p.payment_type === 'mixed'
                  ? 'Payment Cleared (Interest + Principal)'
                  : p.payment_type === 'emi'
                  ? 'EMI Payment Cleared'
                  : 'Interest Payment Cleared',
              type: p.payment_type,
            }));

          // Deduplicate scheduled payments against actual payment records timezone-safely
          const actualInstallmentCount = paymentRecords.filter(
            (p) => p.type === 'interest' || p.type === 'mixed' || p.type === 'emi'
          ).length;

          const uniqueScheduled = scheduleHistory.slice(actualInstallmentCount);

          // Surface each per-month staff charge as its own visible line, rather than
          // only folding it silently into interestDue above — the reason a customer's
          // interest went up for a given month should be visible, not just the total.
          const chargeEntries = loanMonthAdjustments.map((adj) => ({
            date: adj.due_date,
            amount: Number(adj.amount || 0),
            status: `Interest Charge Added${adj.reason ? `: ${adj.reason}` : ''}`,
          }));

          // Merge and sort by date (oldest first)
          const merged = [...uniqueScheduled, ...paymentRecords, ...chargeEntries].sort(
            (a, b) => parseDateUTC(a.date).getTime() - parseDateUTC(b.date).getTime()
          );

          mappedDetail.repaymentHistory = merged;

          // Fetch approved outstanding edit requests as penalties/waivers
          const { data: penaltiesData, error: penaltiesErr } = await supabase
            .from('outstanding_edit_requests')
            .select('*')
            .eq('loan_db_id', l.id)
            .eq('status', 'approved');

          if (penaltiesErr) throw penaltiesErr;

          mappedDetail.penalties = (penaltiesData || []).map((p: any) => ({
            id: p.id,
            currentOutstanding: Number(p.current_outstanding),
            newOutstanding: Number(p.new_outstanding),
            reason: p.reason || '',
            requestedBy: p.requested_by,
            requestedAt: p.requested_at,
            status: p.status,
            reviewedBy: p.reviewed_by || '',
            reviewedAt: p.reviewed_at || '',
            adminNotes: p.admin_notes || '',
          }));

          setData(mappedDetail);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('Error fetching loan detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanDetail();

    const channel = supabase
      .channel(`rt-loan-detail-${loanId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans', filter: `loan_id=eq.${loanId}` }, fetchLoanDetail)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_payments', filter: `loan_id=eq.${loanId}` }, fetchLoanDetail)
      .on('postgres_changes',
        // loan_interest_adjustments.loan_id references the loan's db id, not this
        // human-readable loanId, which isn't known until after the first fetch —
        // refetch on any change and let fetchLoanDetail re-scope to this loan.
        { event: '*', schema: 'public', table: 'loan_interest_adjustments' },
        fetchLoanDetail
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loanId]);

  return { data, isLoading };
}
