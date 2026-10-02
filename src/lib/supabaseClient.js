import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly rather than silently - a missing .env is the single
  // most likely reason every Supabase call in this app would break.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY - check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
