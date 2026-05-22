import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const result = await supabase.from('loan_payments').insert({
    id: `pay-test-${Date.now()}`,
    loan_id: 'GL-2102',
    loan_db_id: 'loan-1779437767516',
    amount: 25000,
    payment_type: 'principal',
    payment_date: '2026-05-22',
    notes: 'Test principal payment'
  });
  console.log('Insert Result:', result);
}

main();
