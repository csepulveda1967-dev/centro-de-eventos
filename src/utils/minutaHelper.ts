import { MenuOption, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { recetaPerteneceAMenu, calcularCostoReceta, formatearNombreTiempoMenu } from '../config/insumosYRecetas';
import { formatMoneda } from './formatters';

// Orden estándar de los tiempos de un menú
export const ORDEN_TIEMPOS_MENU = [
  'coctel',
  'entrada',
  'fondo',
  'postre',
  'trasnoche'
] as const;

// Mapea el id de tiempo a la clave del campo en menu.tiempos
const TIEMPO_A_CAMPO: Record<string, keyof MenuOption['tiempos']> = {
  coctel: 'coctel',
  entrada: 'entrada',
  fondo: 'fondo',
  postre: 'postre',
  trasnoche: 'trasnoche',
  // Alias comunes que vienen de las fichas
  cocktail: 'coctel',
  bienvenida: 'coctel',
  'plato-fondo': 'fondo',
  plato: 'fondo',
  principal: 'fondo',
  bajon: 'trasnoche',
  bajonativo: 'trasnoche',
  'coffee-break': 'coctel' // coffee-break no tributa a menú, pero si llega aquí va a cóctel
};

export interface TiempoMinuta {
  tiempoId: string;        // 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche'
  tiempoLabel: string;     // 'Cóctel de Bienvenida', 'Entrada', etc.
  textoManual: string;     // Lo que el usuario escribió a mano en el menú
  fichas: RecetaFichaTecnica[]; // Fichas técnicas vinculadas a este menú y a este tiempo
  tieneContenido: boolean; // textoManual no vacío O fichas.length > 0
  ocultoManual: boolean;   // El usuario marcó este tiempo como "oculto" en Editar Menú
}

// Construye la minuta de un menú combinando texto manual + fichas técnicas vinculadas.
// Las fichas de tragos (tiempoMenu === 'cocteleria') se agrupan bajo el tiempo "coctel".
export function construirMinutaConFichas(
  menu: MenuOption,
  recetas: RecetaFichaTecnica[],
  insumos: InsumoMaestro[]
): TiempoMinuta[] {
  if (!menu) return [];

  // Fichas vinculadas a este menú (excluyendo coffee-break que tributa a Tarifas)
  const fichasDelMenu = recetas.filter(r => recetaPerteneceAMenu(r, menu.id));

  const resultado: TiempoMinuta[] = ORDEN_TIEMPOS_MENU.map(tiempoId => {
    const campo = TIEMPO_A_CAMPO[tiempoId] || tiempoId;
    const textoManual = (menu.tiempos?.[campo] || '').trim();

    // Fichas cuyo tiempoMenu coincide con este tiempo (con alias)
    const fichasDeEsteTiempo = fichasDelMenu.filter(r => {
      const t = (r.tiempoMenu || '').toLowerCase().trim();
      const destino = TIEMPO_A_CAMPO[t] || t;
      return destino === tiempoId;
    });

    return {
      tiempoId,
      tiempoLabel: formatearNombreTiempoMenu(tiempoId),
      textoManual,
      fichas: fichasDeEsteTiempo,
      tieneContenido: textoManual !== '' || fichasDeEsteTiempo.length > 0,
      ocultoManual: Boolean(menu.tiemposOcultos?.[campo])
    };
  });

  // Tragos (tiempoMenu === 'cocteleria') → se suman al tiempo 'coctel'
  const tragos = fichasDelMenu.filter(r => (r.tiempoMenu || '').toLowerCase() === 'cocteleria');
  if (tragos.length > 0) {
    const idxCoctel = resultado.findIndex(t => t.tiempoId === 'coctel');
    if (idxCoctel >= 0) {
      resultado[idxCoctel] = {
        ...resultado[idxCoctel],
        fichas: [...resultado[idxCoctel].fichas, ...tragos],
        tieneContenido: true
      };
    }
  }

  // Fichas con categorías o tiempos personalizados (ej: 'CAFE - TE - AGUA HIERBAS', 'Cafetería', etc.)
  const fichasPersonalizadas = fichasDelMenu.filter(r => {
    const t = (r.tiempoMenu || '').toLowerCase().trim();
    if (t === 'cocteleria') return false; // ya procesado en coctel
    const destino = TIEMPO_A_CAMPO[t] || t;
    return !ORDEN_TIEMPOS_MENU.includes(destino as any);
  });

  if (fichasPersonalizadas.length > 0) {
    const gruposPers = new Map<string, RecetaFichaTecnica[]>();
    fichasPersonalizadas.forEach(r => {
      const etiqueta = r.tiempoMenu || r.categoria || 'Estación Adicional';
      const lista = gruposPers.get(etiqueta) || [];
      lista.push(r);
      gruposPers.set(etiqueta, lista);
    });

    gruposPers.forEach((fichasGrupo, etiqueta) => {
      resultado.push({
        tiempoId: 'custom-' + etiqueta.toLowerCase().replace(/\s+/g, '_'),
        tiempoLabel: etiqueta,
        textoManual: '',
        fichas: fichasGrupo,
        tieneContenido: fichasGrupo.length > 0,
        ocultoManual: false
      });
    });
  }

  return resultado;
}

// Genera una versión de texto plano de la minuta (para WhatsApp, PDF, etc.)
export function minutaATexto(
  menu: MenuOption,
  recetas: RecetaFichaTecnica[],
  insumos: InsumoMaestro[],
  opts?: { incluirCostoPorPlato?: boolean; incluirAvisoTiemposVacios?: boolean }
): string {
  const tiempos = construirMinutaConFichas(menu, recetas, insumos);
  const incluirCosto = opts?.incluirCostoPorPlato ?? false;
  const lineas: string[] = [];

  tiempos.forEach(t => {
    if (t.ocultoManual) return; // El usuario marcó este tiempo como oculto → no se muestra
    if (!t.tieneContenido) {
      if (opts?.incluirAvisoTiemposVacios) {
        lineas.push(`• ${t.tiempoLabel}: (no incluido en este menú)`);
      }
      return;
    }
    if (t.textoManual) {
      lineas.push(`• ${t.tiempoLabel}: ${t.textoManual}`);
    }
    if (t.fichas.length > 0) {
      const etiqueta = t.textoManual ? '   · Fichas: ' : `• ${t.tiempoLabel}: `;
      const nombres = t.fichas.map(f => {
        const calc = calcularCostoReceta(f, insumos);
        return incluirCosto
          ? `${f.nombre} (${formatMoneda(calc.costoPorPorcion)}/porción)`
          : f.nombre;
      }).join(', ');
      lineas.push(`${etiqueta}${nombres}`);
    }
  });

  return lineas.join('\n');
}

// Booleano: ¿hay al menos un tiempo con contenido y NO oculto manualmente? (para decidir si mostrar la minuta)
export function minutaTieneContenido(menu: MenuOption, recetas: RecetaFichaTecnica[]): boolean {
  if (!menu) return false;
  const tiempos = construirMinutaConFichas(menu, recetas, []);
  return tiempos.some(t => t.tieneContenido && !t.ocultoManual);
}
