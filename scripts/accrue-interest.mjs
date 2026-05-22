import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getDaysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  d1.setUTCHours(0, 0, 0, 0);
  d2.setUTCHours(0, 0, 0, 0);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

async function main() {
  console.log('Starting Interest Accrual process...');
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Fetch the latest Interest Accrual log
  const { data: logs, error: logErr } = await supabase
    .from('audit_logs')
    .select('timestamp')
    .eq('action', 'Interest Accrual')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (logErr) {
    console.error('Error fetching audit logs:', logErr);
    process.exit(1);
  }

  const lastRunDateStr = logs && logs.length > 0
    ? new Date(logs[0].timestamp).toISOString().split('T')[0]
    : null;

  if (lastRunDateStr) {
    console.log(`Last accrual run was on: ${lastRunDateStr}`);
  } else {
    console.log('No previous accrual run log found. Running initial catch-up accrual based on loan start dates.');
  }

  // 2. Fetch all active and overdue loans
  const { data: loans, error: loanErr } = await supabase
    .from('loans')
    .select('*')
    .in('status', ['active', 'overdue']);

  if (loanErr) {
    console.error('Error fetching loans:', loanErr);
    process.exit(1);
  }

  console.log(`Found ${loans.length} active/overdue loans.`);

  let updatedCount = 0;
  let totalAccrued = 0;

  for (const loan of loans) {
    // We accrue interest since the last run OR the loan start date, whichever is later
    const baselineDateStr = lastRunDateStr && new Date(lastRunDateStr) > new Date(loan.start_date)
      ? lastRunDateStr
      : loan.start_date;

    const elapsedDays = getDaysBetween(baselineDateStr, todayStr);
    
    if (elapsedDays <= 0) {
      console.log(`Loan ${loan.loan_id} (${loan.customer_name}): 0 days elapsed since baseline (${baselineDateStr}). Skipping.`);
      continue;
    }

    // Accrued interest = outstanding * interest_rate / 100 * elapsedDays / 365
    const principalBasis = Number(loan.outstanding);
    const rate = Number(loan.interest_rate);
    const accrued = Math.round(principalBasis * (rate / 100) * (elapsedDays / 365));

    if (accrued > 0) {
      const newInterestDue = Number(loan.interest_due || 0) + accrued;
      
      console.log(`Loan ${loan.loan_id} (${loan.customer_name}): Accruing ₹${accrued.toLocaleString('en-IN')} for ${elapsedDays} days (from ${baselineDateStr} to ${todayStr}). New interest due: ₹${newInterestDue.toLocaleString('en-IN')}`);
      
      const { error: updateErr } = await supabase
        .from('loans')
        .update({ interest_due: newInterestDue })
        .eq('id', loan.id);

      if (updateErr) {
        console.error(`Error updating loan ${loan.loan_id}:`, updateErr);
      } else {
        updatedCount++;
        totalAccrued += accrued;
      }
    } else {
      console.log(`Loan ${loan.loan_id} (${loan.customer_name}): Elapsed days ${elapsedDays}, but accrued interest rounded to ₹0.`);
    }
  }

  // 3. Log the process in audit_logs
  if (updatedCount > 0 || totalAccrued > 0 || !lastRunDateStr) {
    const { error: logInsertErr } = await supabase
      .from('audit_logs')
      .insert({
        id: `log-accrual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Interest Accrual',
        details: `Accrued interest for ${updatedCount} loans. Total accrued: ₹${totalAccrued.toLocaleString('en-IN')}. Date: ${todayStr}`,
        admin: 'System'
      });

    if (logInsertErr) {
      console.error('Error creating audit log entry:', logInsertErr);
    } else {
      console.log(`Audit log successfully created.`);
    }
  }

  console.log(`Interest Accrual process completed. Accrued interest for ${updatedCount} loans. Total accrued: ₹${totalAccrued.toLocaleString('en-IN')}.`);
}

main().catch(console.error);
