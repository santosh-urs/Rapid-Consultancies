import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gnbnsehqwsspncrtgcim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: customers } = await supabase.from('customers').select('*');
  console.log('--- CUSTOMERS ---');
  console.log(customers);

  const { data: loans } = await supabase.from('loans').select('*');
  console.log('--- LOANS ---');
  console.log(loans);

  const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  console.log('--- AUDIT LOGS ---');
  console.log(auditLogs);
}

main();
