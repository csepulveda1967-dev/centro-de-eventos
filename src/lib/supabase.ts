/**
 * Cliente y utilidades de Supabase para persistencia en PostgreSQL
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InsumoMaestro } from '../types';

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
    // Reset instance so new credentials are picked up
    supabaseInstance = null;
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
    const { error } = await client.from('empresas').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, mensaje: `Error de Supabase: ${error.message}` };
    }
    return { ok: true, mensaje: 'Conexión exitosa con la base de datos de Supabase.' };
  } catch (err: any) {
    return { ok: false, mensaje: err?.message || 'No se pudo conectar a Supabase.' };
  }
}

/**
 * Guarda o actualiza (upsert) un insumo en la tabla 'insumos' de Supabase
 */
export async function guardarInsumoEnSupabase(
  insumo: InsumoMaestro,
  empresaId?: string
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  try {
    const payload = {
      id: insumo.id,
      empresa_id: empresaId || 'emp-dominga',
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      unidad_medida: insumo.unidadMedida,
      precio_compra: insumo.precioCompra,
      merma_porcentaje: insumo.mermaPorcentaje,
      proveedor: insumo.proveedor || 'Proveedor Local',
      ultimo_cambio: insumo.ultimoCambio || new Date().toISOString().slice(0, 10)
    };

    const { error } = await client.from('insumos').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Error guardando insumo en Supabase:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn('Excepción guardando insumo en Supabase:', err);
    return { ok: false, error: err?.message || 'Error al conectar' };
  }
}

/**
 * Elimina un insumo de la tabla 'insumos' de Supabase
 */
export async function eliminarInsumoEnSupabase(insumoId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { error } = await client.from('insumos').delete().eq('id', insumoId);
    if (error) {
      console.warn('Error eliminando insumo en Supabase:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al eliminar' };
  }
}

/**
 * Carga todos los insumos registrados en Supabase
 */
export async function cargarInsumosDesdeSupabase(
  empresaId?: string
): Promise<{ ok: boolean; insumos?: InsumoMaestro[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  try {
    let query = client.from('insumos').select('*');
    if (empresaId) {
      // Filtrar por empresa o permitir comunes
      query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error cargando insumos de Supabase:', error.message);
      return { ok: false, error: error.message };
    }

    if (!data || !Array.isArray(data)) {
      return { ok: true, insumos: [] };
    }

    const insumosMapeados: InsumoMaestro[] = data.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      categoria: row.categoria,
      unidadMedida: row.unidad_medida,
      precioCompra: Number(row.precio_compra) || 0,
      mermaPorcentaje: Number(row.merma_porcentaje) || 0,
      proveedor: row.proveedor || undefined,
      ultimoCambio: row.ultimo_cambio || undefined
    }));

    return { ok: true, insumos: insumosMapeados };
  } catch (err: any) {
    console.warn('Excepción cargando insumos de Supabase:', err);
    return { ok: false, error: err?.message || 'Error al consultar Supabase' };
  }
}

/**
 * Sincroniza en lote una lista completa de insumos hacia Supabase
 */
export async function sincronizarTodosLosInsumosEnSupabase(
  insumos: InsumoMaestro[],
  empresaId?: string
): Promise<{ ok: boolean; guardados: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, guardados: 0, error: 'Supabase no está configurado.' };
  }

  try {
    const payloads = insumos.map(ins => ({
      id: ins.id,
      empresa_id: empresaId || 'emp-dominga',
      nombre: ins.nombre,
      categoria: ins.categoria,
      unidad_medida: ins.unidadMedida,
      precio_compra: ins.precioCompra,
      merma_porcentaje: ins.mermaPorcentaje,
      proveedor: ins.proveedor || 'Proveedor Local',
      ultimo_cambio: ins.ultimoCambio || new Date().toISOString().slice(0, 10)
    }));

    const { error } = await client.from('insumos').upsert(payloads, { onConflict: 'id' });
    if (error) {
      return { ok: false, guardados: 0, error: error.message };
    }

    return { ok: true, guardados: payloads.length };
  } catch (err: any) {
    return { ok: false, guardados: 0, error: err?.message };
  }
}
