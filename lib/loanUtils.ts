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

// Add months safely in UTC, clamping to the target month's last day instead of
// overflowing into the following month (e.g. Jan 31 + 1 month -> Feb 28, not Mar 3).
export function addMonthsUTC(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const daysInTargetMonth = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  firstOfMonth.setUTCDate(Math.min(day, daysInTargetMonth));
  return firstOfMonth;
}

// Format a UTC Date object back to YYYY-MM-DD string
export function formatISODateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Infer a loan's tenure in months from its start/maturity dates, for legacy rows
// that predate the tenure_months column. A pure calendar-month difference over-counts
// when the maturity day-of-month is earlier than the start day-of-month, UNLESS that's
// because addMonthsUTC clamped it to the end of a shorter month (e.g. Jan 31 -> Feb 28).
export function inferTenureMonths(startDate: string, maturityDate: string): number {
  const s = parseDateUTC(startDate);
  const e = parseDateUTC(maturityDate);
  let months = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
  const daysInEndMonth = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth() + 1, 0)).getUTCDate();
  const endIsClampedToMonthEnd = e.getUTCDate() === daysInEndMonth;
  if (e.getUTCDate() < s.getUTCDate() && !endIsClampedToMonthEnd) {
    months -= 1;
  }
  return months;
}

// Get the local calendar date of a Date object formatted as YYYY-MM-DD
export function getLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Given a loan, compute what next_due_date should become if every instalment
// currently counted as "due" by calculateDynamicInterest were cleared in one go
// (i.e. the next instalment whose due date hasn't arrived yet). Used when a payment
// fully covers the currently-due interest, so the due-date model stays in sync with
// the amount actually paid instead of silently drifting back to the old due date.
export function advanceNextDueDateFully(l: any): string {
  const startDate = l.startDate || l.start_date;
  const goldWeight = Number(l.goldWeight !== undefined ? l.goldWeight : l.gold_weight || 0);
  const loanType = l.loanType || l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');
  const fallback = l.nextDueDate || l.next_due_date || l.maturityDate || l.maturity_date || '';
  if (!startDate) return fallback;

  let tenureMonths = l.tenureMonths !== undefined ? Number(l.tenureMonths) : Number(l.tenure_months || 0);
  if (!tenureMonths && (l.maturityDate || l.maturity_date)) {
    tenureMonths = inferTenureMonths(startDate, l.maturityDate || l.maturity_date);
  }

  const today = getTodayUTC();
  const start = parseDateUTC(startDate);

  if (loanType === 'Weekly Loan') {
    for (let i = 1; i <= 4; i++) {
      const d = addDaysUTC(start, 7 * i);
      if (d > today) return formatISODateOnly(d);
    }
    return fallback;
  }

  for (let i = 1; i <= tenureMonths; i++) {
    const d = addMonthsUTC(start, i);
    if (d > today) return formatISODateOnly(d);
  }
  return fallback;
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
    tenureMonths = inferTenureMonths(startDate, l.maturityDate || l.maturity_date);
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
