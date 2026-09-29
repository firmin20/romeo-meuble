import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or local overrides
const getSupabaseConfig = () => {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('romeo_supabase_url');
  const localKey = localStorage.getItem('romeo_supabase_key');

  const supabaseUrl = envUrl || localUrl;
  const supabaseAnonKey = envKey || localKey;

  return { supabaseUrl, supabaseAnonKey };
};

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('Supabase initialization failed:', err);
      return null;
    }
  }

  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url && key) {
    localStorage.setItem('romeo_supabase_url', url.trim());
    localStorage.setItem('romeo_supabase_key', key.trim());
    try {
      cachedClient = createClient(url.trim(), key.trim());
    } catch {
      cachedClient = null;
    }
  } else {
    localStorage.removeItem('romeo_supabase_url');
    localStorage.removeItem('romeo_supabase_key');
    cachedClient = null;
  }
}
