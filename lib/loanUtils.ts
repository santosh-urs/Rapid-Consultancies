// Parse a local YYYY-MM-DD date string as a UTC Date object (ignoring client timezone shifts)
export function parseDateUTC(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('T')[0].split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1] || 1);
  const day = Number(parts[2] || 1);
  return new Date(Date.UTC(year, month - 1, day));
}

// Get today's local date represented as UTC midnight (e.g., if today is May 22 local, returns May 22 00:00:00 UTC)
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Add days safely in UTC
export function addDaysUTC(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setUTCDate(newDate.getUTCDate() + days);
  return newDate;
}

// Add months safely in UTC
export function addMonthsUTC(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setUTCMonth(newDate.getUTCMonth() + months);
  return newDate;
}

// Format a UTC Date object back to YYYY-MM-DD string
export function formatISODateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get the local calendar date of a Date object formatted as YYYY-MM-DD
export function getLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDynamicInterest(l: any): number {
  if (!l || l.status === 'closed') return 0;

  const principal = Number(l.principal || 0);
  const interestRate = Number(l.interestRate !== undefined ? l.interestRate : l.interest_rate || 0);
  const startDate = l.startDate || l.start_date;
  const nextDueDate = l.nextDueDate || l.next_due_date || '';
  const goldWeight = Number(l.goldWeight !== undefined ? l.goldWeight : l.gold_weight || 0);
  const loanType = l.loanType || l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');

  let tenureMonths = l.tenureMonths !== undefined ? Number(l.tenureMonths) : Number(l.tenure_months || 0);
  if (!tenureMonths && startDate && (l.maturityDate || l.maturity_date)) {
    const s = parseDateUTC(startDate);
    const e = parseDateUTC(l.maturityDate || l.maturity_date);
    tenureMonths = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
  }

  if (!startDate || principal <= 0 || interestRate <= 0) return 0;

  const today = getTodayUTC();
  const start = parseDateUTC(startDate);
  const nextDue = nextDueDate ? parseDateUTC(nextDueDate) : null;

  // Weekly Loan: 4 weekly instalments, flat interest on initial principal
  if (loanType === 'Weekly Loan') {
    const weeklyInterest = Math.round((principal * (interestRate / 100)) / 4);
    let total = 0;
    for (let i = 1; i <= 4; i++) {
      const d = addDaysUTC(start, 7 * i);
      const isCleared = nextDue ? d < nextDue : false;
      // Week 1 shows from day 1; subsequent weeks only after their due date passes
      if (!isCleared && (i === 1 || d <= today)) {
        total += weeklyInterest;
      }
    }
    return total;
  }

  if (tenureMonths <= 0) return 0;

  // Gold Loan and all other monthly loans:
  // Interest is ALWAYS on initial principal (never on reduced outstanding).
  // Month 1 interest is visible from the very first day of the loan.
  // Each subsequent month's interest appears only after its due date has passed.
  // Staff clearing a month advances next_due_date, which removes that month from "unpaid".
  const monthlyInterest = Math.round(principal * (interestRate / 100 / 12));
  let total = 0;

  for (let i = 1; i <= tenureMonths; i++) {
    const d = addMonthsUTC(start, i);
    const isCleared = nextDue ? d < nextDue : false;
    // Show: first instalment always (from day 1), later ones only after their due date
    if (!isCleared && (i === 1 || d <= today)) {
      total += monthlyInterest;
    }
  }

  return total;
}
