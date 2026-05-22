/**
 * Migration: Add customer_id TEXT column to access_requests table
 * Run: node scripts/add-customer-id.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

// Check if customer_id column exists by selecting it
async function checkColumn() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_requests?select=customer_id&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

// Test insert without user_id, with customer_id instead
async function testInsert(customerId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_requests`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: `req-test-${Date.now()}`,
      name: 'Test User',
      mobile: '+919999999999',
      email: 'test@test.com',
      address: '',
      dob: null,
      branch: 'Musthafa Nagar Branch',
      status: 'pending',
      request_date: new Date().toISOString().split('T')[0],
      password_hash: 'TestPass',
      customer_id: customerId,
    }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// Delete a test record
async function deleteRecord(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_requests?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.status;
}

async function main() {
  console.log('=== Checking for customer_id column ===');
  const { status, data } = await checkColumn();
  console.log(`Status: ${status}, Data:`, JSON.stringify(data).substring(0, 200));

  if (status === 200) {
    console.log('\n✅ customer_id column already exists!');
  } else if (status === 400) {
    console.log('\n❌ customer_id column does NOT exist in access_requests.');
    console.log('\nYou need to run this SQL in Supabase SQL Editor:');
    console.log('ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS customer_id TEXT;');
    console.log('\nAlso run:');
    console.log('ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS password_hash TEXT;');
  }

  // Also test a minimal insert to see what columns are accepted
  console.log('\n=== Testing insert with customer_id ===');
  const testId = `cust-test-${Date.now()}`;
  const result = await testInsert(testId);
  console.log(`Insert result status: ${result.status}`);
  console.log('Insert result:', JSON.stringify(result.data).substring(0, 300));

  if (result.status === 201 && Array.isArray(result.data) && result.data[0]) {
    const insertedId = result.data[0].id;
    console.log('\n✅ Insert with customer_id WORKS! Deleting test record...');
    const delStatus = await deleteRecord(insertedId);
    console.log(`Delete status: ${delStatus}`);
  } else if (result.status === 400) {
    console.log('\n❌ Insert failed — customer_id column missing or invalid.');
    console.log('Please run the ALTER TABLE commands above in Supabase SQL Editor.');
  }
}

main().catch(console.error);
