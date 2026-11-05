import React, { useState, useMemo } from 'react';
import { RecetaFichaTecnica, IngredienteReceta, InsumoMaestro, MenuItemRatio } from '../types';
import { calcularCostoReceta, calcularCostoIngrediente } from '../config/insumosYRecetas';
import { formatMoneda } from '../utils/formatters';
import { CATEGORIAS_INSUMOS_DEFAULT } from '../config/insumosYRecetas';
import {
  Martini,
  Plus,
  Trash2,
  Pencil,
  Link2,
  Link2Off,
  X,
  Check,
  ChefHat,
  Wine,
  FlaskConical,
  Info,
  Boxes,
  PackagePlus
} from 'lucide-react';

interface ModuloCocteleriaProps {
  recetas: RecetaFichaTecnica[];
  insumos: InsumoMaestro[];
  invitados: number;
  onAddReceta: (nueva: RecetaFichaTecnica) => void;
  onUpdateReceta: (actualizada: RecetaFichaTecnica) => void;
  onDeleteReceta: (id: string) => void;
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  onIrACotizador?: () => void;
  onAddInsumo?: (nuevo: InsumoMaestro) => void;
  onIrAMaestroInsumos?: () => void;
}

// Categorías de tragos sugeridas (el usuario puede escribir la suya)
const CATEGORIAS_TRAGO = [
  'Trago Clásico',
  'Coctel de Autor',
  'Pisco / Aguardiente',
  'Ron / Vodka / Gin',
  'Whisky / Burdeos',
  'Sin Alcohol / Mocktail',
  'Vino & Espumante'
];

// Este módulo solo gestiona fichas técnicas cuyo tiempoMenu sea 'cocteleria'
const TIEMPO_TRAGO = 'cocteleria';

export const ModuloCocteleria: React.FC<ModuloCocteleriaProps> = ({
  recetas,
  insumos,
  invitados,
  onAddReceta,
  onUpdateReceta,
  onDeleteReceta,
  bebestibles = [],
  onUpdateBebestibles,
  onIrACotizador,
  onAddInsumo,
  onIrAMaestroInsumos
}) => {
  const tragos = useMemo(
    () => recetas.filter(r => r.tiempoMenu === TIEMPO_TRAGO),
    [recetas]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [tragoAEditar, setTragoAEditar] = useState<RecetaFichaTecnica | null>(null);

  // ── Estado del formulario de ficha de trago ──
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Trago Clásico');
  const [margenSugerido, setMargenSugerido] = useState(33);
  const [costoAdicional, setCostoAdicional] = useState<number>(0);
  const [ingredientes, setIngredientes] = useState<IngredienteReceta[]>([]);
  const [nuevoInsumoId, setNuevoInsumoId] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState<number | string>(60);
  const [nuevaUnidad, setNuevaUnidad] = useState<'ml' | 'L' | 'g' | 'kg' | 'unidad'>('ml');

  // ── Creación rápida de insumo SIN salir del modal de trago ──
  const [panelNuevoInsumo, setPanelNuevoInsumo] = useState(false);
  const [qiNombre, setQiNombre] = useState('');
  const [qiCategoria, setQiCategoria] = useState('licores_bebidas');
  const [qiUnidad, setQiUnidad] = useState<InsumoMaestro['unidadMedida']>('ml');
  const [qiPrecio, setQiPrecio] = useState<number | string>('');
  const [qiProveedor, setQiProveedor] = useState('');
  const [qiMensaje, setQiMensaje] = useState('');

  const abrirPanelNuevoInsumo = () => {
    setPanelNuevoInsumo(true);
    setQiNombre('');
    setQiCategoria('licores_bebidas');
    setQiUnidad('ml');
    setQiPrecio('');
    setQiProveedor('');
    setQiMensaje('');
  };

  const handleCrearInsumoRapido = () => {
    if (!onAddInsumo) return;
    if (!qiNombre.trim()) {
      setQiMensaje('⚠️ Escribe el nombre del insumo (ej: Pisco Alto del Carmen 35°)');
      return;
    }
    const precioNum = typeof qiPrecio === 'number' ? qiPrecio : parseFloat(String(qiPrecio).replace(/\./g, '').replace(',', '.')) || parseFloat(String(qiPrecio)) || 0;
    if (precioNum <= 0) {
      setQiMensaje('⚠️ Escribe el precio de compra (ej: 6500)');
      return;
    }
    const nuevo: InsumoMaestro = {
      id: 'ins-' + Date.now(),
      nombre: qiNombre.trim(),
      categoria: qiCategoria,
      unidadMedida: qiUnidad,
      precioCompra: precioNum,
      mermaPorcentaje: 0,
      proveedor: qiProveedor.trim() || 'Proveedor Local',
      ultimoCambio: new Date().toISOString().slice(0, 10)
    };
    onAddInsumo(nuevo);
    setQiMensaje('');
    setPanelNuevoInsumo(false);
    // Auto-seleccionar el insumo recién creado en el dropdown de ingredientes
    setNuevoInsumoId(nuevo.id);
  };

  // ── Estado de vinculación al cotizador ──
  const [copasPorPersona, setCopasPorPersona] = useState<Record<string, number | string>>({});

  const insumosBebida = useMemo(
    () => insumos.filter(i =>
      ['licor', 'bebida', 'vino', 'cerveza', 'agua', 'jugo', 'fruta', 'otro'].some(c => (i.categoria || '').toLowerCase().includes(c)) ||
      i.nombre.toLowerCase().match(/pisco|ron|vodka|gin|whisky|tequila|vino|espumante|champagne|cerveza|gaseosa|agua|jugo|lim|az[uú]car|hielo|menta|bitter/)
    ),
    [insumos]
  );

  const listaInsumos = insumosBebida.length > 0 ? insumosBebida : insumos;
  // Resto de insumos del Maestro (para que NADA quede oculto: garnizas, condimentos, etc.)
  const otrosInsumos = useMemo(
    () => insumos.filter(i => !listaInsumos.some(l => l.id === i.id)),
    [insumos, listaInsumos]
  );

  const abrirNuevo = () => {
    setTragoAEditar(null);
    setNombre('');
    setCategoria('Trago Clásico');
    setMargenSugerido(33);
    setCostoAdicional(0);
    setIngredientes([]);
    setNuevoInsumoId('');
    setNuevaCantidad(60);
    setNuevaUnidad('ml');
    setPanelNuevoInsumo(false);
    setModalOpen(true);
  };

  const abrirEdicion = (trago: RecetaFichaTecnica) => {
    setTragoAEditar(trago);
    setNombre(trago.nombre);
    setCategoria(trago.categoria || 'Trago Clásico');
    setMargenSugerido(trago.margenSugerido || 33);
    setCostoAdicional(trago.costoAdicionalElaboracion || 0);
    setIngredientes(JSON.parse(JSON.stringify(trago.ingredientes || [])));
    setNuevoInsumoId('');
    setNuevaCantidad(60);
    setPanelNuevoInsumo(false);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setTragoAEditar(null);
  };

  // FIX IMPORTANTE: este formulario de ingredientes vive DENTRO del gran <form> de la ficha.
  // Un <form> anidado hace que el navegador envíe el form nativamente y RECARGUE la página
  // perdiendo la ficha completa. Ahora es un <div> + botón type="button" + Enter a mano.
  const handleAgregarIngrediente = (e?: React.FormEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!nuevoInsumoId) return;
    const cant = typeof nuevaCantidad === 'number' ? nuevaCantidad : parseFloat(String(nuevaCantidad).replace(',', '.')) || 0;
    if (cant <= 0) return;
    const nuevo: IngredienteReceta = {
      id: 'ing-' + Date.now(),
      insumoId: nuevoInsumoId,
      cantidad: cant,
      unidad: nuevaUnidad
    };
    setIngredientes(prev => [...prev, nuevo]);
    setNuevoInsumoId('');
    setNuevaCantidad(60);
  };

  const handleEliminarIngrediente = (id: string) => {
    setIngredientes(prev => prev.filter(i => i.id !== id));
  };

  const costoVivo = useMemo(() => {
    const borrador: RecetaFichaTecnica = {
      id: 'borrador',
      nombre: nombre || 'Borrador',
      tiempoMenu: TIEMPO_TRAGO,
      categoria,
      rendimientoPorciones: 1,
      ingredientes,
      margenSugerido,
      costoAdicionalElaboracion: costoAdicional
    };
    return calcularCostoReceta(borrador, insumos);
  }, [nombre, categoria, ingredientes, margenSugerido, costoAdicional, insumos]);

  const handleGuardarTrago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || ingredientes.length === 0) return;
    if (tragoAEditar) {
      onUpdateReceta({
        ...tragoAEditar,
        nombre: nombre.trim(),
        categoria,
        margenSugerido,
        costoAdicionalElaboracion: costoAdicional,
        ingredientes
      });
    } else {
      onAddReceta({
        id: 'rec-trago-' + Date.now(),
        nombre: nombre.trim(),
        tiempoMenu: TIEMPO_TRAGO,
        categoria,
        rendimientoPorciones: 1,
        ingredientes,
        margenSugerido,
        costoAdicionalElaboracion: costoAdicional,
        descripcionProcedimiento: `Ficha de trago (${categoria}) creada en el Cotizador de Tragos & Licores.`
      });
    }
    cerrarModal();
  };

  // ── Vinculación con el cotizador de menú ──
  const handleVincularTrago = (trago: RecetaFichaTecnica) => {
    if (!onUpdateBebestibles) return;
    const raw = copasPorPersona[trago.id];
    const copas = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.')) || 2;
    const calc = calcularCostoReceta(trago, insumos);
    const nuevo: MenuItemRatio = {
      id: 'beb-trago-' + trago.id,
      nombre: trago.nombre,
      cantidadPorPersona: Math.max(0.1, copas),
      unidad: 'copa',
      costoUnitario: calc.costoPorPorcion,
      recetaId: trago.id,
      recetaNombre: trago.nombre,
      categoria: 'cocteleria',
      tipoOrigen: 'receta',
      incluido: true
    };
    const yaEsta = bebestibles.some(b => b.recetaId === trago.id);
    onUpdateBebestibles(
      yaEsta
        ? bebestibles.map(b => (b.recetaId === trago.id ? nuevo : b))
        : [...bebestibles, nuevo]
    );
  };

  const handleDesvincularTrago = (trago: RecetaFichaTecnica) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(bebestibles.filter(b => b.recetaId !== trago.id));
  };

  const copasDe = (tragoId: string) => bebestibles.find(b => b.recetaId === tragoId);

  const costoTotalTragosEvento = useMemo(() => {
    return bebestibles
      .filter(b => b.recetaId && tragos.some(t => t.id === b.recetaId))
      .reduce((acc, b) => {
        const trago = tragos.find(t => t.id === b.recetaId);
        if (!trago) return acc;
        const calc = calcularCostoReceta(trago, insumos);
        return acc + (Number(b.cantidadPorPersona) || 0) * calc.costoPorPorcion * invitados;
      }, 0);
  }, [bebestibles, tragos, insumos, invitados]);

  return (
    <div className="space-y-6">
      {/* ══════ ENCABEZADO ══════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              <Martini className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Cotizador de Tragos & Licores
              </h2>
              <p className="text-xs text-slate-500">
                Fichas técnicas de coctelería con costo real por copa. Vincúlalas al menú del cotizador en 1 clic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Costo Tragos Vinculados ({invitados} Pax)
              </span>
              <div className="text-lg font-black text-purple-950 tabular-nums">
                {formatMoneda(costoTotalTragosEvento)}
              </div>
            </div>
            {onIrAMaestroInsumos && (
              <button
                type="button"
                onClick={onIrAMaestroInsumos}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl border border-blue-300 shadow-xs transition-colors cursor-pointer"
                title="Abrir el Maestro de Insumos para crear o editar insumos (licores, frutas, hielo...) con sus precios reales"
              >
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Maestro de Insumos</span>
              </button>
            )}
            <button
              type="button"
              onClick={abrirNuevo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Ficha de Trago</span>
            </button>
          </div>
        </div>

        {bebestibles.some(b => b.recetaId && tragos.some(t => t.id === b.recetaId)) && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Tus tragos vinculados ya están en el Cotizador, sección "Bebestibles & Barra", con la etiqueta 🍸 Desde receta.
            </span>
            {onIrACotizador && (
              <button
                type="button"
                onClick={onIrACotizador}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer whitespace-nowrap"
              >
                Ir al Cotizador →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══════ LISTA DE TRAGOS ══════ */}
      {tragos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Martini className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">Aún no hay fichas de tragos</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Crea tu primera ficha: elige los insumos (pisco, limón, azúcar, hielo...), las cantidades en ml y el sistema calcula el costo real por copa y el precio sugerido.
          </p>
          {onIrAMaestroInsumos && (
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mb-4">
              ¿No encuentras un insumo? Créalo en el{' '}
              <button type="button" onClick={onIrAMaestroInsumos} className="font-bold text-blue-700 underline cursor-pointer">
                Maestro de Insumos
              </button>{' '}
o con el botón "+ Nuevo Insumo" dentro de la ficha.
            </p>
          )}
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Crear primera ficha de trago
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tragos.map((trago) => {
            const calc = calcularCostoReceta(trago, insumos);
            const vinculacion = copasDe(trago.id);
            const copasInput = copasPorPersona[trago.id];

            return (
              <div
                key={trago.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  vinculacion
                    ? 'border-purple-400 ring-1 ring-purple-300 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                      {trago.categoria || 'Trago'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(trago)}
                        className="text-slate-400 hover:text-amber-600 p-1 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                        title={`Editar "${trago.nombre}"`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la ficha de trago "${trago.nombre}"? También desaparecerá del cotizador.`)) {
                            onDeleteReceta(trago.id);
                            if (vinculacion && onUpdateBebestibles) handleDesvincularTrago(trago);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Eliminar "${trago.nombre}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{trago.nombre}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {trago.ingredientes.length} ingredientes · Margen {trago.margenSugerido || 33}%
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Costo Copa</span>
                      <strong className="text-slate-800 tabular-nums">{formatMoneda(calc.costoPorPorcion)}</strong>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-[9px] text-purple-500 block font-bold uppercase">Precio Venta</span>
                      <strong className="text-purple-950 tabular-nums">{formatMoneda(calc.precioSugeridoVenta)}</strong>
                    </div>
                  </div>

                  {/* Detalle de ingredientes */}
                  <details className="mt-2 group">
                    <summary className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer list-none flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" />
                      Ver receta del trago
                    </summary>
                    <div className="mt-1.5 space-y-0.5 border-l-2 border-purple-200 pl-2.5 py-1">
                      {trago.ingredientes.map(ing => {
                        const ins = insumos.find(i => i.id === ing.insumoId);
                        return (
                          <div key={ing.id} className="text-[11px] text-slate-600 flex justify-between gap-2">
                            <span className="truncate">{ins ? ins.nombre : 'Insumo eliminado'}</span>
                            <span className="font-bold text-slate-800 whitespace-nowrap tabular-nums">
                              {ing.cantidad} {ing.unidad}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>

                {/* Vinculación al cotizador */}
                {onUpdateBebestibles && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {vinculacion ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1.5">
                          <span>🔗 {vinculacion.cantidadPorPersona} copas pp en el Cotizador</span>
                          <button
                            type="button"
                            onClick={() => handleDesvincularTrago(trago)}
                            className="text-purple-400 hover:text-rose-600 cursor-pointer"
                            title="Quitar del cotizador"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0.1}
                            step="any"
                            value={copasInput !== undefined ? copasInput : vinculacion.cantidadPorPersona}
                            onChange={(e) => setCopasPorPersona(prev => ({ ...prev, [trago.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="w-16 px-1.5 py-1 text-center text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                            title="Copas por persona"
                          />
                          <span className="text-[10px] text-slate-500">copas pp</span>
                          <button
                            type="button"
                            onClick={() => handleVincularTrago(trago)}
                            className="ml-auto px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold rounded-lg border border-purple-300 cursor-pointer"
                          >
                            Actualizar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0.1}
                          step="any"
                          value={copasInput !== undefined ? copasInput : 2}
                          onChange={(e) => setCopasPorPersona(prev => ({ ...prev, [trago.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="w-16 px-1.5 py-1 text-center text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                          title="Copas por persona"
                        />
                        <span className="text-[10px] text-slate-500">copas pp</span>
                        <button
                          type="button"
                          onClick={() => handleVincularTrago(trago)}
                          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                          title="Agregar este trago al cotizador como bebestible del evento"
                        >
                          <Link2 className="w-3 h-3" />
                          Vincular
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ MODAL: FICHA DE TRAGO ══════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6 max-h-[94vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Martini className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {tragoAEditar ? 'Editar Ficha de Trago' : 'Nueva Ficha de Trago'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingredientes en ml/g por 1 copa. El costo por copa se calcula solo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarTrago} className="mt-5 space-y-4 text-xs">
              {/* Nombre + categoría + margen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Trago <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Pisco Sour Artesanal, Mojito Cubano, Terremoto..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-purple-500 focus:outline-hidden font-medium text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden bg-white text-slate-800"
                  >
                    {CATEGORIAS_TRAGO.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Margen Food Cost (%) — precio = costo ÷ margen
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={95}
                    step="any"
                    value={margenSugerido}
                    onChange={(e) => setMargenSugerido(Number(e.target.value) || 33)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden font-bold text-slate-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Ingredientes */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    Ingredientes por 1 Copa
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    {ingredientes.length} ingredientes
                  </span>
                </div>

                {ingredientes.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Insumo</th>
                          <th className="py-2 px-3 text-center">Cantidad</th>
                          <th className="py-2 px-3 text-right">Costo</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ingredientes.map(ing => {
                          const ins = insumos.find(i => i.id === ing.insumoId);
                          const costoIng = ins ? calcularCostoIngrediente(ing, ins).costoReal : 0;
                          return (
                            <tr key={ing.id} className="hover:bg-purple-50/30">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {ins ? ins.nombre : '⚠️ Insumo no encontrado'}
                                <span className="ml-1.5 text-[9px] text-slate-400 font-medium">{ins?.proveedor}</span>
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-purple-900 tabular-nums">
                                {ing.cantidad} {ing.unidad}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600 tabular-nums">{formatMoneda(costoIng)}</td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarIngrediente(ing.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                  title="Quitar ingrediente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-purple-50/70 font-bold border-t border-purple-200">
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-slate-700">
                            Costo Materia Prima por Copa:
                          </td>
                          <td className="py-2 px-3 text-right font-black text-purple-950 tabular-nums">
                            {formatMoneda(costoVivo.costoMateriaPrima)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    Agrega los ingredientes del trago (pisco, limón, jarabe, hielo...).
                  </div>
                )}

                {/* Formulario ingrediente (div, NO form anidado) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/90">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <select
                        value={nuevoInsumoId}
                        onChange={(e) => setNuevoInsumoId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden bg-white"
                      >
                        <option value="">— Elegir insumo (licor, fruta, hielo...) —</option>
                        <optgroup label="🥃 Licores y Bebidas">
                          {listaInsumos.map(ins => (
                            <option key={ins.id} value={ins.id}>
                              {ins.nombre} ({formatMoneda(ins.precioCompra)} / {ins.unidadMedida})
                            </option>
                          ))}
                        </optgroup>
                        {otrosInsumos.length > 0 && (
                          <optgroup label="🧺 Todos los demás insumos del Maestro">
                            {otrosInsumos.map(ins => (
                              <option key={ins.id} value={ins.id}>
                                {ins.nombre} ({formatMoneda(ins.precioCompra)} / {ins.unidadMedida})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={nuevaCantidad}
                        onChange={(e) => setNuevaCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarIngrediente(); } }}
                        placeholder="Cant."
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                        title="Cantidad por copa"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={nuevaUnidad}
                        onChange={(e) => setNuevaUnidad(e.target.value as 'ml' | 'L' | 'g' | 'kg' | 'unidad')}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden bg-white"
                      >
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="unidad">unidad</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleAgregarIngrediente()}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        title="Añadir ingrediente (o Enter)"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Acceso al Maestro de Insumos + creación rápida SIN salir de la ficha */}
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    {onIrAMaestroInsumos && (
                      <button
                        type="button"
                        onClick={onIrAMaestroInsumos}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer flex items-center gap-1"
                        title="Abrir el Maestro de Insumos (tabla completa con precios)"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        Abrir Maestro de Insumos →
                      </button>
                    )}
                    {onAddInsumo && (
                      <button
                        type="button"
                        onClick={abrirPanelNuevoInsumo}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer flex items-center gap-1"
                        title="Crear un insumo nuevo ahora mismo y usarlo en esta receta"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        + Nuevo Insumo
                      </button>
                    )}
                  </div>

                  {panelNuevoInsumo && onAddInsumo && (
                    <div className="mt-2 p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wide flex items-center gap-1">
                          <PackagePlus className="w-3.5 h-3.5" />
                          Crear Insumo para esta Receta
                        </span>
                        <button
                          type="button"
                          onClick={() => setPanelNuevoInsumo(false)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Cerrar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={qiNombre}
                            onChange={(e) => setQiNombre(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCrearInsumoRapido(); } }}
                            placeholder="Nombre (ej: Pisco Alto del Carmen 35°)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={qiCategoria}
                            onChange={(e) => setQiCategoria(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden bg-white"
                            title="Categoría del insumo"
                          >
                            {CATEGORIAS_INSUMOS_DEFAULT.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={qiUnidad}
                            onChange={(e) => setQiUnidad(e.target.value as InsumoMaestro['unidadMedida'])}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden bg-white"
                            title="Unidad de compra"
                          >
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="unidad">unidad</option>
                            <option value="paquete">paquete</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={qiPrecio}
                            onChange={(e) => setQiPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCrearInsumoRapido(); } }}
                            placeholder="Precio $"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:outline-hidden"
                            title="Precio de compra por unidad"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-7">
                          <input
                            type="text"
                            value={qiProveedor}
                            onChange={(e) => setQiProveedor(e.target.value)}
                            placeholder="Proveedor (opcional)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden"
                          />
                        </div>
                        <div className="sm:col-span-5 flex justify-end">
                          <button
                            type="button"
                            onClick={handleCrearInsumoRapido}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Crear y usar en la receta
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Queda guardado en el Maestro de Insumos y queda seleccionado arriba, listo para agregar con su cantidad.
                      </p>
                      {qiMensaje && (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                          {qiMensaje}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Costo adicional */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-[11px] font-bold text-slate-700">
                    Costo adicional de elaboración ($/copa, gas, hielo, decoración):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={costoAdicional}
                    onChange={(e) => setCostoAdicional(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-right font-bold tabular-nums focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Resumen de costos */}
              <div className="p-3.5 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 border border-purple-200/80 rounded-2xl">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Costo Total</span>
                    <strong className="text-slate-900 tabular-nums">{formatMoneda(costoVivo.costoTotalReceta)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Costo por Copa</span>
                    <strong className="text-purple-900 tabular-nums">{formatMoneda(costoVivo.costoPorPorcion)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Precio Venta</span>
                    <strong className="text-emerald-800 tabular-nums">{formatMoneda(costoVivo.precioSugeridoVenta)}</strong>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 justify-center">
                  <Info className="w-3 h-3" />
                  Para {invitados} pax × 2 copas: {formatMoneda(costoVivo.costoPorPorcion * 2 * invitados)} de costo
                </p>
              </div>

              {/* Acciones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{tragoAEditar ? 'Guardar Cambios' : 'Guardar Ficha de Trago'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
