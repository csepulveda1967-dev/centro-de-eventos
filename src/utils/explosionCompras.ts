import { CotizacionState, MenuOption, RecetaFichaTecnica, InsumoMaestro } from '../types';

export interface ItemExplosionCompra {
  insumoId: string;
  insumoNombre: string;
  categoria: InsumoMaestro['categoria'];
  proveedor: string;
  unidadMedida: string;
  cantidadNetaTotal: number; // Suma neta requerida por las recetas
  mermaPromedio: number; // Factor de merma estimado %
  cantidadBrutaAComprar: number; // Cantidad final considerando merma
  precioUnitarioCompra: number; // Precio de compra CLP por unidad
  costoTotalCompra: number; // Monto estimado a desembolsar
  recetasDondeAparece: string[]; // Nombres de recetas que usan este insumo
}

export interface ResumenExplosionCompras {
  items: ItemExplosionCompra[];
  costoTotalInsumos: number;
  totalKilosCarnes: number;
  totalKilosVerduras: number;
  totalKilosPescados: number;
  proveedoresUnicos: string[];
  itemsPorProveedor: Record<string, ItemExplosionCompra[]>;
  itemsPorCategoria: Record<string, ItemExplosionCompra[]>;
}

/**
 * Normaliza cantidades a la unidad base de compra del insumo:
 * Si el insumo se compra por 'kg' y la receta pide en 'g', divide por 1000.
 * Si el insumo se compra por 'L' y la receta pide en 'ml', divide por 1000.
 */
function normalizarCantidadAReferencia(
  cantidad: number,
  unidadReceta: string,
  unidadInsumo: string
): number {
  if (unidadInsumo === 'kg' && unidadReceta === 'g') {
    return cantidad / 1000;
  }
  if (unidadInsumo === 'L' && unidadReceta === 'ml') {
    return cantidad / 1000;
  }
  if (unidadInsumo === 'g' && unidadReceta === 'kg') {
    return cantidad * 1000;
  }
  if (unidadInsumo === 'ml' && unidadReceta === 'L') {
    return cantidad * 1000;
  }
  return cantidad;
}

/**
 * Calcula la explosión completa de insumos requeridos para un evento,
 * escalando las recetas vinculadas al menú según la cantidad de invitados.
 */
export function calcularExplosionInsumos(
  cotizacion: CotizacionState,
  menus: MenuOption[],
  recetas: RecetaFichaTecnica[],
  insumos: InsumoMaestro[]
): ResumenExplosionCompras {
  const insumosMap = new Map<string, InsumoMaestro>(insumos.map(i => [i.id, i]));
  const menuActual = menus.find(m => m.id === cotizacion.menuId) || menus[0];
  
  // Buscar recetas asociadas al menú (por menuAsociadoId o por recetasIds)
  let recetasDelMenu = recetas.filter(r => r.menuAsociadoId === cotizacion.menuId);
  if (recetasDelMenu.length === 0 && menuActual?.recetasIds && menuActual.recetasIds.length > 0) {
    const idsSet = new Set(menuActual.recetasIds);
    recetasDelMenu = recetas.filter(r => idsSet.has(r.id));
  }
  // Si aún no hay recetas directamente mapeadas, usamos todas las recetas activas para dar una estimación representativa
  if (recetasDelMenu.length === 0) {
    recetasDelMenu = recetas.slice(0, 5);
  }

  const acumulador = new Map<string, {
    insumo: InsumoMaestro;
    cantidadNeta: number;
    mermaSum: number;
    mermaCount: number;
    recetasNombres: Set<string>;
  }>();

  const invitados = Math.max(1, cotizacion.invitados || 100);

  recetasDelMenu.forEach(receta => {
    const rendimiento = receta.rendimientoPorciones > 0 ? receta.rendimientoPorciones : 1;
    const multiplicadorEvento = invitados / rendimiento;

    receta.ingredientes.forEach(ing => {
      const insumo = insumosMap.get(ing.insumoId);
      if (!insumo) return;

      const cantidadNormalizada = normalizarCantidadAReferencia(ing.cantidad, ing.unidad, insumo.unidadMedida);
      const cantidadNetaEvento = cantidadNormalizada * multiplicadorEvento;
      const mermaEfectiva = ing.mermaEspecifica !== undefined ? ing.mermaEspecifica : insumo.mermaPorcentaje;

      const itemPrevio = acumulador.get(insumo.id);
      if (itemPrevio) {
        itemPrevio.cantidadNeta += cantidadNetaEvento;
        itemPrevio.mermaSum += mermaEfectiva;
        itemPrevio.mermaCount += 1;
        itemPrevio.recetasNombres.add(receta.nombre);
      } else {
        acumulador.set(insumo.id, {
          insumo,
          cantidadNeta: cantidadNetaEvento,
          mermaSum: mermaEfectiva,
          mermaCount: 1,
          recetasNombres: new Set([receta.nombre])
        });
      }
    });
  });

  const items: ItemExplosionCompra[] = [];
  let costoTotalInsumos = 0;
  let totalKilosCarnes = 0;
  let totalKilosVerduras = 0;
  let totalKilosPescados = 0;

  acumulador.forEach(val => {
    const { insumo, cantidadNeta, mermaSum, mermaCount, recetasNombres } = val;
    const mermaPromedio = mermaCount > 0 ? mermaSum / mermaCount : insumo.mermaPorcentaje;
    
    // Cantidad bruta = neta / (1 - merma) o neta * (1 + merma/100)
    // En compras de hostelería: Bruto = Neto * (1 + merma/100)
    const factorMerma = 1 + (mermaPromedio / 100);
    const cantidadBruta = cantidadNeta * factorMerma;
    
    // Redondear a 2 decimales para pesos y líquidos, o entero para unidades
    const cantidadBrutaRedondeada = insumo.unidadMedida === 'unidad' || insumo.unidadMedida === 'paquete'
      ? Math.ceil(cantidadBruta)
      : Number(cantidadBruta.toFixed(2));

    const costoTotalCompra = Math.round(cantidadBrutaRedondeada * insumo.precioCompra);

    costoTotalInsumos += costoTotalCompra;

    if (insumo.categoria === 'carnes' && (insumo.unidadMedida === 'kg' || insumo.unidadMedida === 'g')) {
      totalKilosCarnes += insumo.unidadMedida === 'g' ? cantidadBrutaRedondeada / 1000 : cantidadBrutaRedondeada;
    }
    if (insumo.categoria === 'verduras_frutas' && (insumo.unidadMedida === 'kg' || insumo.unidadMedida === 'g')) {
      totalKilosVerduras += insumo.unidadMedida === 'g' ? cantidadBrutaRedondeada / 1000 : cantidadBrutaRedondeada;
    }
    if (insumo.categoria === 'pescados' && (insumo.unidadMedida === 'kg' || insumo.unidadMedida === 'g')) {
      totalKilosPescados += insumo.unidadMedida === 'g' ? cantidadBrutaRedondeada / 1000 : cantidadBrutaRedondeada;
    }

    items.push({
      insumoId: insumo.id,
      insumoNombre: insumo.nombre,
      categoria: insumo.categoria,
      proveedor: insumo.proveedor || 'Proveedor General',
      unidadMedida: insumo.unidadMedida,
      cantidadNetaTotal: Number(cantidadNeta.toFixed(2)),
      mermaPromedio: Math.round(mermaPromedio),
      cantidadBrutaAComprar: cantidadBrutaRedondeada,
      precioUnitarioCompra: insumo.precioCompra,
      costoTotalCompra,
      recetasDondeAparece: Array.from(recetasNombres)
    });
  });

  // Ordenar por costo total descendente
  items.sort((a, b) => b.costoTotalCompra - a.costoTotalCompra);

  // Agrupar por proveedor y categoría
  const itemsPorProveedor: Record<string, ItemExplosionCompra[]> = {};
  const itemsPorCategoria: Record<string, ItemExplosionCompra[]> = {};
  const proveedoresSet = new Set<string>();

  items.forEach(item => {
    proveedoresSet.add(item.proveedor);

    if (!itemsPorProveedor[item.proveedor]) {
      itemsPorProveedor[item.proveedor] = [];
    }
    itemsPorProveedor[item.proveedor].push(item);

    if (!itemsPorCategoria[item.categoria]) {
      itemsPorCategoria[item.categoria] = [];
    }
    itemsPorCategoria[item.categoria].push(item);
  });

  return {
    items,
    costoTotalInsumos,
    totalKilosCarnes: Number(totalKilosCarnes.toFixed(1)),
    totalKilosVerduras: Number(totalKilosVerduras.toFixed(1)),
    totalKilosPescados: Number(totalKilosPescados.toFixed(1)),
    proveedoresUnicos: Array.from(proveedoresSet),
    itemsPorProveedor,
    itemsPorCategoria
  };
}

/**
 * Genera el texto formateado para WhatsApp para enviar la orden de compra a un proveedor específico.
 */
export function generarMensajePedidoProveedor(
  proveedor: string,
  items: ItemExplosionCompra[],
  nombreEvento: string,
  invitados: number,
  fechaEvento: string,
  empresaNombre: string
): string {
  const fechaTexto = new Date(fechaEvento).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const subtotal = items.reduce((s, it) => s + it.costoTotalCompra, 0);

  const lineasItems = items.map(it => 
    `• *${it.insumoNombre}*: ${it.cantidadBrutaAComprar} ${it.unidadMedida} (Ref: $${it.precioUnitarioCompra.toLocaleString('es-CL')}/${it.unidadMedida})`
  ).join('\n');

  return `📦 *ORDEN DE COMPRA - ${empresaNombre.toUpperCase()}* 📦\n` +
    `Estimados *${proveedor}*,\n\n` +
    `Solicitamos cotización formal y confirmación de despacho para el siguiente evento:\n` +
    `📌 *Evento:* ${nombreEvento}\n` +
    `👥 *Comensales:* ${invitados} invitados\n` +
    `📅 *Fecha Requerida de Despacho:* ${fechaTexto}\n\n` +
    `📝 *DETALLE DE INSUMOS REQUERIDOS (con merma de cocina calculada):*\n` +
    `${lineasItems}\n\n` +
    `💰 *Monto Estimado Referencial:* $${subtotal.toLocaleString('es-CL')} CLP\n\n` +
    `Favor confirmar disponibilidad de stock y fecha de entrega.\n` +
    `_Emitido desde Dominga Eventos & Producción Gastronómica._`;
}

/**
 * Genera el contenido CSV exportable para Excel de toda la lista de compras.
 */
export function generarCSVExplosionCompras(
  items: ItemExplosionCompra[],
  nombreEvento: string,
  invitados: number
): string {
  const header = ['Insumo', 'Categoría', 'Proveedor', 'Cantidad Neta', 'Merma (%)', 'Cantidad a Comprar (Bruto)', 'Unidad', 'Precio Unitario (CLP)', 'Subtotal Compra (CLP)', 'Recetas'].join(';');
  
  const filas = items.map(it => [
    `"${it.insumoNombre.replace(/"/g, '""')}"`,
    `"${it.categoria}"`,
    `"${it.proveedor.replace(/"/g, '""')}"`,
    it.cantidadNetaTotal,
    `${it.mermaPromedio}%`,
    it.cantidadBrutaAComprar,
    it.unidadMedida,
    it.precioUnitarioCompra,
    it.costoTotalCompra,
    `"${it.recetasDondeAparece.join(', ').replace(/"/g, '""')}"`
  ].join(';'));

  return `RESUMEN DE COMPRAS E INSUMOS - ${nombreEvento.toUpperCase()} (${invitados} INVITADOS)\n\n` +
    [header, ...filas].join('\n');
}
