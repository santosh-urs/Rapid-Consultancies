import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const createDummyClient = () => {
  const dummyQueryBuilder: any = {
    select: () => dummyQueryBuilder,
    order: () => dummyQueryBuilder,
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => dummyQueryBuilder,
    delete: () => dummyQueryBuilder,
    eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    neq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };

  return {
    from: () => dummyQueryBuilder,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any;
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url_here'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();

