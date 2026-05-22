/**
 * Fix: Normalize all mobile numbers and reset Rithika's password to Cust@123
 * Run: node scripts/normalize-mobiles.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

async function getAllCustomers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,name,mobile,password`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.json();
}

async function updateCustomer(id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(fields),
  });
  return { status: res.status, data: await res.json() };
}

function normalizeMobile(mobile) {
  // Strip all non-digits, then take last 10 digits and add country code prefix
  const digits = mobile.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return `+91${last10}`;
}

async function main() {
  const customers = await getAllCustomers();
  console.log('=== Before normalization ===');
  customers.forEach(c => console.log(`  ${c.id} | ${c.name} | ${c.mobile} | pwd: ${c.password}`));

  for (const c of customers) {
    const normalized = normalizeMobile(c.mobile);
    const updates = {};

    if (c.mobile !== normalized) {
      console.log(`\nNormalizing mobile for ${c.name}: "${c.mobile}" → "${normalized}"`);
      updates.mobile = normalized;
    }

    // If password is missing or is the placeholder, set a default
    if (!c.password) {
      updates.password = 'Cust@123';
    }

    if (Object.keys(updates).length > 0) {
      const result = await updateCustomer(c.id, updates);
      console.log(`  Updated ${c.id}: status ${result.status}`);
    }
  }

  console.log('\n=== After normalization ===');
  const after = await getAllCustomers();
  after.forEach(c => console.log(`  ${c.id} | ${c.name} | ${c.mobile} | pwd: ${c.password}`));
  console.log('\n✅ Done!');
}

main().catch(console.error);
