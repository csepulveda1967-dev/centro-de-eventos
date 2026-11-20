/**
 * Cliente y utilidades de Supabase para persistencia en PostgreSQL
 * Endurecido contra exposición de llaves service_role e inyección de filtros PostgREST.
 */
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import {
  CotizacionState,
  EmpresaCliente,
  InsumoMaestro,
  ReservaCalendario,
  ResumenFinanciero
} from '../types';
import {
  inspeccionarJwtSupabase,
  sanitizarNumero,
  sanitizarTexto,
  validarSlugIdSeguro,
  validarUrlSupabase
} from '../utils/security';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

export function saveSupabaseCredentials(url: string, anonKey: string): { ok: boolean; error?: string } {
  const validacionUrl = validarUrlSupabase(url);
  if (!validacionUrl.ok) {
    return { ok: false, error: validacionUrl.error };
  }

  const keyLimpia = anonKey.trim();
  const inspeccion = inspeccionarJwtSupabase(keyLimpia);
  if (inspeccion.esServiceRole) {
    return {
      ok: false,
      error:
        'BLOQUEO DE SEGURIDAD: Detectamos una llave secreta "service_role" / "sb_secret_". ' +
        'Nunca pegues la llave secreta en el navegador; usa exclusivamente la llave pública "anon" (o publishable).'
    };
  }
  if (!inspeccion.esValidoFormato) {
    return {
      ok: false,
      error: 'El formato de la API Key de Supabase no es válido (debe ser tu Anon Public Key).'
    };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, validacionUrl.urlLimpia);
    localStorage.setItem(STORAGE_ANON_KEY, keyLimpia);
    supabaseInstance = null;
  }
  return { ok: true };
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    supabaseInstance = null;
  }
}

export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) return false;
  const urlOk = validarUrlSupabase(creds.url).ok;
  const jwtInfo = inspeccionarJwtSupabase(creds.anonKey);
  return urlOk && jwtInfo.esValidoFormato && !jwtInfo.esServiceRole;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  const validUrl = validarUrlSupabase(creds.url);
  const jwtInfo = inspeccionarJwtSupabase(creds.anonKey);

  if (!validUrl.ok || !creds.anonKey || jwtInfo.esServiceRole) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(validUrl.urlLimpia, creds.anonKey.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.warn('Error inicializando cliente Supabase:', err);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Autenticación segura de personal/administrador mediante Supabase Auth (requerido cuando RLS estricto está activo).
 */
export async function iniciarSesionSupabase(
  email: string,
  password: string
): Promise<{ ok: boolean; session?: Session | null; mensaje: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, mensaje: 'Configura primero una URL y Anon Key válidas de Supabase.' };
  }
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: sanitizarTexto(email, 160),
      password
    });
    if (error) {
      return { ok: false, mensaje: `No se pudo iniciar sesión: ${error.message}` };
    }
    return { ok: true, session: data.session, mensaje: `Sesión iniciada como ${data.user?.email || 'usuario autenticado'}.` };
  } catch (err: any) {
    return { ok: false, mensaje: err?.message || 'Error al autenticar en Supabase.' };
  }
}

export async function cerrarSesionSupabase(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch {}
}

export async function obtenerSesionSupabase(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session || null;
  } catch {
    return null;
  }
}

/**
 * Prueba la conexión con la base de datos de Supabase
 */
export async function probarConexionSupabase(): Promise<{ ok: boolean; mensaje: string }> {
  const creds = getSupabaseCredentials();
  if (inspeccionarJwtSupabase(creds.anonKey).esServiceRole) {
    return {
      ok: false,
      mensaje: 'BLOQUEADO: Se detectó una llave service_role en configuración. Cámbiala por la llave pública anon.'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, mensaje: 'Credenciales incompletas, URL no HTTPS o llave inválida.' };
  }

  try {
    const { error } = await client.from('empresas').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, mensaje: `Error de Supabase: ${error.message}` };
    }
    const sesion = await obtenerSesionSupabase();
    return {
      ok: true,
      mensaje: sesion
        ? `Conexión verificada con sesión autenticada (${sesion.user.email}).`
        : 'Conexión exitosa con Supabase (modo público/anon).'
    };
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

  const empresaSegura = validarSlugIdSeguro(empresaId) || 'emp-dominga';
  const idSeguro = validarSlugIdSeguro(insumo.id);
  if (!idSeguro) {
    return { ok: false, error: 'Identificador de insumo inválido.' };
  }

  try {
    const payload = {
      id: idSeguro,
      empresa_id: empresaSegura,
      nombre: sanitizarTexto(insumo.nombre, 180),
      categoria: sanitizarTexto(insumo.categoria, 80) || 'abarrotes',
      unidad_medida: sanitizarTexto(insumo.unidadMedida, 30) || 'kg',
      precio_compra: sanitizarNumero(insumo.precioCompra, 0, 50_000_000, 0),
      merma_porcentaje: sanitizarNumero(insumo.mermaPorcentaje, 0, 99, 0),
      proveedor: sanitizarTexto(insumo.proveedor || 'Proveedor Local', 120),
      ultimo_cambio: sanitizarTexto(insumo.ultimoCambio || new Date().toISOString().slice(0, 10), 20)
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

  const idSeguro = validarSlugIdSeguro(insumoId);
  if (!idSeguro) {
    return { ok: false, error: 'Identificador de insumo inválido.' };
  }

  try {
    const { error } = await client.from('insumos').delete().eq('id', idSeguro);
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
      const empresaSegura = validarSlugIdSeguro(empresaId);
      if (!empresaSegura) {
        return { ok: false, error: 'Identificador de empresa inválido.' };
      }
      query = query.or(`empresa_id.eq.${empresaSegura},empresa_id.is.null`);
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
      id: sanitizarTexto(row.id, 64),
      nombre: sanitizarTexto(row.nombre, 180),
      categoria: sanitizarTexto(row.categoria, 80),
      unidadMedida: (sanitizarTexto(row.unidad_medida, 30) || 'kg') as InsumoMaestro['unidadMedida'],
      precioCompra: sanitizarNumero(row.precio_compra, 0, 50_000_000, 0),
      mermaPorcentaje: sanitizarNumero(row.merma_porcentaje, 0, 99, 0),
      proveedor: row.proveedor ? sanitizarTexto(row.proveedor, 120) : undefined,
      ultimoCambio: row.ultimo_cambio ? sanitizarTexto(row.ultimo_cambio, 20) : undefined
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

  const empresaSegura = validarSlugIdSeguro(empresaId) || 'emp-dominga';

  try {
    const payloads = insumos
      .filter((ins) => Boolean(validarSlugIdSeguro(ins.id)))
      .map((ins) => ({
        id: ins.id.trim(),
        empresa_id: empresaSegura,
        nombre: sanitizarTexto(ins.nombre, 180),
        categoria: sanitizarTexto(ins.categoria, 80) || 'abarrotes',
        unidad_medida: sanitizarTexto(ins.unidadMedida, 30) || 'kg',
        precio_compra: sanitizarNumero(ins.precioCompra, 0, 50_000_000, 0),
        merma_porcentaje: sanitizarNumero(ins.mermaPorcentaje, 0, 99, 0),
        proveedor: sanitizarTexto(ins.proveedor || 'Proveedor Local', 120),
        ultimo_cambio: sanitizarTexto(ins.ultimoCambio || new Date().toISOString().slice(0, 10), 20)
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

// ==============================================================================
// PROTOCOLOS DE BASE DE DATOS: ALTAS DE NUEVAS EMPRESAS, COTIZACIONES Y RESERVAS
// ==============================================================================

export async function guardarEmpresaEnSupabase(
  empresa: EmpresaCliente
): Promise<{ ok: boolean; requiereAuth?: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  const idSeguro = validarSlugIdSeguro(empresa.id);
  if (!idSeguro) {
    return { ok: false, error: 'Identificador de empresa inválido.' };
  }

  try {
    const sesion = await obtenerSesionSupabase();
    if (!sesion) {
      return {
        ok: false,
        requiereAuth: true,
        error: 'Se requiere sesión de Administrador autenticada en Supabase Auth para registrar nuevas empresas en BD.'
      };
    }

    const payload = {
      id: idSeguro,
      nombre: sanitizarTexto(empresa.nombre, 160),
      subtitulo: sanitizarTexto(empresa.subtitulo, 180),
      recinto_principal: sanitizarTexto(empresa.recintoPrincipal, 180),
      direccion: sanitizarTexto(empresa.direccion, 220),
      ciudad: sanitizarTexto(empresa.ciudad, 120) || 'Santiago, Chile',
      telefono: sanitizarTexto(empresa.telefono, 50),
      email: sanitizarTexto(empresa.email, 160),
      sitio_web: empresa.sitioWeb ? sanitizarTexto(empresa.sitioWeb, 180) : null,
      letra_logo: sanitizarTexto(empresa.letraLogo || empresa.nombre.slice(0, 2).toUpperCase(), 4),
      color_tema: sanitizarTexto(empresa.colorTema || 'amber', 20),
      razon_social_legal: empresa.razonSocialLegal ? sanitizarTexto(empresa.razonSocialLegal, 180) : null,
      rut_empresa: empresa.rutEmpresa ? sanitizarTexto(empresa.rutEmpresa, 30) : null,
      giro_comercial: empresa.giroComercial ? sanitizarTexto(empresa.giroComercial, 180) : null,
      contacto_responsable: empresa.contactoResponsable ? sanitizarTexto(empresa.contactoResponsable, 120) : null,
      cargo_responsable: empresa.cargoResponsable ? sanitizarTexto(empresa.cargoResponsable, 120) : null,
      instagram: empresa.instagram ? sanitizarTexto(empresa.instagram, 100) : null,
      modalidad_operacion: empresa.modalidadOperacion ? sanitizarTexto(empresa.modalidadOperacion, 30) : null,
      capacidad_max_pax: empresa.capacidadMaxPax ? sanitizarNumero(empresa.capacidadMaxPax, 1, 50000, 200) : null,
      tarifa_base_arriendo: empresa.tarifaBaseArriendo ? sanitizarNumero(empresa.tarifaBaseArriendo, 0, 500_000_000, 0) : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('empresas').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error guardando empresa en Supabase.' };
  }
}

export async function cargarEmpresasDesdeSupabase(): Promise<{
  ok: boolean;
  empresas?: EmpresaCliente[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { data, error } = await client.from('empresas').select('*').order('created_at', { ascending: true });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data || !Array.isArray(data)) {
      return { ok: true, empresas: [] };
    }

    const coloresValidos = new Set(['amber', 'emerald', 'blue', 'rose', 'slate']);
    const mapeadas: EmpresaCliente[] = data
      .filter((r: any) => Boolean(validarSlugIdSeguro(r?.id)))
      .map((r: any) => {
        const nombre = sanitizarTexto(r.nombre, 160) || 'Centro de Eventos';
        const colorRaw = sanitizarTexto(r.color_tema || 'amber', 20);
        const colorTema = (coloresValidos.has(colorRaw) ? colorRaw : 'amber') as EmpresaCliente['colorTema'];
        return {
          id: sanitizarTexto(r.id, 64),
          nombre,
          subtitulo: sanitizarTexto(r.subtitulo || 'Centro de Eventos & Banquetería', 180),
          recintoPrincipal: sanitizarTexto(r.recinto_principal || nombre, 180),
          direccion: sanitizarTexto(r.direccion || 'Dirección por definir', 220),
          ciudad: sanitizarTexto(r.ciudad || 'Santiago, Chile', 120),
          telefono: sanitizarTexto(r.telefono || '', 50),
          email: sanitizarTexto(r.email || '', 160),
          sitioWeb: r.sitio_web ? sanitizarTexto(r.sitio_web, 180) : undefined,
          letraLogo: sanitizarTexto(r.letra_logo || nombre.slice(0, 2).toUpperCase(), 4) || 'CE',
          colorTema,
          fechaRegistro: r.created_at ? String(r.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
          razonSocialLegal: r.razon_social_legal ? sanitizarTexto(r.razon_social_legal, 180) : undefined,
          rutEmpresa: r.rut_empresa ? sanitizarTexto(r.rut_empresa, 30) : undefined,
          giroComercial: r.giro_comercial ? sanitizarTexto(r.giro_comercial, 180) : undefined,
          contactoResponsable: r.contacto_responsable ? sanitizarTexto(r.contacto_responsable, 120) : undefined,
          cargoResponsable: r.cargo_responsable ? sanitizarTexto(r.cargo_responsable, 120) : undefined,
          instagram: r.instagram ? sanitizarTexto(r.instagram, 100) : undefined,
          modalidadOperacion: r.modalidad_operacion || undefined,
          capacidadMaxPax: r.capacidad_max_pax ? sanitizarNumero(r.capacidad_max_pax, 1, 50000, 200) : undefined,
          tarifaBaseArriendo: r.tarifa_base_arriendo ? sanitizarNumero(r.tarifa_base_arriendo, 0, 500_000_000, 0) : undefined
        };
      });

    return { ok: true, empresas: mapeadas };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error cargando empresas.' };
  }
}

export async function guardarCotizacionEnSupabase(
  cotizacion: CotizacionState,
  resumen: ResumenFinanciero,
  empresaId: string
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase no está configurado.' };
  const sesion = await obtenerSesionSupabase();
  if (!sesion) return { ok: false, error: 'Requiere sesión autenticada en Supabase.' };

  const idSeguro = validarSlugIdSeguro(cotizacion.id || `cot-${Date.now()}`);
  const empresaSegura = validarSlugIdSeguro(empresaId);
  if (!idSeguro || !empresaSegura) return { ok: false, error: 'Identificador inválido.' };

  try {
    const payload = {
      id: idSeguro,
      empresa_id: empresaSegura,
      nombre_evento: sanitizarTexto(cotizacion.nombreEvento || 'Cotización', 180),
      cliente: sanitizarTexto(cotizacion.cliente || 'Por definir', 160),
      email_cliente: sanitizarTexto(cotizacion.emailCliente || '', 160) || null,
      telefono_cliente: sanitizarTexto(cotizacion.telefonoCliente || '', 50) || null,
      tipo_evento: sanitizarTexto(cotizacion.tipoEvento || 'Boda', 80),
      fecha_evento: cotizacion.fechaEvento ? sanitizarTexto(cotizacion.fechaEvento, 20) : null,
      invitados: sanitizarNumero(cotizacion.invitados, 1, 50000, 100),
      menu_id: sanitizarTexto(cotizacion.menuId || '', 64) || null,
      personal: cotizacion.personal,
      proveedores_seleccionados: cotizacion.proveedoresSeleccionados,
      mesas: cotizacion.mesas,
      decoracion_id: sanitizarTexto(cotizacion.decoracionId || '', 64) || null,
      margen_ganancia: sanitizarNumero(cotizacion.margenGanancia, 0, 100, 35),
      aplica_iva: Boolean(cotizacion.aplicaIva),
      observaciones: sanitizarTexto(cotizacion.observaciones || '', 1000, true),
      total_neto: Math.round(sanitizarNumero(resumen.precioVentaNeto, 0, 1_000_000_000, 0)),
      total_iva: Math.round(sanitizarNumero(resumen.ivaMonto, 0, 1_000_000_000, 0)),
      total_final: Math.round(sanitizarNumero(resumen.precioCobradoFinal || resumen.precioVentaTotal, 0, 1_000_000_000, 0)),
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('cotizaciones').upsert(payload, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error guardando cotización.' };
  }
}

export async function guardarReservaEnSupabase(
  reserva: ReservaCalendario,
  empresaId: string
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase no está configurado.' };
  const sesion = await obtenerSesionSupabase();
  if (!sesion) return { ok: false, error: 'Requiere sesión autenticada en Supabase.' };

  const idSeguro = validarSlugIdSeguro(reserva.id);
  const empresaSegura = validarSlugIdSeguro(empresaId);
  if (!idSeguro || !empresaSegura) return { ok: false, error: 'Identificador inválido.' };

  try {
    const payload = {
      id: idSeguro,
      empresa_id: empresaSegura,
      fecha: sanitizarTexto(reserva.fecha, 20),
      cliente: sanitizarTexto(reserva.cliente || 'Cliente', 160),
      evento: sanitizarTexto(reserva.titulo || 'Evento', 180),
      tipo_evento: sanitizarTexto(reserva.tipoEvento || 'Boda', 80),
      invitados: sanitizarNumero(reserva.invitados, 1, 50000, 100),
      estado: sanitizarTexto(reserva.estado || 'cotizado', 30),
      total: Math.round(sanitizarNumero(reserva.montoTotal, 0, 1_000_000_000, 0))
    };
    const { error } = await client.from('reservas').upsert(payload, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error guardando reserva.' };
  }
}

// ==============================================================================
// TELEMETRÍA REMOTA DEL MEDIDOR DE USO DEL DEMO (demo_telemetria)
// ==============================================================================

export interface EventoTelemetriaRemota {
  id: string;
  centro_id: string;
  centro_nombre: string;
  tipo: 'visita' | 'cotizacion' | 'invitados' | 'menu' | 'pdf' | 'whatsapp' | 'recetas' | 'proveedores' | 'calendario';
  detalle: string;
  sesion_id?: string | null;
  user_agent_corto?: string | null;
  created_at: string;
}

export async function registrarEventoDemoEnSupabase(evento: {
  id: string;
  centroId: string;
  centroNombre: string;
  tipo: EventoTelemetriaRemota['tipo'];
  detalle: string;
  sesionId?: string;
}): Promise<{ ok: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };

  const idSeguro = validarSlugIdSeguro(evento.id);
  const centroSeguro = validarSlugIdSeguro(evento.centroId);
  if (!idSeguro || !centroSeguro) return { ok: false };

  try {
    const ua =
      typeof navigator !== 'undefined'
        ? sanitizarTexto(`${navigator.platform || ''} · ${navigator.userAgent || ''}`, 90)
        : 'web';

    const payload = {
      id: idSeguro,
      centro_id: centroSeguro,
      centro_nombre: sanitizarTexto(evento.centroNombre || centroSeguro, 180),
      tipo: evento.tipo,
      detalle: sanitizarTexto(evento.detalle || '', 240),
      sesion_id: evento.sesionId ? sanitizarTexto(evento.sesionId, 64) : null,
      user_agent_corto: ua
    };

    const { error } = await client.from('demo_telemetria').insert(payload);
    if (error) {
      return { ok: false };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function cargarTelemetriaDemoDesdeSupabase(limite = 250): Promise<{
  ok: boolean;
  eventos?: EventoTelemetriaRemota[];
  requiereAuth?: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase no está configurado en esta compilación.' };
  }

  try {
    const sesion = await obtenerSesionSupabase();
    if (!sesion) {
      return {
        ok: false,
        requiereAuth: true,
        error: 'Inicia sesión como Administrador en Supabase Auth para leer la actividad remota de tus clientes.'
      };
    }

    const { data, error } = await client
      .from('demo_telemetria')
      .select('id, centro_id, centro_nombre, tipo, detalle, sesion_id, user_agent_corto, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(500, Math.max(10, limite)));

    if (error) {
      const esPermiso = error.code === '42501' || error.message?.toLowerCase().includes('permission');
      return {
        ok: false,
        requiereAuth: esPermiso,
        error: error.message
      };
    }

    return { ok: true, eventos: (data || []) as EventoTelemetriaRemota[] };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error consultando telemetría remota.' };
  }
}

export async function limpiarTelemetriaDemoEnSupabase(): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase no configurado.' };

  try {
    const sesion = await obtenerSesionSupabase();
    if (!sesion) return { ok: false, error: 'Requiere sesión de Administrador en Supabase.' };

    const { error } = await client.from('demo_telemetria').delete().neq('id', '');
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error limpiando telemetría.' };
  }
}
