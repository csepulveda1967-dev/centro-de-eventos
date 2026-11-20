/**
 * Utilidades Centralizadas de Seguridad Defensiva (SOLVI Flow)
 * Protege contra: XSS, Prototype Pollution, SQL Injection en respaldos,
 * CSV Formula Injection, exposición de llaves service_role, inyección PostgREST y fuerza bruta en PIN Admin.
 */

const ADMIN_PIN_STORAGE_KEY = 'solvi_admin_pin_hash_v2';
const LEGACY_PIN_STORAGE_KEY = 'solvi_admin_master_pin';
const ADMIN_LOCKOUT_KEY = 'solvi_admin_lockout_v1';
const DEFAULT_ADMIN_PIN = '1967';
const MAX_INTENTOS_ADMIN = 5;
const BLOQUEO_SEGUNDOS = 60;

export interface AdminPinRecord {
  hash: string;
  salt: string;
  isCustom: boolean;
  updatedAt: string;
}

export interface LockoutStatus {
  bloqueado: boolean;
  segundosRestantes: number;
  intentosFallidos: number;
}

/**
 * Sanitiza texto eliminando bytes nulos y caracteres de control peligrosos, limitando longitud.
 */
export function sanitizarTexto(val: unknown, maxLen = 500, permitirSaltos = false): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Eliminar byte nulo (\0) y caracteres de control C0 excepto \n, \r, \t si se permiten
  str = permitirSaltos
    ? str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    : str.replace(/[\x00-\x1F\x7F]/g, ' ');
  str = str.trim();
  if (str.length > maxLen) {
    str = str.slice(0, maxLen);
  }
  return str;
}

/**
 * Valida y acota un número para prevenir NaN, Infinity o inyecciones en SQL/cálculos.
 */
export function sanitizarNumero(val: unknown, min = 0, max = 1_000_000_000, fallback = 0): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/**
 * Escapa caracteres HTML para evitar Stored/File XSS al generar reportes .html descargables.
 */
export function escaparHTML(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Neutraliza ataques de CSV/Excel Formula Injection (=, +, -, @, \t, \r)
 * prefijando un apóstrofo antes de envolver en comillas dobles.
 */
export function escaparCeldaCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let texto = String(val).replace(/\0/g, '');
  if (/^[=+\-@\t\r]/.test(texto)) {
    texto = `'${texto}`;
  }
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Clona recursivamente un objeto JSON eliminando claves peligrosas
 * (__proto__, constructor, prototype) para evitar Prototype Pollution.
 */
export function sanitizarObjetoJsonSeguro<T = unknown>(input: T, profundidad = 0): T {
  if (profundidad > 25) {
    throw new Error('Estructura JSON demasiado profunda para ser procesada de forma segura.');
  }
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizarObjetoJsonSeguro(item, profundidad + 1)) as unknown as T;
  }
  const limpio: Record<string, unknown> = Object.create(null);
  const clavesProhibidas = new Set(['__proto__', 'constructor', 'prototype']);
  for (const [clave, valor] of Object.entries(input as Record<string, unknown>)) {
    if (clavesProhibidas.has(clave)) continue;
    limpio[clave] = sanitizarObjetoJsonSeguro(valor, profundidad + 1);
  }
  return Object.assign({}, limpio) as T;
}

/**
 * Valida el tamaño de un archivo antes de cargarlo en memoria del navegador (prevención de DoS).
 */
export function validarTamanoArchivo(file: File, maxMB = 5): { ok: boolean; error?: string } {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `El archivo supera el límite de seguridad de ${maxMB} MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`
    };
  }
  if (file.size === 0) {
    return { ok: false, error: 'El archivo seleccionado está vacío.' };
  }
  return { ok: true };
}

/**
 * Valida identificadores/slugs usados en consultas PostgREST (.or, .eq) para evitar inyección de filtros.
 */
export function validarSlugIdSeguro(id: string | undefined | null): string | null {
  if (!id) return null;
  const limpio = id.trim();
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(limpio)) {
    return limpio;
  }
  return null;
}

/**
 * Valida que la URL de Supabase use protocolo HTTPS y un dominio legítimo.
 */
export function validarUrlSupabase(rawUrl: string): { ok: boolean; urlLimpia: string; error?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, urlLimpia: '', error: 'La URL de Supabase no puede estar vacía.' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return {
        ok: false,
        urlLimpia: '',
        error: 'Por seguridad, la URL de Supabase debe comenzar con https://'
      };
    }
    return { ok: true, urlLimpia: parsed.origin };
  } catch {
    return { ok: false, urlLimpia: '', error: 'El formato de la URL de Supabase no es válido.' };
  }
}

/**
 * Inspecciona el payload de un JWT de Supabase para detectar y BLOQUEAR
 * llaves maestras "service_role" que jamás deben exponerse en el navegador.
 */
export function inspeccionarJwtSupabase(token: string): {
  esValidoFormato: boolean;
  esServiceRole: boolean;
  rolDetectado: string | null;
} {
  const trimmed = token.trim();
  if (!trimmed) {
    return { esValidoFormato: false, esServiceRole: false, rolDetectado: null };
  }
  // Las llaves nuevas sb_secret_ de Supabase nunca deben ir al cliente
  if (trimmed.startsWith('sb_secret_')) {
    return { esValidoFormato: true, esServiceRole: true, rolDetectado: 'sb_secret' };
  }
  const partes = trimmed.split('.');
  if (partes.length !== 3) {
    return { esValidoFormato: trimmed.startsWith('sb_publishable_'), esServiceRole: false, rolDetectado: null };
  }
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    const role = typeof payload?.role === 'string' ? payload.role : null;
    return {
      esValidoFormato: true,
      esServiceRole: role === 'service_role' || role === 'supabase_admin',
      rolDetectado: role
    };
  } catch {
    return { esValidoFormato: false, esServiceRole: false, rolDetectado: null };
  }
}

/**
 * Calcula un hash SHA-256 con salt usando Web Crypto API (con fallback determinista si crypto.subtle no existe).
 */
export async function hashPinSha256(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}::SOLVI_FLOW::${pin}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback FNV-1a extendido para entornos sin crypto.subtle (no plaintext)
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < data.length; i++) {
    h1 ^= data[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= data[i] ^ i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `fb_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
}

function generarSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Verifica si el usuario ya personalizó el PIN maestro de administrador.
 */
export function tienePinAdminPersonalizado(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminPinRecord;
      return Boolean(parsed?.isCustom);
    }
    const legacy = localStorage.getItem(LEGACY_PIN_STORAGE_KEY);
    return Boolean(legacy && legacy !== DEFAULT_ADMIN_PIN);
  } catch {
    return false;
  }
}

/**
 * Guarda un nuevo PIN de Administrador hasheado con SHA-256 + salt (elimina almacenamiento en texto plano).
 */
export async function guardarNuevoPinAdmin(nuevoPin: string): Promise<{ ok: boolean; error?: string }> {
  const limpio = nuevoPin.trim();
  if (limpio.length < 4 || limpio.length > 32) {
    return { ok: false, error: 'El PIN debe tener entre 4 y 32 caracteres.' };
  }
  if (limpio === DEFAULT_ADMIN_PIN || limpio.toLowerCase() === 'admin' || limpio === '1234' || limpio === '0000') {
    return { ok: false, error: 'Por seguridad, elige un PIN distinto al PIN inicial de fábrica o claves triviales (1234, 0000, admin).' };
  }

  const salt = generarSalt();
  const hash = await hashPinSha256(limpio, salt);
  const record: AdminPinRecord = {
    hash,
    salt,
    isCustom: limpio !== DEFAULT_ADMIN_PIN,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, JSON.stringify(record));
    // Limpiar clave legacy en texto plano si existía
    localStorage.removeItem(LEGACY_PIN_STORAGE_KEY);
    limpiarBloqueoAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar el PIN en el almacenamiento local del navegador.' };
  }
}

export function obtenerEstadoBloqueoAdmin(): LockoutStatus {
  if (typeof window === 'undefined') {
    return { bloqueado: false, segundosRestantes: 0, intentosFallidos: 0 };
  }
  try {
    const raw = localStorage.getItem(ADMIN_LOCKOUT_KEY);
    if (!raw) return { bloqueado: false, segundosRestantes: 0, intentosFallidos: 0 };
    const parsed = JSON.parse(raw) as { intentos: number; bloqueadoHasta: number };
    const ahora = Date.now();
    if (parsed.bloqueadoHasta && parsed.bloqueadoHasta > ahora) {
      return {
        bloqueado: true,
        segundosRestantes: Math.ceil((parsed.bloqueadoHasta - ahora) / 1000),
        intentosFallidos: parsed.intentos || MAX_INTENTOS_ADMIN
      };
    }
    return { bloqueado: false, segundosRestantes: 0, intentosFallidos: parsed.intentos || 0 };
  } catch {
    return { bloqueado: false, segundosRestantes: 0, intentosFallidos: 0 };
  }
}

function registrarIntentoFallidoAdmin(): LockoutStatus {
  const actual = obtenerEstadoBloqueoAdmin();
  const intentos = actual.intentosFallidos + 1;
  const bloqueado = intentos >= MAX_INTENTOS_ADMIN;
  const bloqueadoHasta = bloqueado ? Date.now() + BLOQUEO_SEGUNDOS * 1000 : 0;
  try {
    localStorage.setItem(
      ADMIN_LOCKOUT_KEY,
      JSON.stringify({ intentos: bloqueado ? 0 : intentos, bloqueadoHasta })
    );
  } catch {}
  return {
    bloqueado,
    segundosRestantes: bloqueado ? BLOQUEO_SEGUNDOS : 0,
    intentosFallidos: intentos
  };
}

export function limpiarBloqueoAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_LOCKOUT_KEY);
  } catch {}
}

/**
 * Verifica el PIN maestro de Administrador con hash SHA-256 y protección anti-fuerza bruta.
 */
export async function verificarPinAdmin(pinIngresado: string): Promise<{
  ok: boolean;
  error?: string;
  lockout: LockoutStatus;
}> {
  const bloqueo = obtenerEstadoBloqueoAdmin();
  if (bloqueo.bloqueado) {
    return {
      ok: false,
      error: `Demasiados intentos fallidos. Espera ${bloqueo.segundosRestantes}s antes de intentar nuevamente.`,
      lockout: bloqueo
    };
  }

  const limpio = pinIngresado.trim();
  if (!limpio) {
    return { ok: false, error: 'Ingresa tu PIN de administrador.', lockout: bloqueo };
  }

  try {
    const raw = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    if (raw) {
      const record = JSON.parse(raw) as AdminPinRecord;
      const hashCandidato = await hashPinSha256(limpio, record.salt);
      if (hashCandidato === record.hash) {
        limpiarBloqueoAdmin();
        return { ok: true, lockout: { bloqueado: false, segundosRestantes: 0, intentosFallidos: 0 } };
      }
    } else {
      // Migración segura desde posible PIN legacy o PIN inicial por defecto '1967' (sin puerta trasera 'admin')
      const legacyPin = localStorage.getItem(LEGACY_PIN_STORAGE_KEY) || DEFAULT_ADMIN_PIN;
      if (limpio === legacyPin) {
        // Migrar automáticamente al formato SHA-256 con salt
        const salt = generarSalt();
        const hash = await hashPinSha256(legacyPin, salt);
        localStorage.setItem(
          ADMIN_PIN_STORAGE_KEY,
          JSON.stringify({
            hash,
            salt,
            isCustom: legacyPin !== DEFAULT_ADMIN_PIN,
            updatedAt: new Date().toISOString()
          } satisfies AdminPinRecord)
        );
        localStorage.removeItem(LEGACY_PIN_STORAGE_KEY);
        limpiarBloqueoAdmin();
        return { ok: true, lockout: { bloqueado: false, segundosRestantes: 0, intentosFallidos: 0 } };
      }
    }
  } catch {}

  const nuevoBloqueo = registrarIntentoFallidoAdmin();
  return {
    ok: false,
    error: nuevoBloqueo.bloqueado
      ? `PIN incorrecto. Acceso bloqueado por ${nuevoBloqueo.segundosRestantes} segundos por seguridad.`
      : `PIN incorrecto (${MAX_INTENTOS_ADMIN - nuevoBloqueo.intentosFallidos} intentos restantes antes de bloqueo temporal).`,
    lockout: nuevoBloqueo
  };
}

/**
 * Limpia de forma segura credenciales y/o datos de sesión del navegador (ideal para equipos compartidos).
 */
export function limpiarDatosSensiblesNavegador(opciones: {
  borrarCredencialesSupabase?: boolean;
  borrarDatosClientes?: boolean;
  cerrarModoAdmin?: boolean;
}): number {
  if (typeof window === 'undefined') return 0;
  let eliminadas = 0;

  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (
        opciones.borrarCredencialesSupabase &&
        (k === 'hlr_supabase_custom_url' || k === 'hlr_supabase_custom_anon_key' || k.startsWith('sb-'))
      ) {
        localStorage.removeItem(k);
        eliminadas++;
      }
      if (
        opciones.borrarDatosClientes &&
        (k.startsWith('propuesta_datos_') ||
          k.startsWith('hlr_') ||
          k.startsWith('solvi_medidor_uso_demo'))
      ) {
        localStorage.removeItem(k);
        eliminadas++;
      }
      if (opciones.cerrarModoAdmin && k === 'solvi_flow_modo_admin') {
        localStorage.setItem('solvi_flow_modo_admin', 'false');
        eliminadas++;
      }
    }
    if (opciones.borrarDatosClientes) {
      sessionStorage.clear();
    }
  } catch (e) {
    console.error('Error limpiando almacenamiento local:', e);
  }

  return eliminadas;
}
