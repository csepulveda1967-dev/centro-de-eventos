import { InsumoMaestro, RecetaFichaTecnica, IngredienteReceta } from '../types';

/* =========================================================================================
   MAESTRO DE INSUMOS & VALORES REALES DE MERCADO
   =========================================================================================
   Aquí se definen los insumos base con su unidad de medida estándar y precio unitario de compra.
   Cualquier cambio aquí se refleja inmediatamente en el costo de las recetas y en las cotizaciones.
========================================================================================= */

export const INSUMOS_MAESTRO_INICIALES: InsumoMaestro[] = [
  // ── Carnes y Aves ──
  {
    id: 'ins-filete-res',
    nombre: 'Filete de Res Limpio (Vacuno)',
    categoria: 'carnes',
    unidadMedida: 'kg',
    precioCompra: 17500, // $17.500 / kg
    mermaPorcentaje: 8,
    proveedor: 'Frigorífico Central',
    ultimoCambio: '2026-10-20'
  },
  {
    id: 'ins-lomo-vetado',
    nombre: 'Lomo Vetado Angus',
    categoria: 'carnes',
    unidadMedida: 'kg',
    precioCompra: 14800,
    mermaPorcentaje: 10,
    proveedor: 'Frigorífico Central',
    ultimoCambio: '2026-10-18'
  },
  {
    id: 'ins-costillar-cerdo',
    nombre: 'Costillar de Cerdo Fresco',
    categoria: 'carnes',
    unidadMedida: 'kg',
    precioCompra: 7800,
    mermaPorcentaje: 15,
    proveedor: 'Carnes del Sur'
  },
  {
    id: 'ins-pechuga-pollo',
    nombre: 'Pechuga de Pollo Deshuesada',
    categoria: 'carnes',
    unidadMedida: 'kg',
    precioCompra: 5200,
    mermaPorcentaje: 5,
    proveedor: 'Avícola Santa Rosa'
  },
  {
    id: 'ins-cordero-lechal',
    nombre: 'Garrón / Pierna de Cordero',
    categoria: 'carnes',
    unidadMedida: 'kg',
    precioCompra: 16200,
    mermaPorcentaje: 20,
    proveedor: 'Magallanes Gourmet'
  },

  // ── Pescados y Mariscos ──
  {
    id: 'ins-salmon-fresco',
    nombre: 'Salmón Salar Fresco en Filete',
    categoria: 'pescados',
    unidadMedida: 'kg',
    precioCompra: 13900,
    mermaPorcentaje: 6,
    proveedor: 'Pescadería San Pedro'
  },
  {
    id: 'ins-reineta-fresca',
    nombre: 'Reineta Fresca Entera Limpia',
    categoria: 'pescados',
    unidadMedida: 'kg',
    precioCompra: 7900,
    mermaPorcentaje: 12,
    proveedor: 'Terminal Pesquero'
  },
  {
    id: 'ins-camaron-ecuatoriano',
    nombre: 'Camarón Ecuatoriano 36/40 Pelado y Desvenado',
    categoria: 'pescados',
    unidadMedida: 'kg',
    precioCompra: 11800,
    mermaPorcentaje: 2,
    proveedor: 'Congelados del Pacífico'
  },

  // ── Verduras y Frutas ──
  {
    id: 'ins-palta-hass',
    nombre: 'Palta Hass Primera',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 4800,
    mermaPorcentaje: 18, // Carozo y cáscara
    proveedor: 'La Vega Central'
  },
  {
    id: 'ins-cebolla-morada',
    nombre: 'Cebolla Morada Seleccionada',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 1400,
    mermaPorcentaje: 10,
    proveedor: 'La Vega Central'
  },
  {
    id: 'ins-champinon-paris',
    nombre: 'Champiñones París Frescos',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 4200,
    mermaPorcentaje: 5,
    proveedor: 'Champiñones Paine'
  },
  {
    id: 'ins-papas-chilotas',
    nombre: 'Papa Rústica / Chilota',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 1200,
    mermaPorcentaje: 10,
    proveedor: 'La Vega Central'
  },
  {
    id: 'ins-frutos-rojos',
    nombre: 'Frutos Rojos Mixtos (Frambuesas, Arándanos, Moras)',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 6500,
    mermaPorcentaje: 3,
    proveedor: 'Berries Chile'
  },
  {
    id: 'ins-limon-sutil',
    nombre: 'Limón Sutil Jugoso',
    categoria: 'verduras_frutas',
    unidadMedida: 'kg',
    precioCompra: 2100,
    mermaPorcentaje: 35, // Por cáscara al exprimir
    proveedor: 'La Vega Central'
  },

  // ── Lácteos y Huevos ──
  {
    id: 'ins-crema-leche',
    nombre: 'Crema de Leche Fresca 35% MG',
    categoria: 'lacteos_huevos',
    unidadMedida: 'L',
    precioCompra: 3900,
    mermaPorcentaje: 2,
    proveedor: 'Lácteos del Sur'
  },
  {
    id: 'ins-mantequilla',
    nombre: 'Mantequilla con Sal Primera Calidad',
    categoria: 'lacteos_huevos',
    unidadMedida: 'kg',
    precioCompra: 8400,
    mermaPorcentaje: 1,
    proveedor: 'Lácteos Colun'
  },
  {
    id: 'ins-parmesano-grana',
    nombre: 'Queso Parmesano Tipo Grana Reggiano',
    categoria: 'lacteos_huevos',
    unidadMedida: 'kg',
    precioCompra: 15900,
    mermaPorcentaje: 2,
    proveedor: 'Importadora Quesos'
  },
  {
    id: 'ins-huevos-campo',
    nombre: 'Huevos de Campo Extra Grandes',
    categoria: 'lacteos_huevos',
    unidadMedida: 'unidad',
    precioCompra: 220, // $220 por huevo
    mermaPorcentaje: 8,
    proveedor: 'Huevos Oro'
  },

  // ── Abarrotes y Granos ──
  {
    id: 'ins-arroz-risotto',
    nombre: 'Arroz Carnaroli / Arborio Italiano',
    categoria: 'abarrotes',
    unidadMedida: 'kg',
    precioCompra: 3800,
    mermaPorcentaje: 0,
    proveedor: 'Alimentos del Mundo'
  },
  {
    id: 'ins-azafran',
    nombre: 'Azafrán Español en Hebras (Cápsula)',
    categoria: 'abarrotes',
    unidadMedida: 'g',
    precioCompra: 4500, // $4.500 el gramo
    mermaPorcentaje: 0,
    proveedor: 'Especies Finas'
  },
  {
    id: 'ins-aceite-oliva',
    nombre: 'Aceite de Oliva Extra Virgen Reserva',
    categoria: 'abarrotes',
    unidadMedida: 'L',
    precioCompra: 9800,
    mermaPorcentaje: 1,
    proveedor: 'Olivar del Valle'
  },
  {
    id: 'ins-chocolate-belga',
    nombre: 'Chocolate Belga Amargo 70% Gotas',
    categoria: 'abarrotes',
    unidadMedida: 'kg',
    precioCompra: 14500,
    mermaPorcentaje: 1,
    proveedor: 'Chocolatería Belcolade'
  },

  // ── Licores y Vinos para Cocina ──
  {
    id: 'ins-vino-oporto',
    nombre: 'Vino Oporto Reserva para Reducciones',
    categoria: 'licores_bebidas',
    unidadMedida: 'L',
    precioCompra: 7200,
    mermaPorcentaje: 0,
    proveedor: 'Distribuidora Licores'
  },
  {
    id: 'ins-vino-reserva-tinto',
    nombre: 'Vino Tinto Cabernet Sauvignon Reserva',
    categoria: 'licores_bebidas',
    unidadMedida: 'L',
    precioCompra: 5400,
    mermaPorcentaje: 0,
    proveedor: 'Viña Valle Central'
  },

  // ── Coffee Break, Pastelería y Bebidas de Estación ──
  {
    id: 'ins-cafe-grano',
    nombre: 'Café de Grano Arábica Tostado Premium',
    categoria: 'abarrotes',
    unidadMedida: 'kg',
    precioCompra: 16000, // $16.000 / kg ($16 / g)
    mermaPorcentaje: 3,
    proveedor: 'Café & Grano Express'
  },
  {
    id: 'ins-tapaditos-ave',
    nombre: 'Tapaditos de Ave Pimentón Artesanales (Pan Brioche)',
    categoria: 'panaderia_pasteleria',
    unidadMedida: 'unidad',
    precioCompra: 850, // $850 cada tapadito
    mermaPorcentaje: 0,
    proveedor: 'Banquetería & Masas del Maipo'
  },
  {
    id: 'ins-mini-pasteleria',
    nombre: 'Mini Pastelería Fina Surtida (Macarons, Lemon Pie, Alfajores)',
    categoria: 'panaderia_pasteleria',
    unidadMedida: 'unidad',
    precioCompra: 600, // $600 cada bocado dulce
    mermaPorcentaje: 0,
    proveedor: 'Pastelería Francesa'
  },
  {
    id: 'ins-jugo-natural',
    nombre: 'Jugo Natural de Fruta Estacional del Valle (Pulpa 100%)',
    categoria: 'licores_bebidas',
    unidadMedida: 'L',
    precioCompra: 2800, // $2.800 el litro
    mermaPorcentaje: 2,
    proveedor: 'Frutas & Jugos Buin'
  },
  {
    id: 'ins-te-gourmet',
    nombre: 'Té Gourmet e Infusiones de Hierbas Seleccionadas',
    categoria: 'abarrotes',
    unidadMedida: 'unidad',
    precioCompra: 350, // $350 por sobre piramidal de seda
    mermaPorcentaje: 0,
    proveedor: 'Tea Selection Chile'
  }
];

/* =========================================================================================
   RECETAS MODELO & FICHAS TÉCNICAS (ESCANDALLOS GASTRONÓMICOS)
   =========================================================================================
   Cada receta está costeada por porción individual (o lote de porciones) basándose
   en los insumos del maestro.
========================================================================================= */

export function migrarRecetasAGramos(recetasList: RecetaFichaTecnica[]): RecetaFichaTecnica[] {
  return recetasList.map(rec => ({
    ...rec,
    ingredientes: rec.ingredientes.map(ing => {
      // Si la unidad es kg, convertir a gramos multiplicando por 1000
      if (ing.unidad === 'kg') {
        return {
          ...ing,
          cantidad: Math.round(ing.cantidad * 1000),
          unidad: 'g'
        };
      }
      return ing;
    })
  }));
}

export const RECETAS_INICIALES: RecetaFichaTecnica[] = [
  // ── 1. Fondo: Filete de Res al Oporto con Risotto al Azafrán ──
  {
    id: 'rec-filete-oporto-risotto',
    nombre: 'Filete de Res al Oporto con Risotto al Azafrán',
    tiempoMenu: 'fondo',
    categoria: 'Plato de Fondo Gourmet',
    rendimientoPorciones: 1, // Costo por 1 comensal
    margenSugerido: 33, // 33% Food Cost estándar de la gastronomía
    costoAdicionalElaboracion: 950, // Gas, fondos de cocción, sal marina, microgreens
    menuAsociadoId: 'menu-gala-3-tiempos',
    descripcionProcedimiento: 'Medallón de filete de 220g sellado al término deseado con reducción de oporto y champiñones sobre risotto cremoso al azafrán con parmesano grana.',
    ingredientes: [
      { id: 'ing-1', insumoId: 'ins-filete-res', cantidad: 220, unidad: 'g' }, // 220g filete
      { id: 'ing-2', insumoId: 'ins-vino-oporto', cantidad: 0.06, unidad: 'L' }, // 60ml oporto
      { id: 'ing-3', insumoId: 'ins-champinon-paris', cantidad: 70, unidad: 'g' }, // 70g champiñones
      { id: 'ing-4', insumoId: 'ins-arroz-risotto', cantidad: 80, unidad: 'g' }, // 80g arroz risotto
      { id: 'ing-5', insumoId: 'ins-azafran', cantidad: 1, unidad: 'g' }, // 1g azafrán
      { id: 'ing-6', insumoId: 'ins-mantequilla', cantidad: 30, unidad: 'g' }, // 30g mantequilla
      { id: 'ing-7', insumoId: 'ins-parmesano-grana', cantidad: 30, unidad: 'g' } // 30g parmesano
    ]
  },

  // ── 2. Entrada: Carpaccio de Salmón con Vinagreta de Maracuyá ──
  {
    id: 'rec-carpaccio-salmon',
    nombre: 'Carpaccio de Salmón Fresco con Vinagreta y Alcaparras',
    tiempoMenu: 'entrada',
    categoria: 'Entrada de Gala',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 600,
    menuAsociadoId: 'menu-gala-3-tiempos',
    descripcionProcedimiento: 'Láminas finas de salmón fresco curado suavemente con limón, aceite de oliva extra virgen, alcaparras y tostadas finas.',
    ingredientes: [
      { id: 'ing-8', insumoId: 'ins-salmon-fresco', cantidad: 140, unidad: 'g' }, // 140g salmón
      { id: 'ing-9', insumoId: 'ins-aceite-oliva', cantidad: 0.025, unidad: 'L' }, // 25ml oliva
      { id: 'ing-10', insumoId: 'ins-limon-sutil', cantidad: 50, unidad: 'g' }, // 50g limón
      { id: 'ing-11', insumoId: 'ins-palta-hass', cantidad: 60, unidad: 'g' } // 60g palta
    ]
  },

  // ── 3. Postre: Mousse de Chocolate Belga con Frutos Rojos ──
  {
    id: 'rec-mousse-chocolate-belga',
    nombre: 'Mousse de Chocolate Belga 70% con Coulis de Frutos Rojos',
    tiempoMenu: 'postre',
    categoria: 'Postre de Autor',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 450,
    menuAsociadoId: 'menu-gala-3-tiempos',
    descripcionProcedimiento: 'Mousse aireada de chocolate belga puro con reducción de frutos rojos silvestres y toque de menta fresca.',
    ingredientes: [
      { id: 'ing-12', insumoId: 'ins-chocolate-belga', cantidad: 70, unidad: 'g' }, // 70g chocolate
      { id: 'ing-13', insumoId: 'ins-crema-leche', cantidad: 0.08, unidad: 'L' }, // 80ml crema
      { id: 'ing-14', insumoId: 'ins-huevos-campo', cantidad: 2, unidad: 'unidad' }, // 2 unidades de huevo de campo
      { id: 'ing-15', insumoId: 'ins-frutos-rojos', cantidad: 50, unidad: 'g' } // 50g frutos rojos
    ]
  },

  // ── 4. Cóctel: Degustación de 6 Bocados Fríos y Calientes ──
  {
    id: 'rec-coctel-gala-bocados',
    nombre: 'Cóctel de Bienvenida (Ceviche Reineta, Brochetas & Gyozas)',
    tiempoMenu: 'coctel',
    categoria: 'Cóctel de Apertura',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 800,
    menuAsociadoId: 'menu-gala-3-tiempos',
    descripcionProcedimiento: 'Surtido de bocados de alta gama: cucharita de ceviche de reineta al cilantro, mini brochetas con camarón al ajillo y canapés finos.',
    ingredientes: [
      { id: 'ing-16', insumoId: 'ins-reineta-fresca', cantidad: 90, unidad: 'g' }, // 90g reineta
      { id: 'ing-17', insumoId: 'ins-camaron-ecuatoriano', cantidad: 60, unidad: 'g' }, // 60g camarón
      { id: 'ing-18', insumoId: 'ins-palta-hass', cantidad: 40, unidad: 'g' }, // 40g palta
      { id: 'ing-19', insumoId: 'ins-cebolla-morada', cantidad: 30, unidad: 'g' }, // 30g cebolla
      { id: 'ing-20', insumoId: 'ins-limon-sutil', cantidad: 60, unidad: 'g' } // 60g limón
    ]
  },

  // ── 5. Fondo Campestre: Lomo Angus con Costillar y Papas Rústicas ──
  {
    id: 'rec-asado-campestre-fondo',
    nombre: 'Parrillada Criolla: Lomo Vetado Angus, Costillar y Papas Rústicas',
    tiempoMenu: 'fondo',
    categoria: 'Parrillada Campestre',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 1100, // Carbón espino, leña de parra, chimichurri
    menuAsociadoId: 'menu-asado-campestre',
    descripcionProcedimiento: '350g de carne seleccionada a las brasas (lomo vetado y costillar dorado) con papas rústicas al romero fresco y chimichurri criollo.',
    ingredientes: [
      { id: 'ing-21', insumoId: 'ins-lomo-vetado', cantidad: 200, unidad: 'g' }, // 200g lomo vetado (criterio de cocina real)
      { id: 'ing-22', insumoId: 'ins-costillar-cerdo', cantidad: 160, unidad: 'g' }, // 160g costillar
      { id: 'ing-23', insumoId: 'ins-papas-chilotas', cantidad: 200, unidad: 'g' }, // 200g papas rústicas
      { id: 'ing-24', insumoId: 'ins-cebolla-morada', cantidad: 50, unidad: 'g' }, // 50g cebolla
      { id: 'ing-25', insumoId: 'ins-aceite-oliva', cantidad: 0.02, unidad: 'L' }
    ]
  },

  // ── 6. Coffee Break / Coctelería: Estación Gourmet Coffee Break ──
  {
    id: 'rec-coffee-break-estacion',
    nombre: 'Coffee Break & Coctelería Dulce y Salada',
    tiempoMenu: 'coffee-break',
    categoria: 'Servicio Alternativo',
    rendimientoPorciones: 1, // Costo unitario por persona ($5.450)
    margenSugerido: 33,
    costoAdicionalElaboracion: 824, // Gas, servilletas, azúcar/endulzante, menaje y montaje
    servicioAsociadoId: 'coffee-break-cocteleria',
    descripcionProcedimiento: 'Estación completa de café en grano recién molido, tés gourmet en hebras, tapaditos artesanales de ave pimentón y bocados dulces de pastelería fina.',
    ingredientes: [
      { id: 'ing-cb-1', insumoId: 'ins-tapaditos-ave', cantidad: 2, unidad: 'unidad' }, // 2 tapaditos/pax ($1.700)
      { id: 'ing-cb-2', insumoId: 'ins-mini-pasteleria', cantidad: 3, unidad: 'unidad' }, // 3 bocados dulces/pax ($1.800)
      { id: 'ing-cb-3', insumoId: 'ins-cafe-grano', cantidad: 25, unidad: 'g' }, // 25g café en grano ($412 con merma)
      { id: 'ing-cb-4', insumoId: 'ins-jugo-natural', cantidad: 0.25, unidad: 'L' } // 250ml jugo natural ($714 con merma)
    ]
  }
];

/* =========================================================================================
   FUNCIONES DE CÁLCULO GASTRONÓMICO AUTOMÁTICO
   ========================================================================================= */

// Calcula el costo de una línea de ingrediente según el insumo maestro y su merma
export function calcularCostoIngrediente(
  ingrediente: IngredienteReceta,
  insumo: InsumoMaestro | undefined
): { costoNeto: number; mermaFactor: number; costoReal: number } {
  if (!insumo) return { costoNeto: 0, mermaFactor: 1, costoReal: 0 };

  const mermaPct = ingrediente.mermaEspecifica ?? insumo.mermaPorcentaje;
  const factorRendimiento = 1 - mermaPct / 100;
  const factorMermaMultiplicador = factorRendimiento > 0 ? 1 / factorRendimiento : 1;

  let costoNeto = 0;

  // AJUSTE CRITERIO DE COCINA REAL EN GRAMOS:
  // Si el insumo está en kg ($/kg) y el ingrediente se mide en gramos (g):
  // Precio por gramo = insumo.precioCompra / 1000 (ej. $14.800/kg -> $14,8/g)
  if (insumo.unidadMedida === 'kg' && ingrediente.unidad === 'g') {
    const precioPorGramo = insumo.precioCompra / 1000;
    costoNeto = ingrediente.cantidad * precioPorGramo;
  } else if (insumo.unidadMedida === 'kg' && ingrediente.unidad === 'kg') {
    costoNeto = ingrediente.cantidad * insumo.precioCompra;
  } else if (insumo.unidadMedida === 'g' && ingrediente.unidad === 'g') {
    costoNeto = ingrediente.cantidad * insumo.precioCompra;
  } else if (insumo.unidadMedida === 'g' && ingrediente.unidad === 'kg') {
    costoNeto = (ingrediente.cantidad * 1000) * insumo.precioCompra;
  } else if (insumo.unidadMedida === 'L' && ingrediente.unidad === 'ml') {
    const precioPorMl = insumo.precioCompra / 1000;
    costoNeto = ingrediente.cantidad * precioPorMl;
  } else if (insumo.unidadMedida === 'L' && ingrediente.unidad === 'L') {
    costoNeto = ingrediente.cantidad * insumo.precioCompra;
  } else if (insumo.unidadMedida === 'ml' && ingrediente.unidad === 'L') {
    costoNeto = (ingrediente.cantidad * 1000) * insumo.precioCompra;
  } else {
    // Unidades naturales (unidad, piezas, etc.)
    costoNeto = ingrediente.cantidad * insumo.precioCompra;
  }

  const costoReal = costoNeto * factorMermaMultiplicador;

  return {
    costoNeto: Math.round(costoNeto),
    mermaFactor: factorMermaMultiplicador,
    costoReal: Math.round(costoReal)
  };
}

// Calcula el costo total de la receta y el costo unitario por porción
export function calcularCostoReceta(
  receta: RecetaFichaTecnica,
  insumos: InsumoMaestro[]
): {
  costoMateriaPrima: number;
  costoAdicional: number;
  costoTotalReceta: number;
  costoPorPorcion: number;
  precioSugeridoVenta: number;
  utilidadPorPorcion: number;
} {
  const insumosMap = new Map<string, InsumoMaestro>(insumos.map(i => [i.id, i]));

  const costoMateriaPrima = receta.ingredientes.reduce((sum, ing) => {
    const ins = insumosMap.get(ing.insumoId);
    const { costoReal } = calcularCostoIngrediente(ing, ins);
    return sum + costoReal;
  }, 0);

  const costoAdicional = receta.costoAdicionalElaboracion || 0;
  const costoTotalReceta = costoMateriaPrima + costoAdicional;
  const porciones = receta.rendimientoPorciones > 0 ? receta.rendimientoPorciones : 1;
  const costoPorPorcion = Math.round(costoTotalReceta / porciones);

  // Fórmula gastronómica: Si margen gastronómico es 33%, precio venta = Costo / (Margen/100)
  // O con Markup sobre costo: Si margen es 33%, Markup = Costo * (1 + 0.33) o Precio = Costo / 0.33
  // En gastronomía profesional:
  // "Food Cost del 33%" significa que el costo representa el 33% del precio de venta -> Precio = Costo / 0.33 (~3x costo)
  // O margen bruto del 33%: Precio = Costo * 1.33.
  // Brindamos el cálculo estándar de Food Cost 33%:
  const margen = receta.margenSugerido > 0 ? receta.margenSugerido : 33;
  const precioSugeridoVenta = Math.round(costoPorPorcion / (margen / 100));
  const utilidadPorPorcion = precioSugeridoVenta - costoPorPorcion;

  return {
    costoMateriaPrima: Math.round(costoMateriaPrima),
    costoAdicional,
    costoTotalReceta: Math.round(costoTotalReceta),
    costoPorPorcion,
    precioSugeridoVenta,
    utilidadPorPorcion
  };
}

// Calcula el costo total de un menú sumando las recetas asociadas a él
export function calcularCostoMenuDesdeRecetas(
  menuId: string,
  recetas: RecetaFichaTecnica[],
  insumos: InsumoMaestro[]
): { costoMenuCalculado: number; recetasEncontradas: number } {
  const recetasDelMenu = recetas.filter(r => r.menuAsociadoId === menuId && r.tiempoMenu !== 'coffee-break');

  if (recetasDelMenu.length === 0) {
    return { costoMenuCalculado: 0, recetasEncontradas: 0 };
  }

  const costoMenuCalculado = recetasDelMenu.reduce((total, receta) => {
    const { costoPorPorcion } = calcularCostoReceta(receta, insumos);
    return total + costoPorPorcion;
  }, 0);

  return {
    costoMenuCalculado: Math.round(costoMenuCalculado),
    recetasEncontradas: recetasDelMenu.length
  };
}
