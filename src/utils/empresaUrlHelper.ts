import { PerfilClienteId, EmpresaCliente } from '../types';

/**
 * Mapeo oficial de slugs limpios para direcciones web propias de cada empresa
 */
export const SLUG_POR_PERFIL: Record<PerfilClienteId, string> = {
  'damaris-eventos': 'damaris',
  'dominga-eventos': 'dominga',
  'modelo-base': 'isidora'
};

export const PERFIL_POR_SLUG: Record<string, PerfilClienteId> = {
  'damaris': 'damaris-eventos',
  'damaris-eventos': 'damaris-eventos',
  'calera-de-tango': 'damaris-eventos',
  'emp-damaris': 'damaris-eventos',

  'dominga': 'dominga-eventos',
  'dominga-eventos': 'dominga-eventos',
  'toscana': 'dominga-eventos',
  'linderos': 'dominga-eventos',
  'emp-dominga': 'dominga-eventos',

  'isidora': 'modelo-base',
  'dona-isidora': 'modelo-base',
  'donaisidora': 'modelo-base',
  'modelo-base': 'modelo-base',
  'base': 'modelo-base',
  'emp-isidora': 'modelo-base',
  'solvi': 'modelo-base'
};

/**
 * Obtiene el slug limpio de una empresa (ej: 'damaris', 'dominga', 'isidora')
 */
export function obtenerSlugEmpresa(clienteId: string, empresaId?: string): string {
  if (clienteId === 'damaris-eventos' || empresaId === 'emp-damaris') return 'damaris';
  if (clienteId === 'dominga-eventos' || empresaId === 'emp-dominga') return 'dominga';
  if (clienteId === 'modelo-base' || empresaId === 'emp-isidora') return 'isidora';
  if (empresaId === 'emp-nogales') return 'nogales';
  if (empresaId === 'emp-sanfrancisco') return 'sanfrancisco';
  
  if (PERFIL_POR_SLUG[clienteId]) return SLUG_POR_PERFIL[PERFIL_POR_SLUG[clienteId]] || clienteId;
  return clienteId.replace(/^emp-/, '').replace(/-eventos$/, '');
}

/**
 * Genera la URL completa y directa para una empresa o perfil
 */
export function obtenerUrlDirectaEmpresa(
  perfilId: PerfilClienteId | string,
  empresaId?: string,
  opciones?: { demo?: boolean; hash?: boolean }
): string {
  if (typeof window === 'undefined') return '';

  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/$/, '');
  const slug = obtenerSlugEmpresa(perfilId, empresaId);
  const demoParam = opciones?.demo ? '&demo=true' : '';

  if (opciones?.hash) {
    return `${origin}${pathname}/#${slug}`;
  }

  return `${origin}${pathname}?centro=${slug}${demoParam}`;
}

/**
 * Resuelve qué perfil de empresa corresponde a la URL actual
 * Busca en:
 * 1. Query params: ?centro=damaris, ?empresa=damaris, ?cliente=damaris, ?perfil=damaris
 * 2. Query param directo: ?damaris, ?dominga, ?isidora
 * 3. Pathname: /damaris, /dominga, /isidora
 * 4. Hash: #damaris, #/damaris, #centro=damaris
 */
export function resolverPerfilDesdeUrl(): { perfilId: PerfilClienteId; esDemo: boolean; slug: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const pathname = window.location.pathname || '';
    const params = new URLSearchParams(search);

    const esDemo = params.get('demo') === 'true' || hash.includes('demo=true');

    // 1. Verificar parámetro formal en query string
    const valorParam = params.get('centro') || params.get('empresa') || params.get('cliente') || params.get('perfil');
    if (valorParam) {
      const v = valorParam.toLowerCase().trim();
      if (PERFIL_POR_SLUG[v]) {
        return { perfilId: PERFIL_POR_SLUG[v], esDemo, slug: v };
      }
      if (v.includes('damaris')) return { perfilId: 'damaris-eventos', esDemo, slug: 'damaris' };
      if (v.includes('dominga') || v.includes('toscana')) return { perfilId: 'dominga-eventos', esDemo, slug: 'dominga' };
      if (v.includes('isidora')) return { perfilId: 'modelo-base', esDemo, slug: 'isidora' };
    }

    // 2. Query string directo (ej: ?damaris o ?dominga)
    const searchLimpio = search.replace(/^\?/, '').toLowerCase();
    for (const [claveSlug, idPerfil] of Object.entries(PERFIL_POR_SLUG)) {
      if (searchLimpio.startsWith(claveSlug) || searchLimpio.includes(`&${claveSlug}`)) {
        return { perfilId: idPerfil, esDemo, slug: claveSlug };
      }
    }

    // 3. Pathname (ej: /damaris o /dominga o /isidora)
    const segmentosPath = pathname.toLowerCase().split('/').filter(Boolean);
    for (const seg of segmentosPath) {
      if (PERFIL_POR_SLUG[seg]) {
        return { perfilId: PERFIL_POR_SLUG[seg], esDemo, slug: seg };
      }
    }

    // 4. Hash (ej: #damaris o #/damaris o #centro=damaris)
    const hashLimpio = hash.replace(/^#\/?/, '').toLowerCase();
    if (hashLimpio) {
      if (hashLimpio.includes('damaris')) return { perfilId: 'damaris-eventos', esDemo, slug: 'damaris' };
      if (hashLimpio.includes('dominga') || hashLimpio.includes('toscana')) return { perfilId: 'dominga-eventos', esDemo, slug: 'dominga' };
      if (hashLimpio.includes('isidora')) return { perfilId: 'modelo-base', esDemo, slug: 'isidora' };
      for (const [claveSlug, idPerfil] of Object.entries(PERFIL_POR_SLUG)) {
        if (hashLimpio.includes(claveSlug)) {
          return { perfilId: idPerfil, esDemo, slug: claveSlug };
        }
      }
    }
  } catch (e) {
    console.error('Error resolviendo perfil desde URL:', e);
  }

  return null;
}

/**
 * Actualiza la URL del navegador sin recargar la página para que la barra de direcciones
 * refleje siempre la dirección propia del centro activo.
 */
export function sincronizarUrlNavegador(perfilId: PerfilClienteId, empresaId?: string, mantenerDemo = false) {
  if (typeof window === 'undefined') return;

  try {
    const slug = obtenerSlugEmpresa(perfilId, empresaId);
    const searchParams = new URLSearchParams(window.location.search);
    
    // Asignar el centro activo
    searchParams.set('centro', slug);

    // Limpiar parámetros obsoletos
    searchParams.delete('empresa');
    searchParams.delete('cliente');
    searchParams.delete('perfil');

    if (!mantenerDemo) {
      searchParams.delete('demo');
    }

    const nuevaUrl = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({ perfil: perfilId }, '', nuevaUrl);
  } catch (e) {
    console.error('Error sincronizando URL del navegador:', e);
  }
}
