// One-off migration: add gross_weight to loans and loan_sanction_requests.
// Gross weight = total ornament weight (incl. stones/fastenings); gold_weight is the net weight.
// Usage: node scripts/add-gross-weight.mjs
import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query('ALTER TABLE loans ADD COLUMN IF NOT EXISTS gross_weight NUMERIC DEFAULT 0');
await client.query('ALTER TABLE loan_sanction_requests ADD COLUMN IF NOT EXISTS gross_weight NUMERIC DEFAULT 0');
const { rows } = await client.query(
  `SELECT table_name, column_name FROM information_schema.columns
   WHERE column_name = 'gross_weight' AND table_name IN ('loans', 'loan_sanction_requests')`
);
console.log('gross_weight present on:', rows.map(r => r.table_name).join(', ') || 'NONE');
await client.end();
