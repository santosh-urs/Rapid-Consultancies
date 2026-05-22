const pg = require('pg');
const url = 'postgresql://postgres:Database@1234@@db.gnbnsehqwsspncrtgcim.supabase.co:5432/postgres';

async function run() {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('Altering customers table...');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;');
    console.log('Altered successfully.');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

run();
