import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper functions (copied from loanUtils.ts and useLoans.ts)
function parseDateUTC(dateStr) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('T')[0].split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1] || 1);
  const day = Number(parts[2] || 1);
  return new Date(Date.UTC(year, month - 1, day));
}

function addMonthsUTC(date, months) {
  const newDate = new Date(date);
  newDate.setUTCMonth(newDate.getUTCMonth() + months);
  return newDate;
}

function formatISODateOnly(date) {
  return date.toISOString().split('T')[0];
}

function generateRepaymentHistory(loan) {
  if (!loan.startDate || loan.tenureMonths <= 0) return [];
  const start = parseDateUTC(loan.startDate);
  const nextDue = loan.nextDueDate ? parseDateUTC(loan.nextDueDate) : null;
  const history = [];

  if (loan.loanType === 'Gold Loan') {
    const monthlyRate = loan.interestRate / 100 / 12;
    const monthlyInterest = Math.round(loan.principal * monthlyRate);
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
  }
  return history;
}

async function main() {
  const loanId = 'GL-2102';
  const response = await supabase
    .from('loans')
    .select('*')
    .eq('loan_id', loanId);
  console.log('Query response:', response);
  const l = response.data?.[0];
  const error = response.error;

  if (error) {
    console.error('Error fetching loan:', error);
    return;
  }

  if (!l) {
    console.log('Loan not found');
    return;
  }

  const tenureMonths = l.tenure_months ? Number(l.tenure_months) : 6;
  const goldWeight = Number(l.gold_weight);
  const loanType = l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');

  const mappedDetail = {
    id: l.id,
    loanId: l.loan_id,
    status: l.status,
    principal: Number(l.principal),
    outstanding: Number(l.outstanding),
    interestRate: Number(l.interest_rate),
    nextDueDate: l.next_due_date || '',
    startDate: l.start_date,
    maturityDate: l.maturity_date,
    goldWeight,
    goldPurity: Number(l.gold_purity),
    estimatedGoldValue: Number(l.estimated_gold_value),
    loanType,
    tenureMonths,
    branch: l.branch,
    repaymentHistory: [],
  };

  const scheduleHistory = generateRepaymentHistory(mappedDetail);
  console.log('scheduleHistory:', scheduleHistory);

  const { data: paymentsData } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('payment_date', { ascending: true });

  console.log('paymentsData:', paymentsData);

  const paymentRecords = (paymentsData || []).map((p) => ({
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

  const merged = [...scheduleHistory, ...paymentRecords].sort(
    (a, b) => parseDateUTC(a.date).getTime() - parseDateUTC(b.date).getTime()
  );

  console.log('merged repayment history:', merged);
}

main();
