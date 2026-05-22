import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const custId = 'cust-1779437767516';
  const loanId = 'GL-2102';
  const loanDbId = 'loan-1779437767516';

  // 1. Insert customer
  const custRes = await supabase.from('customers').insert({
    id: custId,
    name: 'Subhash',
    mobile: '08374359262',
    email: 'subhash@example.com',
    address: 'Musthafa Nagar, Khammam',
    dob: '1995-05-22',
    kyc_status: 'Verified',
    branch: 'Musthafa Nagar Branch',
    joined_date: '2026-05-22'
  });
  console.log('Customer Insert:', custRes);

  // 2. Insert loan
  const loanRes = await supabase.from('loans').insert({
    id: loanDbId,
    loan_id: loanId,
    customer_id: custId,
    customer_name: 'Subhash',
    status: 'active',
    principal: 100000,
    outstanding: 77500,
    interest_due: 0,
    interest_rate: 30,
    start_date: '2026-05-22',
    maturity_date: '2026-11-22',
    next_due_date: '2026-07-22',
    gold_weight: 15,
    gold_purity: 22,
    estimated_gold_value: 127500,
    branch: 'Musthafa Nagar Branch',
    loan_type: 'Gold Loan',
    tenure_months: 6
  });
  console.log('Loan Insert:', loanRes);

  // 3. Insert payment
  const payRes = await supabase.from('loan_payments').insert({
    id: `pay-${Date.now()}`,
    loan_id: loanId,
    loan_db_id: loanDbId,
    amount: 22500,
    payment_type: 'principal',
    payment_date: '2026-05-22',
    notes: 'Principal payment'
  });
  console.log('Payment Insert:', payRes);
}

main();
