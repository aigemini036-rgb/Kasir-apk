import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Transaction, User, StoreSettings, StockMovement } from '../types';

// Get credentials from Vite env or localStorage
const getEnvOrStorage = (key: string, storageKey: string): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved;
  }
  return (import.meta.env[key] as string) || '';
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'supabase_custom_url');
  const anonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'supabase_custom_anon_key');
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
};

export const setCustomSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('supabase_custom_url', url.trim());
  localStorage.setItem('supabase_custom_anon_key', anonKey.trim());
  cachedClient = null; // reset client
};

export const clearCustomSupabaseConfig = () => {
  localStorage.removeItem('supabase_custom_url');
  localStorage.removeItem('supabase_custom_anon_key');
  cachedClient = null;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

/**
 * Uji koneksi ke database Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'URL atau Anon Key Supabase belum diisi!' };
  }

  try {
    const { data, error } = await client.from('products').select('id', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: `Error Supabase: ${error.message} (Pastikan tabel sudah dibuat via SQL Editor)` };
    }
    return { success: true, message: 'Koneksi ke Supabase berhasil!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung: ${err.message || 'Network error'}` };
  }
}
