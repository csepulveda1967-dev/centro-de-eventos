/**
 * Cliente y utilidades de Supabase para persistencia en PostgreSQL
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Intentar leer desde variables de entorno VITE_
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// También permitimos guardar las llaves en localStorage para que el usuario no dependa de compilar código
const STORAGE_URL_KEY = 'hlr_supabase_custom_url';
const STORAGE_ANON_KEY = 'hlr_supabase_custom_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const customAnonKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  return {
    url: customUrl || ENV_SUPABASE_URL,
    anonKey: customAnonKey || ENV_SUPABASE_ANON_KEY
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  }
}

export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey && creds.url.startsWith('https://'));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey || !creds.url.startsWith('https://')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(creds.url, creds.anonKey);
    } catch (err) {
      console.warn('Error inicializando cliente Supabase:', err);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Prueba la conexión con la base de datos de Supabase
 */
export async function probarConexionSupabase(): Promise<{ ok: boolean; mensaje: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, mensaje: 'Credenciales incompletas o no configuradas.' };
  }

  try {
    const { data, error } = await client.from('empresas').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, mensaje: `Error de Supabase: ${error.message}` };
    }
    return { ok: true, mensaje: 'Conexión exitosa con la base de datos de Supabase.' };
  } catch (err: any) {
    return { ok: false, mensaje: err?.message || 'No se pudo conectar a Supabase.' };
  }
}
