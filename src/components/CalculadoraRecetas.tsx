import React, { useState, useMemo } from 'react';
import { RecetaFichaTecnica, InsumoMaestro, MenuOption, IngredienteReceta } from '../types';
import {
  calcularCostoReceta,
  calcularCostoIngrediente,
  calcularCostoMenuDesdeRecetas,
  calcularDesglosePorCategoria,
  formatearNombreCategoria,
  obtenerColorCategoria
} from '../config/insumosYRecetas';
import { formatMoneda, formatPorcentaje, formatPrecioUnitario } from '../utils/formatters';
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  Info,
  Scale,
  Coffee,
  Link as LinkIcon,
  Tag,
  Filter,
  PieChart
} from 'lucide-react';

interface CalculadoraRecetasProps {
  recetas: RecetaFichaTecnica[];
  insumos: InsumoMaestro[];
  menus: MenuOption[];
  invitados?: number;
  onUpdateReceta: (recetaActualizada: RecetaFichaTecnica) => void;
  onAddReceta: (nuevaReceta: RecetaFichaTecnica) => void;
  onDeleteReceta: (id: string) => void;
  onSincronizarCostosMenu: (menuId: string, nuevoCosto: number) => void;
  onVincularCoffeeBreak?: (receta: RecetaFichaTecnica, costoPorPorcion: number, precioSugerido: number) => void;
}

export const CalculadoraRecetas: React.FC<CalculadoraRecetasProps> = ({
  recetas,
  insumos,
  menus,
  invitados = 100,
  onUpdateReceta,
  onAddReceta,
  onDeleteReceta,
  onSincronizarCostosMenu,
  onVincularCoffeeBreak
}) => {
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string>(recetas[0]?.id || '');
  const [toastSync, setToastSync] = useState<string | null>(null);

  // Insumo a añadir en la receta activa
  const insumosMap = new Map<string, InsumoMaestro>(insumos.map(i => [i.id, i]));
  const primerInsumo = insumos[0];
  const [insumoToAddId, setInsumoToAddId] = useState<string>(primerInsumo?.id || '');
  const [cantidadToAdd, setCantidadToAdd] = useState<number>(primerInsumo?.unidadMedida === 'kg' ? 200 : 1);
  const [unidadToAdd, setUnidadToAdd] = useState<'kg' | 'g' | 'L' | 'ml' | 'unidad'>(
    primerInsumo?.unidadMedida === 'kg' ? 'g' : (primerInsumo?.unidadMedida as any || 'g')
  );

  // Modal para nueva receta
  const [modalNuevaRecetaOpen, setModalNuevaRecetaOpen] = useState(false);
  const [nuevoNombreReceta, setNuevoNombreReceta] = useState('');
  const [nuevoTiempoReceta, setNuevoTiempoReceta] = useState<RecetaFichaTecnica['tiempoMenu']>('fondo');
  const [nuevoMenuAsociadoId, setNuevoMenuAsociadoId] = useState<string>(menus[0]?.id || '');

  const recetaActiva = recetas.find(r => r.id === recetaSeleccionadaId) || recetas[0];

  const calculosReceta = recetaActiva
    ? calcularCostoReceta(recetaActiva, insumos)
    : {
        costoMateriaPrima: 0,
        costoAdicional: 0,
        costoTotalReceta: 0,
        costoPorPorcion: 0,
        precioSugeridoVenta: 0,
        utilidadPorPorcion: 0
      };

  // Menú vinculado a la receta activa
  const menuVinculado = menus.find(m => m.id === recetaActiva?.menuAsociadoId);
  const calculoMenuCompleto = menuVinculado
    ? calcularCostoMenuDesdeRecetas(menuVinculado.id, recetas, insumos)
    : { costoMenuCalculado: 0, recetasEncontradas: 0 };

  // Filtro de categorías para añadir ingredientes desde el maestro
  const [categoriaFiltroIngrediente, setCategoriaFiltroIngrediente] = useState<string>('todas');

  // Categorías presentes en los insumos (tanto predeterminadas como creadas en forma libre)
  const categoriasDisponibles = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const ins of insumos) {
      const cat = ins.categoria || 'otros';
      const catKey = cat.toLowerCase();
      if (!map.has(catKey)) {
        map.set(catKey, {
          id: cat,
          label: formatearNombreCategoria(cat),
          count: 0
        });
      }
      map.get(catKey)!.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [insumos]);

  // Insumos filtrados por la categoría seleccionada para agregar a la receta
  const insumosParaAgregar = useMemo(() => {
    if (categoriaFiltroIngrediente === 'todas') {
      return insumos;
    }
    return insumos.filter(i => (i.categoria || '').toLowerCase() === categoriaFiltroIngrediente.toLowerCase());
  }, [insumos, categoriaFiltroIngrediente]);

  // Si cambia el filtro y el insumo seleccionado ya no está en la lista filtrada, actualizarlo
  const handleCambioCategoriaFiltro = (nuevaCat: string) => {
    setCategoriaFiltroIngrediente(nuevaCat);
    const listaFiltrada = nuevaCat === 'todas'
      ? insumos
      : insumos.filter(i => (i.categoria || '').toLowerCase() === nuevaCat.toLowerCase());

    if (listaFiltrada.length > 0 && !listaFiltrada.some(i => i.id === insumoToAddId)) {
      const primerItem = listaFiltrada[0];
      setInsumoToAddId(primerItem.id);
      if (primerItem.unidadMedida === 'kg') {
        setUnidadToAdd('g');
        setCantidadToAdd(200);
      } else if (primerItem.unidadMedida === 'unidad') {
        setUnidadToAdd('unidad');
        setCantidadToAdd(2);
      } else {
        setUnidadToAdd(primerItem.unidadMedida as any || 'g');
        setCantidadToAdd(1);
      }
    }
  };

  // Desglose del costo de la receta activa según las categorías de sus insumos
  const desgloseCategorias = useMemo(() => {
    if (!recetaActiva) return [];
    return calcularDesglosePorCategoria(recetaActiva, insumos);
  }, [recetaActiva, insumos]);

  const notificar = (msg: string) => {
    setToastSync(msg);
    setTimeout(() => setToastSync(null), 3000);
  };

  // Agregar ingrediente a la receta activa
  const handleAddIngrediente = () => {
    if (!recetaActiva) return;
    const insumoElegido = insumosMap.get(insumoToAddId);
    if (!insumoElegido) return;

    // Criterio de cocina real: si el insumo se mide en peso, se almacena en gramos (g)
    const esPeso = insumoElegido.unidadMedida === 'kg' || unidadToAdd === 'g' || unidadToAdd === 'kg';
    const unidadFinal = esPeso ? 'g' : unidadToAdd;
    const cantidadFinal = esPeso
      ? (unidadToAdd === 'kg' ? Math.round(cantidadToAdd * 1000) : Math.max(1, Math.round(cantidadToAdd)))
      : (unidadToAdd === 'unidad' ? Math.max(1, Math.round(cantidadToAdd)) : Math.max(0.001, cantidadToAdd));

    const nuevoIngrediente: IngredienteReceta = {
      id: 'ing-' + Date.now(),
      insumoId: insumoToAddId,
      cantidad: cantidadFinal,
      unidad: unidadFinal
    };

    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: [...recetaActiva.ingredientes, nuevoIngrediente]
    };

    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
    notificar(`✓ Ingrediente "${insumoElegido.nombre}" agregado (${cantidadFinal} ${unidadFinal})`);
  };

  // Helper para mantener sincronizado Coffee Break en Tarifas Generales
  const syncSiEsCoffeeBreak = (recetaModificada: RecetaFichaTecnica) => {
    if (recetaModificada.tiempoMenu === 'coffee-break' && onVincularCoffeeBreak) {
      const calc = calcularCostoReceta(recetaModificada, insumos);
      onVincularCoffeeBreak(recetaModificada, calc.costoPorPorcion, calc.precioSugeridoVenta);
    }
  };

  // Quitar ingrediente
  const handleRemoveIngrediente = (ingId: string) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: recetaActiva.ingredientes.filter(i => i.id !== ingId)
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Cambiar cantidad de ingrediente existente
  const handleCantidadIngredienteChange = (ingId: string, nuevaCantidad: number) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: recetaActiva.ingredientes.map(i =>
        i.id === ingId ? { ...i, cantidad: Math.max(0, nuevaCantidad) } : i
      )
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Cambiar margen gastronómico de la receta activa
  const handleMargenChange = (nuevoMargen: number) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      margenSugerido: Math.max(5, Math.min(80, nuevoMargen))
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Sincronizar el costo resultante de las recetas al menú del cotizador
  const handleSincronizarAlCotizador = () => {
    if (!menuVinculado) return;
    const { costoMenuCalculado } = calcularCostoMenuDesdeRecetas(menuVinculado.id, recetas, insumos);
    onSincronizarCostosMenu(menuVinculado.id, costoMenuCalculado);
    notificar(`✓ Costo de "${menuVinculado.nombre}" actualizado a ${formatMoneda(costoMenuCalculado)} en el Cotizador`);
  };

  // Sincronizar explícitamente a Tarifas Generales
  const handleSincronizarCoffeeBreak = () => {
    if (!recetaActiva || recetaActiva.tiempoMenu !== 'coffee-break') return;
    if (onVincularCoffeeBreak) {
      onVincularCoffeeBreak(recetaActiva, calculosReceta.costoPorPorcion, calculosReceta.precioSugeridoVenta);
      notificar(`✓ Tarjeta de Coffee Break actualizada a ${formatMoneda(calculosReceta.costoPorPorcion)}/pax`);
    }
  };

  // Crear nueva receta
  const handleCrearReceta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreReceta.trim()) return;

    const esCoffeeBreak = nuevoTiempoReceta === 'coffee-break';

    // Para Coffee Break: si existen en insumos, precargamos los insumos base para cálculo inmediato
    // de materia prima + merma en gramos
    let ingredientesIniciales: IngredienteReceta[] = [];
    let costoElaboracion = 500;

    if (esCoffeeBreak) {
      costoElaboracion = 824;
      const baseInsumos = [
        { insumoId: 'ins-tapaditos-ave', cantidad: 2, unidad: 'unidad' as const },
        { insumoId: 'ins-mini-pasteleria', cantidad: 3, unidad: 'unidad' as const },
        { insumoId: 'ins-cafe-grano', cantidad: 25, unidad: 'g' as const },
        { insumoId: 'ins-jugo-natural', cantidad: 0.25, unidad: 'L' as const }
      ];

      ingredientesIniciales = baseInsumos
        .filter(item => insumosMap.has(item.insumoId))
        .map((item, idx) => ({
          id: `ing-cb-${Date.now()}-${idx}`,
          insumoId: item.insumoId,
          cantidad: item.cantidad,
          unidad: item.unidad
        }));
    }

    const nueva: RecetaFichaTecnica = {
      id: 'rec-' + Date.now(),
      nombre: nuevoNombreReceta.trim(),
      tiempoMenu: nuevoTiempoReceta,
      categoria: esCoffeeBreak ? 'Servicio Alternativo' : 'Receta de Autor',
      rendimientoPorciones: 1,
      margenSugerido: 33, // 33% estándar de la industria
      costoAdicionalElaboracion: costoElaboracion,
      menuAsociadoId: esCoffeeBreak ? undefined : nuevoMenuAsociadoId,
      servicioAsociadoId: esCoffeeBreak ? 'coffee-break-cocteleria' : undefined,
      ingredientes: ingredientesIniciales,
      descripcionProcedimiento: esCoffeeBreak
        ? 'Estación de Coffee Break / Coctelería con café en grano recién molido, bocados salados y pastelería fina.'
        : undefined
    };

    // Calcular costo real por persona (materia prima + merma en gramos + costo adicional)
    const calculo = calcularCostoReceta(nueva, insumos);

    onAddReceta(nueva);
    setRecetaSeleccionadaId(nueva.id);
    setModalNuevaRecetaOpen(false);
    setNuevoNombreReceta('');

    // Si es Coffee Break, inyectar directamente en la tarjeta de Tarifas Generales
    if (esCoffeeBreak && onVincularCoffeeBreak) {
      onVincularCoffeeBreak(nueva, calculo.costoPorPorcion, calculo.precioSugeridoVenta);
      notificar(`✓ Costo de ${formatMoneda(calculo.costoPorPorcion)}/pax inyectado directamente en Tarifas Generales`);
    } else {
      notificar(`✓ Ficha técnica "${nueva.nombre}" creada con éxito`);
    }
  };

  const presetsMargen = [25, 30, 33, 35, 40, 45, 50];

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {toastSync && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastSync}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">
              Costeo de Recetas & Fichas Técnicas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-600" />
            Calculadora de Recetas & Costeo de Menús
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Costea cada plato a partir de las materias primas del maestro. El costo total alimenta automáticamente el cotizador y el panel financiero.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevaRecetaOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Ficha / Receta</span>
        </button>
      </div>

      {/* Explicación del Margen Gastronómico del 33% */}
      <div className="p-4 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/40 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-amber-950 block text-sm">
              Regla de Oro en Gastronomía: El Estándar del 33% de Food Cost
            </span>
            <p className="text-slate-600 mt-0.5">
              En banquetes y centros de eventos de alta cocina, se sugiere que el <strong>costo de los ingredientes represente un 33%</strong> del valor de venta del plato. Esto permite que el 67% restante cubra personal, energía, equipamiento y la ganancia neta de tu empresa. Sin embargo, <strong>la empresa tiene total libertad para fijar el margen que estime conveniente</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Recetas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span>Recetas Disponibles en el Sistema ({recetas.length})</span>
          <span className="text-[11px] text-slate-400 font-normal">Haz clic para costearla</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {recetas.map((r) => {
            const isSelected = r.id === recetaSeleccionadaId;
            const calculo = calcularCostoReceta(r, insumos);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecetaSeleccionadaId(r.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    {r.tiempoMenu === 'coffee-break' ? (
                      <span className="inline-flex items-center gap-1 text-amber-900 font-extrabold">
                        <Coffee className="w-3 h-3 text-amber-700" />
                        Coffee Break / Coctelería
                      </span>
                    ) : (
                      r.tiempoMenu
                    )}
                  </span>
                  <span className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">
                    {r.nombre}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Costo/pax:</span>
                  <span className="font-extrabold text-slate-800 tabular-nums">
                    {formatMoneda(calculo.costoPorPorcion)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DETALLE Y COSTEO DE LA RECETA SELECCIONADA */}
      {recetaActiva && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (2 Col): Ingredientes y Costeo */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header del plato */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] uppercase flex items-center gap-1">
                    {recetaActiva.tiempoMenu === 'coffee-break' && <Coffee className="w-3 h-3 text-amber-800" />}
                    Tiempo: {recetaActiva.tiempoMenu === 'coffee-break' ? 'Coffee Break / Coctelería' : recetaActiva.tiempoMenu}
                  </span>
                  {recetaActiva.tiempoMenu === 'coffee-break' ? (
                    <span className="text-xs text-amber-900 flex items-center gap-1 font-bold bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
                      Vinculado a: <strong>Tarifas Generales (Coffee Break / Coctelería)</strong>
                    </span>
                  ) : (
                    menuVinculado && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                        Vinculado a: <strong>{menuVinculado.nombre}</strong>
                      </span>
                    )
                  )}
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  {recetaActiva.nombre}
                </h2>
                {recetaActiva.descripcionProcedimiento && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {recetaActiva.descripcionProcedimiento}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Deseas eliminar la receta "${recetaActiva.nombre}"?`)) {
                    onDeleteReceta(recetaActiva.id);
                  }
                }}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg text-xs flex items-center gap-1 self-start sm:self-auto"
                title="Eliminar receta"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar Ficha</span>
              </button>
            </div>

            {/* Tabla de Ingredientes y Costos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ingredientes & Materia Prima ({recetaActiva.ingredientes.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Porción costeada: {recetaActiva.rendimientoPorciones} comensal
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Materia Prima</th>
                      <th className="py-2.5 px-3 text-right">Cantidad</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-center">Merma</th>
                      <th className="py-2.5 px-3 text-right">Costo Real</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recetaActiva.ingredientes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Esta receta aún no tiene ingredientes. Agrega materias primas usando el formulario de abajo.
                        </td>
                      </tr>
                    ) : (
                      recetaActiva.ingredientes.map((ing) => {
                        const ins = insumosMap.get(ing.insumoId);

                        // Si el ingrediente o insumo es de peso, aseguramos visualización en gramos (g) sin decimales confusos
                        const esPeso = ins?.unidadMedida === 'kg' || ing.unidad === 'g' || ing.unidad === 'kg';
                        const esUnidadNatural = ins?.unidadMedida === 'unidad' || ing.unidad === 'unidad';

                        // Conversión automática de '0,2 kg' a '200 g' y '0,008 kg' a '8 g'
                        const unidadVisual = esPeso ? 'g' : ing.unidad;
                        const cantidadVisual = (ing.unidad === 'kg') ? Math.round(ing.cantidad * 1000) : ing.cantidad;

                        // Objeto normalizado para el cálculo exacto del costo real
                        const ingParaCalculo = (ing.unidad === 'kg')
                          ? { ...ing, cantidad: cantidadVisual, unidad: 'g' as const }
                          : ing;

                        const { costoReal } = calcularCostoIngrediente(ingParaCalculo, ins);
                        const precioPorGramo = ins?.unidadMedida === 'kg' ? (ins.precioCompra / 1000) : null;

                        return (
                          <tr key={ing.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900">{ins?.nombre || 'Insumo eliminado'}</span>
                                {ins?.categoria && (
                                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${obtenerColorCategoria(ins.categoria).badge}`}>
                                    {formatearNombreCategoria(ins.categoria)}
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                Base: {formatMoneda(ins?.precioCompra || 0)}/{ins?.unidadMedida}
                                {precioPorGramo !== null && (
                                  <span className="text-amber-800 font-medium"> ({formatPrecioUnitario(precioPorGramo)}/g)</span>
                                )}
                                {ins?.proveedor && ` · ${ins.proveedor}`}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min={esPeso || esUnidadNatural ? 1 : 0.001}
                                step={esPeso || esUnidadNatural ? 1 : 0.01}
                                value={cantidadVisual}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  if (ing.unidad === 'kg') {
                                    // Guardar directamente migrado a gramos
                                    const recetaActualizada: RecetaFichaTecnica = {
                                      ...recetaActiva,
                                      ingredientes: recetaActiva.ingredientes.map(i =>
                                        i.id === ing.id ? { ...i, cantidad: val, unidad: 'g' } : i
                                      )
                                    };
                                    onUpdateReceta(recetaActualizada);
                                  } else {
                                    handleCantidadIngredienteChange(ing.id, val);
                                  }
                                }}
                                className="w-20 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums focus:outline-hidden"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px] font-bold">
                              {unidadVisual}
                            </td>

                            <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">
                              {ins?.mermaPorcentaje || 0}%
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                              {formatMoneda(costoReal)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngrediente(ing.id)}
                                className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                title="Quitar ingrediente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50/60 font-bold border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-slate-700">
                        Subtotal Materia Prima (Insumos Nivel Plato)
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-amber-950 tabular-nums">
                        {formatMoneda(calculosReceta.costoMateriaPrima)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Desglose de Costo por Categoría Vinculada */}
            {desgloseCategorias.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-amber-600" />
                    Desglose por Categoría de Insumos (Vinculación Directa)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {desgloseCategorias.length} {desgloseCategorias.length === 1 ? 'categoría presente' : 'categorías presentes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {desgloseCategorias.map(item => {
                    const estilo = obtenerColorCategoria(item.categoria);
                    return (
                      <div
                        key={item.categoria}
                        className={`p-2 rounded-lg border ${estilo.border} ${estilo.bg} flex items-center justify-between gap-2`}
                      >
                        <div className="min-w-0">
                          <span className={`font-bold block text-xs truncate ${estilo.text}`}>
                            {item.nombreCategoria}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.porcentaje}% del costo ingredientes
                          </span>
                        </div>
                        <span className="font-black text-slate-900 tabular-nums text-xs shrink-0">
                          {formatMoneda(item.costo)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agregar nuevo ingrediente con selector de categorías vinculadas */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  Añadir Ingrediente desde el Maestro de Insumos:
                </span>

                {/* Filtro por Categoría de Insumo */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-medium">Filtrar por categoría:</span>
                  <select
                    value={categoriaFiltroIngrediente}
                    onChange={(e) => handleCambioCategoriaFiltro(e.target.value)}
                    className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="todas">Todas ({insumos.length})</option>
                    {categoriasDisponibles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                {/* Selector de insumo filtrado */}
                <div className="sm:col-span-2">
                  <select
                    value={insumoToAddId}
                    onChange={(e) => {
                      setInsumoToAddId(e.target.value);
                      const ins = insumosMap.get(e.target.value);
                      if (ins) {
                        if (ins.unidadMedida === 'kg') {
                          setUnidadToAdd('g');
                          setCantidadToAdd(200);
                        } else if (ins.unidadMedida === 'unidad') {
                          setUnidadToAdd('unidad');
                          setCantidadToAdd(2);
                        } else {
                          setUnidadToAdd(ins.unidadMedida as any);
                          setCantidadToAdd(1);
                        }
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    {insumosParaAgregar.length === 0 ? (
                      <option value="">No hay insumos en esta categoría</option>
                    ) : (
                      insumosParaAgregar.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} [{formatearNombreCategoria(i.categoria)}] ({formatMoneda(i.precioCompra)}/{i.unidadMedida}
                          {i.unidadMedida === 'kg' ? ` · ${formatPrecioUnitario(i.precioCompra / 1000)}/g` : ''})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cantidad y Unidad */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={unidadToAdd === 'g' || unidadToAdd === 'unidad' ? 1 : 0.001}
                    step={unidadToAdd === 'g' || unidadToAdd === 'unidad' ? 1 : 0.01}
                    value={cantidadToAdd}
                    onChange={(e) => setCantidadToAdd(Number(e.target.value))}
                    placeholder="Cantidad"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums focus:outline-hidden"
                  />
                  <select
                    value={unidadToAdd}
                    onChange={(e) => setUnidadToAdd(e.target.value as any)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-mono text-xs focus:outline-hidden font-bold"
                  >
                    <option value="g">g (gramos)</option>
                    <option value="unidad">unidad / uds</option>
                    <option value="L">L (litros)</option>
                    <option value="ml">ml</option>
                  </select>
                </div>

                {/* Botón agregar */}
                <div>
                  <button
                    type="button"
                    disabled={!insumoToAddId}
                    onClick={handleAddIngrediente}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Costos Indirectos de Elaboración */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">
                  Gastos Adicionales de Cocción / Condimentos
                </span>
                <span className="text-[11px] text-slate-500">
                  Gas, especias menores, fondos aromáticos y cocción por comensal
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={recetaActiva.costoAdicionalElaboracion || 0}
                  onChange={(e) => {
                    onUpdateReceta({
                      ...recetaActiva,
                      costoAdicionalElaboracion: Math.max(0, Number(e.target.value) || 0)
                    });
                  }}
                  className="w-24 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 tabular-nums focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (1 Col): Panel Financiero del Plato & Margen 33% */}
          <div className="space-y-5">
            
            {/* Tarjeta de Costo Real de la Porción */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  Costo Real Porción (Food Cost)
                </span>
                <span className="text-[10px] font-bold text-slate-400">1 pax</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Costo de Producción del Plato
                </span>
                <div className="text-3xl font-black text-amber-400 tabular-nums mt-0.5">
                  {formatMoneda(calculosReceta.costoPorPorcion)}
                </div>
                <div className="text-[11px] text-slate-300 mt-2 flex justify-between border-t border-slate-800 pt-2">
                  <span>Materia prima:</span>
                  <span className="font-semibold tabular-nums">{formatMoneda(calculosReceta.costoMateriaPrima)}</span>
                </div>
              </div>

              {/* Selector de Margen con el botón destacado 33% */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-500" />
                    Margen Comercial de la Receta
                  </label>
                  <span className="text-xs font-black text-amber-700 tabular-nums">
                    {recetaActiva.margenSugerido}%
                  </span>
                </div>

                {/* BOTÓN ESTRELLA: Margen Recomendado 33% */}
                <button
                  type="button"
                  onClick={() => handleMargenChange(33)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all mb-2.5 ${
                    recetaActiva.margenSugerido === 33
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs ring-1 ring-amber-400'
                      : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Margen Gastronómico Estándar (33%)</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-amber-200/80 px-1.5 py-0.5 rounded">
                    Recomendado
                  </span>
                </button>

                {/* Presets libres para que la empresa decida */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {presetsMargen.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMargenChange(m)}
                      className={`py-1 text-[10px] font-bold rounded transition-colors ${
                        recetaActiva.margenSugerido === m
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={recetaActiva.margenSugerido}
                  onChange={(e) => handleMargenChange(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Precio sugerido de venta de la porción */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Precio Sugerido Venta Porción
                </span>
                <div className="text-xl font-black text-amber-950 tabular-nums">
                  {formatMoneda(calculosReceta.precioSugeridoVenta)}
                </div>
                <div className="flex justify-between text-[11px] text-amber-900 pt-1 border-t border-amber-200/50">
                  <span>Margen Bruto de Utilidad:</span>
                  <span className="font-bold tabular-nums">+{formatMoneda(calculosReceta.utilidadPorPorcion)}</span>
                </div>
              </div>
            </div>

            {/* VINCULACIÓN: SI ES COFFEE BREAK SE VINCULA A TARIFAS GENERALES, SI NO AL MENÚ DE BANQUETE */}
            {recetaActiva.tiempoMenu === 'coffee-break' ? (
              <div className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 rounded-2xl border border-amber-300 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Impacto en Tarifas Generales & Cotizador
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Servicio Destino:</span>
                    <strong className="text-amber-950 font-bold">Coffee Break / Coctelería</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Costo Unitario Ficha:</span>
                    <span className="font-extrabold text-amber-900 text-sm tabular-nums">
                      {formatMoneda(calculosReceta.costoPorPorcion)}/pax
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Invitados (Pax) activos:</span>
                    <span className="font-bold text-slate-800 font-mono">{invitados} pax</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                    <span className="font-bold text-slate-800">Total Desglosado:</span>
                    <span className="font-black text-amber-950 text-base tabular-nums">
                      {formatMoneda(calculosReceta.costoPorPorcion * invitados)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSincronizarCoffeeBreak}
                  className="w-full mt-2 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                  <span>Sincronizar Costo a Tarifas Generales</span>
                </button>
              </div>
            ) : (
              menuVinculado && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Impacto en el Menú de Cotización
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Menú vinculado:</span>
                      <strong className="text-slate-900">{menuVinculado.nombre}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Platos costeados en este menú:</span>
                      <span className="font-bold text-slate-900">{calculoMenuCompleto.recetasEncontradas} recetas</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span>Costo Sumado de Recetas:</span>
                      <span className="font-extrabold text-blue-900 text-sm tabular-nums">
                        {formatMoneda(calculoMenuCompleto.costoMenuCalculado)}/pax
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Costo actual en cotizador:</span>
                      <span className="tabular-nums">{formatMoneda(menuVinculado.costoPersona)}/pax</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSincronizarAlCotizador}
                    className="w-full mt-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                    <span>Actualizar Costo al Menú en Cotizador</span>
                  </button>
                </div>
              )
            )}
          </div>

        </div>
      )}

      {/* Modal para Crear Nueva Receta */}
      {modalNuevaRecetaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ChefHat className="w-5 h-5 text-amber-600" />
              Nueva Ficha Técnica de Costeo
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Crea un plato o servicio y conéctalo al cotizador para que su costo se traslade en tiempo real.
            </p>

            <form onSubmit={handleCrearReceta} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Plato / Servicio</label>
                <input
                  type="text"
                  required
                  value={nuevoNombreReceta}
                  onChange={(e) => setNuevoNombreReceta(e.target.value)}
                  placeholder="Ej: Coffee Break Ejecutivo o Lomo al Horno"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiempo del Menú</label>
                <select
                  value={nuevoTiempoReceta}
                  onChange={(e) => setNuevoTiempoReceta(e.target.value as any)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium"
                >
                  <option value="coctel">Cóctel de Bienvenida</option>
                  <option value="entrada">Entrada</option>
                  <option value="fondo">Plato de Fondo</option>
                  <option value="postre">Postre</option>
                  <option value="trasnoche">Trasnoche / Bajón</option>
                  <option value="coffee-break">Coffee Break / Coctelería</option>
                </select>
              </div>

              {nuevoTiempoReceta === 'coffee-break' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destino de Vinculación</label>
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-amber-950 block text-xs">
                          Tarifas Generales · Coffee Break
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Inyección automática del costo por persona en la tarjeta de Tarifas
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                      Automático
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Menú al que pertenece</label>
                  <select
                    value={nuevoMenuAsociadoId}
                    onChange={(e) => setNuevoMenuAsociadoId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium"
                  >
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaRecetaOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Crear Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
