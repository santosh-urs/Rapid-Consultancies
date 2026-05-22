/**
 * Migration: Add customer_id and password_hash columns to access_requests
 * using the Supabase Management API (requires service role key or exec_sql RPC).
 * Run: node scripts/migrate-access-requests.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

// Try calling the exec_sql RPC (if it exists) or just insert with a fallback
async function tryRpc(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// Workaround: INSERT a test row without the missing columns to confirm what we need
async function getExistingColumns() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_requests?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return Object.keys(data[0]);
  }
  // Insert a minimal row to see what comes back
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/access_requests`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: `probe-${Date.now()}`,
      name: 'Probe',
      mobile: '+910000000000',
      email: 'probe@probe.com',
      status: 'pending',
    }),
  });
  const insertData = await insertRes.json();
  if (Array.isArray(insertData) && insertData[0]) {
    const cols = Object.keys(insertData[0]);
    // Clean up probe row
    await fetch(`${SUPABASE_URL}/rest/v1/access_requests?id=eq.probe-${Date.now()}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    return cols;
  }
  return [];
}

async function main() {
  console.log('=== Checking existing columns via RPC ===');
  // Try calling the Supabase SQL RPC
  const sql1 = `ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS customer_id TEXT;`;
  const sql2 = `ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS password_hash TEXT;`;

  const r1 = await tryRpc(sql1);
  console.log(`ADD customer_id: status=${r1.status}`, JSON.stringify(r1.data).substring(0, 200));

  const r2 = await tryRpc(sql2);
  console.log(`ADD password_hash: status=${r2.status}`, JSON.stringify(r2.data).substring(0, 200));

  // Check existing columns via a probe row
  console.log('\n=== Existing columns in access_requests ===');
  const cols = await getExistingColumns();
  console.log('Columns:', cols.join(', '));

  // Verify the columns we need exist now
  const hasCustomerId = cols.includes('customer_id');
  const hasPasswordHash = cols.includes('password_hash');
  console.log(`\ncustomer_id: ${hasCustomerId ? '✅ exists' : '❌ MISSING'}`);
  console.log(`password_hash: ${hasPasswordHash ? '✅ exists' : '❌ MISSING'}`);

  if (!hasCustomerId || !hasPasswordHash) {
    console.log('\n⚠️  The exec_sql RPC is not available with the anon key.');
    console.log('Please run the following in the Supabase SQL Editor manually:');
    console.log('\n  ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS customer_id TEXT;');
    console.log('  ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS password_hash TEXT;\n');
  }
}

main().catch(console.error);
