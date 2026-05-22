import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: loans, error: loansErr } = await supabase.from('loans').select('*');
  console.log('LOANS:');
  console.log(JSON.stringify(loans, null, 2));

  const { data: payments, error: paymentsErr } = await supabase.from('loan_payments').select('*');
  console.log('\nLOAN PAYMENTS:');
  console.log(JSON.stringify(payments, null, 2));

  const { data: logs, error: logsErr } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(20);
  console.log('\nAUDIT LOGS:');
  console.log(JSON.stringify(logs, null, 2));
}

main();
