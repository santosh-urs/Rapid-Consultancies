import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const newLoan = {
    id: `loan-test-${Date.now()}`,
    loan_id: 'GL-9999',
    customer_id: 'cust-1779442794481',
    customer_name: 'Test Customer',
    status: 'active',
    principal: 50000,
    outstanding: 50000,
    interest_due: 0,
    interest_rate: 9.5,
    start_date: '2026-05-22',
    maturity_date: '2026-11-22',
    next_due_date: '2026-06-22',
    gold_weight: 10,
    gold_purity: 22,
    estimated_gold_value: 66000,
    branch: 'Musthafa Nagar Branch',
    loan_type: 'Gold Loan',
    tenure_months: 6,
  };

  const result = await supabase.from('loans').insert(newLoan);
  console.log('Insert Result:', result);
}

main();
