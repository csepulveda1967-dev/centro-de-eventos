import React, { useState, useMemo, useEffect } from 'react';
import { MenuOption, MenuItemRatio, InsumoMaestro, RecetaFichaTecnica } from '../types';
import { Utensils, X, Plus, Sparkles, Check, DollarSign, Trash2, ShoppingCart, Info, Tag, ChefHat } from 'lucide-react';
import { formatMoneda } from '../utils/formatters';
import { calcularCostoReceta } from '../config/insumosYRecetas';

interface ModalCrearMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardarMenu: (nuevoMenu: MenuOption) => void;
  tiempoInicial?: {
    tiempo: 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche';
    nombrePlato: string;
  };
  insumosDisponibles?: InsumoMaestro[];
  recetasDisponibles?: RecetaFichaTecnica[];
  invitadosReferencia?: number;
}

const STORAGE_CATEGORIAS_MENU_KEY = 'hlr_categorias_menus_personalizadas';

const CATEGORIAS_MENU_PREDEFINIDAS = [
  { id: 'formal', label: 'Banquete Formal / Cena Servida' },
  { id: 'campestre', label: 'Asado Campestre / Parrilla' },
  { id: 'cocktail', label: 'Cóctel Dinámico / Finger Food' },
  { id: 'premium', label: 'Menú Premium / Signature' },
  { id: 'coffee-break', label: 'Coffee Break & Coctelería' },
  { id: 'almuerzo-ejecutivo', label: 'Almuerzo Ejecutivo / Corporativo' },
  { id: 'brunch', label: 'Brunch Gourmet' },
  { id: 'infantil', label: 'Menú Infantil & Familiar' }
];

export const ModalCrearMenu: React.FC<ModalCrearMenuProps> = ({
  isOpen,
  onClose,
  onGuardarMenu,
  tiempoInicial,
  insumosDisponibles = [],
  recetasDisponibles = [],
  invitadosReferencia = 100
}) => {
  const [nombre, setNombre] = useState('');
  
  // Categoría: Predefinida o Libre
  const [categoria, setCategoria] = useState<string>('formal');
  const [esCategoriaLibre, setEsCategoriaLibre] = useState(false);
  const [categoriaLibreInput, setCategoriaLibreInput] = useState('');

  // Categorías personalizadas guardadas en localStorage
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATEGORIAS_MENU_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [descripcion, setDescripcion] = useState('');
  const [costoPersona, setCostoPersona] = useState<number | string>(0);
  const [margenSugerido, setMargenSugerido] = useState<number>(33); // 33% estándar gastronómico
  const [destacado, setDestacado] = useState(false);

  // Tiempos del menú
  const [coctel, setCoctel] = useState(
    tiempoInicial?.tiempo === 'coctel' ? tiempoInicial.nombrePlato : ''
  );
  const [entrada, setEntrada] = useState(
    tiempoInicial?.tiempo === 'entrada' ? tiempoInicial.nombrePlato : ''
  );
  const [fondo, setFondo] = useState(
    tiempoInicial?.tiempo === 'fondo' ? tiempoInicial.nombrePlato : ''
  );
  const [postre, setPostre] = useState(
    tiempoInicial?.tiempo === 'postre' ? tiempoInicial.nombrePlato : ''
  );
  const [trasnoche, setTrasnoche] = useState(
    tiempoInicial?.tiempo === 'trasnoche' ? tiempoInicial.nombrePlato : ''
  );

  const [mostrarTiemposDetallados, setMostrarTiemposDetallados] = useState(!!tiempoInicial);

  // ── Ítems por Persona (p.p.) para calcular consumos exactos y comprar ──
  // Ejemplo: "1 sandwich pp 2", "bebidas pp 2"
  // Se inicia vacío: cada menú nuevo parte de cero, sin ítems de ejemplo precargados.
  const [itemsPorPersona, setItemsPorPersona] = useState<MenuItemRatio[]>([]);

  // Formulario rápido para añadir nuevo ítem p.p.
  const [nuevoItemNombre, setNuevoItemNombre] = useState('');
  const [nuevoItemCantidadPP, setNuevoItemCantidadPP] = useState<number | string>(2);
  const [nuevoItemUnidad, setNuevoItemUnidad] = useState<string>('unidad');
  const [nuevoItemCostoUnitario, setNuevoItemCostoUnitario] = useState<number | string>('');
  const [nuevoItemInsumoId, setNuevoItemInsumoId] = useState<string>('');
  const [nuevoItemRecetaId, setNuevoItemRecetaId] = useState<string>('');
  // Cuando está activo, el "Costo Base de Insumos ($/pax)" sigue automáticamente la suma de los ítems p.p.
  const [costoSincronizadoConItems, setCostoSincronizadoConItems] = useState(true);

  // Cálculo del costo total de los ítems p.p. por persona (se calcula antes del early-return para poder usarlo en hooks)
  const costoTotalItemsPP = useMemo(
    () => itemsPorPersona.reduce((acc, it) => acc + (it.cantidadPorPersona * (it.costoUnitario || 0)), 0),
    [itemsPorPersona]
  );

  // Sincronización automática: el costo base del menú refleja siempre la suma real de los ítems p.p.
  useEffect(() => {
    if (!costoSincronizadoConItems) return;
    setCostoPersona(Math.round(costoTotalItemsPP));
  }, [costoTotalItemsPP, costoSincronizadoConItems]);

  if (!isOpen) return null;

  // Cálculo de precio sugerido con Food Cost estándar del 33%
  const costoPersonaNum = typeof costoPersona === 'number' ? costoPersona : parseFloat(String(costoPersona)) || 0;
  const precioSugerido = Math.round(costoPersonaNum / (margenSugerido / 100 || 0.33));

  const handleAgregarItemPP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoItemNombre.trim()) return;

    const cantPP = typeof nuevoItemCantidadPP === 'number' ? nuevoItemCantidadPP : parseFloat(String(nuevoItemCantidadPP)) || 1;
    const costoUnit = typeof nuevoItemCostoUnitario === 'number' ? nuevoItemCostoUnitario : parseFloat(String(nuevoItemCostoUnitario)) || 0;

    const nuevo: MenuItemRatio = {
      id: 'ratio-' + Date.now(),
      nombre: nuevoItemNombre.trim(),
      cantidadPorPersona: Math.max(0.1, cantPP),
      unidad: nuevoItemUnidad || 'unidad',
      costoUnitario: Math.max(0, costoUnit),
      insumoId: nuevoItemInsumoId || undefined,
      recetaId: nuevoItemRecetaId || undefined,
      recetaNombre: nuevoItemRecetaId ? recetasDisponibles.find(r => r.id === nuevoItemRecetaId)?.nombre : undefined
    };

    setItemsPorPersona(prev => [...prev, nuevo]);
    setNuevoItemNombre('');
    setNuevoItemCantidadPP(2);
    setNuevoItemCostoUnitario('');
    setNuevoItemInsumoId('');
    setNuevoItemRecetaId('');
  };

  // Al elegir una receta creada en la Calculadora de Recetas, el nombre y el costo unitario se llenan solos
  const handleSeleccionarRecetaItem = (recetaId: string) => {
    setNuevoItemRecetaId(recetaId);
    if (!recetaId) {
      setNuevoItemNombre('');
      setNuevoItemCostoUnitario('');
      setNuevoItemUnidad('unidad');
      return;
    }
    const receta = recetasDisponibles.find(r => r.id === recetaId);
    if (!receta) return;
    const { costoPorPorcion } = calcularCostoReceta(receta, insumosDisponibles);
    setNuevoItemNombre(receta.nombre);
    setNuevoItemUnidad('porción');
    setNuevoItemCostoUnitario(costoPorPorcion > 0 ? costoPorPorcion : '');
  };

  const handleEliminarItemPP = (id: string) => {
    setItemsPorPersona(prev => prev.filter(it => it.id !== id));
  };

  const handleActualizarCantidadPP = (id: string, cant: number) => {
    setItemsPorPersona(prev =>
      prev.map(it => (it.id === id ? { ...it, cantidadPorPersona: Math.max(0.1, cant) } : it))
    );
  };

  const handleAplicarCostoItemsAlCostoPersona = () => {
    setCostoSincronizadoConItems(true);
    setCostoPersona(Math.round(costoTotalItemsPP));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    // Determinar categoría final
    let categoriaFinal = categoria;
    if (esCategoriaLibre && categoriaLibreInput.trim()) {
      categoriaFinal = categoriaLibreInput.trim();
      // Guardar en categorías personalizadas de menús
      if (!categoriasPersonalizadas.some(c => c.toLowerCase() === categoriaFinal.toLowerCase())) {
        const actualizadas = [...categoriasPersonalizadas, categoriaFinal];
        setCategoriasPersonalizadas(actualizadas);
        try {
          localStorage.setItem(STORAGE_CATEGORIAS_MENU_KEY, JSON.stringify(actualizadas));
        } catch (err) {
          console.error(err);
        }
      }
    }

    const id = 'menu-' + Date.now();
    const recetasVinculadas = Array.from(new Set(itemsPorPersona.map(it => it.recetaId).filter(Boolean) as string[]));
    const nuevoMenu: MenuOption = {
      id,
      nombre: nombre.trim(),
      categoria: categoriaFinal,
      costoPersona: Math.max(0, costoPersonaNum),
      precioSugeridoPersona: precioSugerido,
      descripcion: descripcion.trim() || `Propuesta gastronómica formato ${categoriaFinal}.`,
      tiempos: {
        coctel: coctel.trim(),
        entrada: entrada.trim(),
        fondo: fondo.trim(),
        postre: postre.trim(),
        trasnoche: trasnoche.trim()
      },
      destacado,
      recetasIds: recetasVinculadas.length > 0 ? recetasVinculadas : undefined,
      costoCalculadoDesdeRecetas: recetasVinculadas.length > 0,
      itemsPorPersona: itemsPorPersona.length > 0 ? itemsPorPersona : undefined
    };

    onGuardarMenu(nuevoMenu);
    onClose();

    // Resetear formulario
    setNombre('');
    setDescripcion('');
    setCostoPersona(0);
    setCostoSincronizadoConItems(true);
    setItemsPorPersona([]);
    setNuevoItemNombre('');
    setNuevoItemCantidadPP(2);
    setNuevoItemCostoUnitario('');
    setNuevoItemInsumoId('');
    setNuevoItemRecetaId('');
    setCoctel('');
    setEntrada('');
    setFondo('');
    setPostre('');
    setTrasnoche('');
    setEsCategoriaLibre(false);
    setCategoriaLibreInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-6 max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Crear Nuevo Menú Gastronómico
              </h2>
              <p className="text-xs text-slate-500">
                Categorías 100% libres, tiempos de plato y cálculo de ítems por persona (p.p.) para compras exactas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Nombre del Menú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre del Menú <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banquete Gala Criolla, Menú Coffee Break Ejecutivo, Asado Campestre..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium text-slate-900 text-sm"
            />
          </div>

          {/* Categoría: Opción Libre vs Predefinida */}
          <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-700" />
                Categoría / Formato del Menú
              </label>
              <button
                type="button"
                onClick={() => {
                  setEsCategoriaLibre(!esCategoriaLibre);
                  if (!esCategoriaLibre) {
                    setCategoriaLibreInput('');
                  }
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {esCategoriaLibre ? '← Elegir de la lista predefinida' : '+ Crear categoría libre / personalizada'}
              </button>
            </div>

            {esCategoriaLibre ? (
              <div className="space-y-1 animate-in fade-in duration-150">
                <input
                  type="text"
                  required={esCategoriaLibre}
                  value={categoriaLibreInput}
                  onChange={(e) => setCategoriaLibreInput(e.target.value)}
                  placeholder="Escribe tu categoría libre (ej: Coffee Break Ejecutivo, Asado Criollo, Brunch de Campo...)"
                  className="w-full px-3 py-2 border-2 border-amber-500 bg-white rounded-xl focus:outline-hidden font-bold text-slate-900"
                />
                <span className="text-[10px] text-amber-800 font-medium block">
                  ✓ Quedará guardada como una categoría independiente y no te vinculará a lo preexistente.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={categoria}
                  onChange={(e) => {
                    if (e.target.value === '__NUEVA_LIBRE__') {
                      setEsCategoriaLibre(true);
                      setCategoriaLibreInput('');
                    } else {
                      setCategoria(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium bg-white text-slate-800"
                >
                  <optgroup label="Formatos Populares">
                    {CATEGORIAS_MENU_PREDEFINIDAS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                  {categoriasPersonalizadas.length > 0 && (
                    <optgroup label="Tus Categorías Creadas">
                      {categoriasPersonalizadas.map((cp, idx) => (
                        <option key={idx} value={cp}>{cp} ★</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__NUEVA_LIBRE__">+ Escribir nueva categoría libre...</option>
                </select>

                <div className="flex items-center">
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-full">
                    <input
                      type="checkbox"
                      checked={destacado}
                      onChange={(e) => setDestacado(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Marcar como "Más Solicitado"
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              SECCIÓN CLAVE: ÍTEMS POR PERSONA (P.P.) PARA CONSUMOS EXACTOS Y COMPRAS
              Ejemplo: 1 sandwich pp 2, bebidas pp 2
          ══════════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  Ratios & Consumos por Persona (Ítems p.p. para Compras)
                </span>
                <p className="text-[11px] text-slate-500">
                  Define cuántos ítems consume cada persona (ej: <strong>2 sandwiches pp, 2 bebidas pp</strong>) para calcular las compras exactas.
                </p>
              </div>

              {costoTotalItemsPP > 0 && (
                <button
                  type="button"
                  onClick={handleAplicarCostoItemsAlCostoPersona}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  title="Usar la suma de estos ítems como el costo de insumos del menú"
                >
                  Usar costo {formatMoneda(costoTotalItemsPP)}/pax
                </button>
              )}
            </div>

            {/* Lista actual de ítems p.p. */}
            {itemsPorPersona.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Ítem / Consumo</th>
                      <th className="py-2 px-3 text-center">Ratio p.p.</th>
                      <th className="py-2 px-3 text-center">Para {invitadosReferencia} Pax (Compra Exacta)</th>
                      <th className="py-2 px-3 text-right">Costo Unit.</th>
                      <th className="py-2 px-3 text-right">Subtotal p.p.</th>
                      <th className="py-2 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsPorPersona.map((item) => {
                      const totalCompraExacta = Math.round(item.cantidadPorPersona * invitadosReferencia);
                      const subtotalPP = item.cantidadPorPersona * (item.costoUnitario || 0);

                      return (
                        <tr key={item.id} className="hover:bg-amber-50/30">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {item.nombre}
                            {item.recetaId && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md align-middle whitespace-nowrap">
                                <ChefHat className="w-2.5 h-2.5" />
                                Desde receta
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <input
                                type="number"
                                min={0.1}
                                step={0.5}
                                value={item.cantidadPorPersona}
                                onChange={(e) => handleActualizarCantidadPP(item.id, Number(e.target.value))}
                                className="w-12 text-center bg-white font-extrabold text-slate-900 rounded border border-slate-300 py-0.5 focus:outline-hidden"
                              />
                              <span className="text-[10px] text-slate-500">pp ({item.unidad})</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-800 tabular-nums">
                            {totalCompraExacta} {item.unidad}s
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                            {formatMoneda(item.costoUnitario || 0)}
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                            {formatMoneda(subtotalPP)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarItemPP(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-slate-700 text-right">
                        Costo Total de Consumos por Persona (p.p.):
                      </td>
                      <td className="py-2 px-3 text-right font-black text-amber-950 tabular-nums">
                        {formatMoneda(costoTotalItemsPP)}/pax
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs">
                No hay consumos p.p. registrados aún. Agrega ítems como sandwiches o bebidas usando el formulario de abajo.
              </div>
            )}

            {/* Formulario rápido para añadir ítem por persona */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                + Agregar Ítem por Persona (ej: 1 sandwich pp 2, bebidas pp 2)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {recetasDisponibles.length > 0 && (
                  <div className="sm:col-span-12">
                    <label className="block text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      Usar una receta creada en la Calculadora (el nombre y el costo se llenan solos) — opcional
                    </label>
                    <select
                      value={nuevoItemRecetaId}
                      onChange={(e) => handleSeleccionarRecetaItem(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/60 rounded-lg text-slate-800 focus:outline-hidden text-xs font-semibold"
                    >
                      <option value="">— Ítem libre (ingresar nombre y costo a mano) —</option>
                      {recetasDisponibles.map((receta) => {
                        const { costoPorPorcion } = calcularCostoReceta(receta, insumosDisponibles);
                        return (
                          <option key={receta.id} value={receta.id}>
                            {receta.nombre} · {formatMoneda(costoPorPorcion)} por porción
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={nuevoItemNombre}
                    onChange={(e) => setNuevoItemNombre(e.target.value)}
                    placeholder="Nombre ítem (ej: Sandwich ave, Bebidas...)"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={0.1}
                      step={0.5}
                      value={nuevoItemCantidadPP}
                      onChange={(e) => setNuevoItemCantidadPP(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="pp (ej: 2)"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden text-xs"
                      title="Cantidad por persona"
                    />
                    <span className="text-[9px] text-slate-400 block text-center">Cant. pp</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={nuevoItemUnidad}
                    onChange={(e) => setNuevoItemUnidad(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden text-xs bg-white"
                  >
                    <option value="unidad">unidad</option>
                    <option value="lata / vaso">lata / vaso</option>
                    <option value="porción">porción</option>
                    <option value="copa">copa</option>
                    <option value="botella">botella</option>
                    <option value="taza">taza</option>
                  </select>
                  <span className="text-[9px] text-slate-400 block text-center">Unidad</span>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={nuevoItemCostoUnitario}
                    onChange={(e) => setNuevoItemCostoUnitario(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Costo unit."
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:outline-hidden text-xs tabular-nums"
                  />
                  <span className="text-[9px] text-slate-400 block text-center">Costo Unit $</span>
                </div>

                <div className="sm:col-span-1 flex items-start pt-0.5">
                  <button
                    type="button"
                    onClick={handleAgregarItemPP}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Añadir ítem"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción general */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Descripción del Menú (Aparecerá en cotizaciones y fichas)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Propuesta gastronómica integral con bocados salados, repostería y estación de bebidas frías y calientes."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden text-slate-800"
            />
          </div>

          {/* Costeo inicial & Margen Food Cost 33% */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                Costo Base de Insumos por Comensal ($/pax)
              </span>
              {costoTotalItemsPP > 0 && (
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  Ítems pp suman: {formatMoneda(costoTotalItemsPP)}/pax
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                  Costo de Insumos Estimado ($/pax)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={costoPersona}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      // Si el usuario edita el costo a mano, se desactiva el cálculo automático
                      setCostoSincronizadoConItems(false);
                      setCostoPersona(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    onBlur={() => {
                      if (costoPersona === '') setCostoPersona(0);
                    }}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 tabular-nums focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Margen Food Cost:</span>
                  <span className="font-bold text-amber-800">{margenSugerido}% (Estándar)</span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Precio Sugerido:</span>
                  <span className="font-black text-amber-950 text-sm tabular-nums">
                    {formatMoneda(precioSugerido)}/pax
                  </span>
                </div>
              </div>
            </div>

            {/* Estado de la sincronización entre ítems p.p. y el costo base */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {costoSincronizadoConItems ? (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  El costo base se calcula solo desde los ítems p.p. ({formatMoneda(costoTotalItemsPP)}/pax)
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500">
                  Costo base ingresado a mano (no sigue la suma de los ítems p.p.)
                </span>
              )}
              {!costoSincronizadoConItems && costoTotalItemsPP > 0 && (
                <button
                  type="button"
                  onClick={() => setCostoSincronizadoConItems(true)}
                  className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                >
                  Volver a calcular desde los ítems p.p.
                </button>
              )}
            </div>
          </div>

          {/* Desglose de los 5 tiempos del menú */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Minuta de los 5 Tiempos del Menú (Opcional)
              </span>
              <button
                type="button"
                onClick={() => setMostrarTiemposDetallados(!mostrarTiemposDetallados)}
                className="text-amber-700 hover:text-amber-800 font-bold text-[11px] cursor-pointer"
              >
                {mostrarTiemposDetallados ? 'Ocultar campos de tiempos' : 'Personalizar tiempos ahora +'}
              </button>
            </div>

            {mostrarTiemposDetallados && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    1. Cóctel de Bienvenida / Aperitivo
                  </label>
                  <input
                    type="text"
                    value={coctel}
                    onChange={(e) => setCoctel(e.target.value)}
                    placeholder="Ej: Bocados fríos y calientes, canapés tibios y ceviche"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    2. Entrada
                  </label>
                  <input
                    type="text"
                    value={entrada}
                    onChange={(e) => setEntrada(e.target.value)}
                    placeholder="Ej: Carpaccio de salmón del sur o pastelera de choclo en greda"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    3. Plato de Fondo
                  </label>
                  <input
                    type="text"
                    value={fondo}
                    onChange={(e) => setFondo(e.target.value)}
                    placeholder="Ej: Lomo vetado Angus con papas rústicas al romero"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    4. Postre
                  </label>
                  <input
                    type="text"
                    value={postre}
                    onChange={(e) => setPostre(e.target.value)}
                    placeholder="Ej: Trilogía dulce artesanal o buffet de postres chilenos"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    5. Trasnoche / Bajón
                  </label>
                  <input
                    type="text"
                    value={trasnoche}
                    onChange={(e) => setTrasnoche(e.target.value)}
                    placeholder="Ej: Mini hamburguesas brioche caseras y consomé caliente"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Crear Menú</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
