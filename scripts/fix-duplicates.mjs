/**
 * Fix: Remove duplicate customers with same mobile number, keeping the most recent one.
 * Run: node scripts/fix-duplicates.mjs
 */

const SUPABASE_URL = 'https://gnbnsehqwsspncrtgcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYm5zZWhxd3NzcG5jcnRnY2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkzMzUsImV4cCI6MjA5NDgzNTMzNX0.vGZDKzG_XrKzjHd85WkyHl_7wJ4gb-Ki3mPB2uumbnM';

async function getAllCustomers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,name,mobile,password,joined_date`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.json();
}

async function deleteCustomer(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.status;
}

async function main() {
  const customers = await getAllCustomers();
  console.log('=== All Customers ===');
  console.log(JSON.stringify(customers, null, 2));

  // Group by normalized mobile
  const groups = {};
  for (const c of customers) {
    const key = c.mobile.replace(/\D/g, '').slice(-10); // last 10 digits
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  console.log('\n=== Duplicate Groups ===');
  for (const [mobile, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`\nMobile ${mobile} has ${group.length} records:`);
      group.forEach(c => console.log(`  ${c.id} | ${c.name} | joined: ${c.joined_date} | password: ${c.password}`));

      // Keep the one with the most recent ID (highest timestamp in ID) or highest joined_date
      // Sort by joined_date descending, keep first
      const sorted = [...group].sort((a, b) => {
        // Extract timestamp from ID if possible
        const tsA = parseInt(a.id.replace('cust-', '')) || 0;
        const tsB = parseInt(b.id.replace('cust-', '')) || 0;
        return tsB - tsA;
      });

      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`  → KEEPING: ${toKeep.id} (${toKeep.name})`);
      for (const c of toDelete) {
        console.log(`  → DELETING: ${c.id} (${c.name})`);
        const status = await deleteCustomer(c.id);
        console.log(`    Status: ${status}`);
      }
    }
  }

  console.log('\n=== Final Customers ===');
  const final = await getAllCustomers();
  console.log(JSON.stringify(final, null, 2));
}

main().catch(console.error);
