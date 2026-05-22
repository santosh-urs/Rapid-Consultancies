/**
 * Debug: Test password update and login flow
 * Run: node scripts/debug-password.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

async function listAllCustomers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,name,mobile,password`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.json();
}

async function updatePassword(customerId, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${customerId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log('=== Current Customer Passwords ===');
  const customers = await listAllCustomers();
  console.log(JSON.stringify(customers, null, 2));

  // Try updating Rithika's password to 'NewPass@123' and then back to 'Cust@123'
  const rithika = customers.find(c => c.name === 'Rithika Macharla');
  if (rithika) {
    console.log(`\n=== Updating password for ${rithika.name} (${rithika.id}) ===`);
    const result = await updatePassword(rithika.id, 'TestPass@999');
    console.log('Update result:', JSON.stringify(result, null, 2));

    console.log('\n=== Verifying updated password ===');
    const updated = await listAllCustomers();
    const updated_rithika = updated.find(c => c.id === rithika.id);
    console.log('After update:', JSON.stringify(updated_rithika, null, 2));

    if (updated_rithika.password === 'TestPass@999') {
      console.log('\n✅ Password update is WORKING CORRECTLY in the database!');
      console.log('The issue is something else — likely the browser caching old auth data.');
    } else {
      console.log('\n❌ Password update FAILED in the database!');
      console.log('Current value:', updated_rithika.password);
    }

    // Reset it back
    await updatePassword(rithika.id, 'Cust@123');
    console.log('\nPassword reset back to Cust@123');
  }
}

main().catch(console.error);
