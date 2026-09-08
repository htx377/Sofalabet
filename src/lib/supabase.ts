import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!client && supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.warn('[Supabase Client] Falha ao instanciar cliente Supabase:', e);
      client = null;
    }
  }
  return client;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
);
