import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const req = {
    customerId: 'cust-1779442794481',
    customerName: 'Rithika Macharla',
    principal: 100000,
    interestRate: 9.5,
    goldWeight: 19,
    goldPurity: 22,
    estimatedGoldValue: 125400,
    branch: 'Musthafa Nagar Branch',
    loanType: 'Gold Loan',
    tenureMonths: 6,
  };

  const newLoan = {
    id: `loan-sanc-test`,
    loan_id: 'GL-2103',
    customer_id: req.customerId,
    customer_name: req.customerName,
    status: 'active',
    principal: req.principal,
    outstanding: req.principal,
    interest_due: 0,
    interest_rate: req.interestRate,
    start_date: '2026-05-22',
    maturity_date: '2026-11-22',
    next_due_date: '2026-06-22',
    gold_weight: req.goldWeight,
    gold_purity: req.goldPurity,
    estimated_gold_value: req.estimatedGoldValue,
    branch: req.branch,
    loan_type: req.loanType,
    tenure_months: req.tenureMonths,
  };

  const result = await supabase.from('loans').insert(newLoan);
  console.log('Real Insert Result:', result);
}

main();
