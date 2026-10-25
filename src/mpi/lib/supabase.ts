import { supabase as lmsSupabase } from '../../supabase.js';

export const supabase = lmsSupabase;

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== 'YOUR_SUPABASE_URL_HERE' &&
    key !== 'YOUR_SUPABASE_ANON_KEY_HERE'
  );
};
