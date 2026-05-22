/**
 * Migration: Add password column to customers table
 * Run: node scripts/add-password-column.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

// Use Supabase rpc to run raw SQL — this requires the pg_execute extension or we call via REST
// Instead, we'll use the Supabase JS client approach via fetch

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Check if password column already exists by querying a customer
async function checkColumn() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=password&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  console.log('Column check response status:', res.status);
  console.log('Column check response:', JSON.stringify(data).substring(0, 200));
  return { status: res.status, data };
}

// Update a customer's password field to test write
async function testUpdate() {
  // First, fetch all customers
  const listRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,name,password&limit=5`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const customers = await listRes.json();
  console.log('\nCustomers with password field:');
  console.log(JSON.stringify(customers, null, 2));
  return customers;
}

// Patch all customers that have no password with 'Cust@123'
async function setDefaultPasswords(customers) {
  for (const c of customers) {
    if (!c.password) {
      console.log(`Setting default password for customer: ${c.name} (${c.id})`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${c.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ password: 'Cust@123' }),
      });
      const result = await res.json();
      console.log(`  → status ${res.status}:`, JSON.stringify(result).substring(0, 100));
    } else {
      console.log(`Customer ${c.name} already has a password set.`);
    }
  }
}

async function main() {
  console.log('=== Checking customers table for password column ===\n');
  const { status, data } = await checkColumn();

  if (status === 400 && JSON.stringify(data).includes('password')) {
    console.log('\n❌ The "password" column does NOT exist in the customers table in Supabase.');
    console.log('You need to run the following SQL in the Supabase SQL Editor manually:');
    console.log('\n  ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT \'Cust@123\';\n');
    return;
  }

  if (status === 200) {
    console.log('\n✅ The "password" column EXISTS in the customers table.\n');
    const customers = await testUpdate();
    if (Array.isArray(customers) && customers.length > 0) {
      await setDefaultPasswords(customers);
      console.log('\n✅ Done! All customers now have a password set.');
    }
  } else {
    console.log('\n⚠️ Unexpected response. Check the output above.');
  }
}

main().catch(console.error);
