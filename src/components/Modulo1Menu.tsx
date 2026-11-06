import React, { useState, useMemo } from 'react';
import { MenuOption, MenuItemRatio, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { formatMoneda } from '../utils/formatters';
import { ModalCrearMenu } from './ModalCrearMenu';
import { calcularCostoReceta } from '../config/insumosYRecetas';
import { construirMinutaConFichas } from '../utils/minutaHelper';
import {
  Utensils,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Plus,
  FolderPlus,
  ExternalLink,
  Tag,
  Pencil,
  ListPlus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Coffee
} from 'lucide-react';

interface Modulo1MenuProps {
  menus: MenuOption[];
  menuSeleccionadoId: string;
  onSelectMenu: (id: string) => void;
  invitados: number;
  onChangeInvitados: (num: number) => void;
  onIrARecetas?: (menuId: string) => void;
  onAddMenu?: (nuevoMenu: MenuOption) => void;
  onUpdateMenu?: (menuActualizado: MenuOption) => void;
  onUpdateReceta?: (recetaActualizada: RecetaFichaTecnica) => void;
  costoFijoPorPersona?: number;
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  recetas?: RecetaFichaTecnica[];
  insumos?: InsumoMaestro[];
}

export const Modulo1Menu: React.FC<Modulo1MenuProps> = ({
  menus,
  menuSeleccionadoId,
  onSelectMenu,
  invitados,
  onChangeInvitados,
  onIrARecetas,
  onAddMenu,
  onUpdateMenu,
  onUpdateReceta,
  costoFijoPorPersona = 0,
  recetas = [],
  insumos = []
}) => {
  const [menuExpandido, setMenuExpandido] = useState<string | null>(menuSeleccionadoId);
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);
  const [menuAEditar, setMenuAEditar] = useState<MenuOption | null>(null);

  // Modal para Incorporar Recetas al Menú (Menú Mixto / Agregar de otros menús o libres)
  const [modalIncorporarOpen, setModalIncorporarOpen] = useState(false);
  const [menuDestinoId, setMenuDestinoId] = useState<string>(menuSeleccionadoId);
  const [recetaSeleccionadaParaIncorporar, setRecetaSeleccionadaParaIncorporar] = useState<string>('');
  const [cantidadPPIncorporar, setCantidadPPIncorporar] = useState<number | string>(1);
  const [busquedaReceta, setBusquedaReceta] = useState<string>('');
  const [filtroCategoriaReceta, setFiltroCategoriaReceta] = useState<string>('todas');
  const [toastIncorporacion, setToastIncorporacion] = useState<string | null>(null);

  const notificar = (msg: string) => {
    setToastIncorporacion(msg);
    setTimeout(() => setToastIncorporacion(null), 3500);
  };

  const handleAbrirModalIncorporar = (menuId: string) => {
    setMenuDestinoId(menuId);
    setRecetaSeleccionadaParaIncorporar(recetas[0]?.id || '');
    setCantidadPPIncorporar(1);
    setBusquedaReceta('');
    setFiltroCategoriaReceta('todas');
    setModalIncorporarOpen(true);
  };

  const handleConfirmarIncorporacion = () => {
    const targetMenu = menus.find(m => m.id === menuDestinoId);
    const receta = recetas.find(r => r.id === recetaSeleccionadaParaIncorporar);
    if (!targetMenu || !receta || !onUpdateMenu) return;

    const cantPP = Math.max(0.1, Number(cantidadPPIncorporar) || 1);
    const calc = calcularCostoReceta(receta, insumos);
    const costoUnit = calc.costoPorPorcion;

    const itemsActuales = targetMenu.itemsPorPersona ? [...targetMenu.itemsPorPersona] : [];
    const indexExistente = itemsActuales.findIndex(
      it => it.recetaId === receta.id || it.nombre.toLowerCase().trim() === receta.nombre.toLowerCase().trim()
    );

    if (indexExistente >= 0) {
      itemsActuales[indexExistente] = {
        ...itemsActuales[indexExistente],
        cantidadPorPersona: itemsActuales[indexExistente].cantidadPorPersona + cantPP,
        costoUnitario: costoUnit
      };
    } else {
      itemsActuales.push({
        id: 'ratio-rec-' + receta.id + '-' + Date.now(),
        nombre: receta.nombre,
        cantidadPorPersona: cantPP,
        unidad: 'porción',
        costoUnitario: costoUnit,
        recetaId: receta.id,
        recetaNombre: receta.nombre,
        categoria: (receta.tiempoMenu || '').toLowerCase() === 'cocteleria' ? 'bebestible' : 'comida',
        tipoOrigen: 'receta'
      });
    }

    const nuevoCosto = targetMenu.costoPersona + (costoUnit * cantPP);
    const nuevoPrecioSugerido = Math.round(nuevoCosto / 0.33);

    onUpdateMenu({
      ...targetMenu,
      itemsPorPersona: itemsActuales,
      costoPersona: nuevoCosto,
      precioSugeridoPersona: nuevoPrecioSugerido
    });

    if (onUpdateReceta) {
      const idsActuales = receta.menusAsociadosIds ? [...receta.menusAsociadosIds] : [];
      if (!idsActuales.includes(targetMenu.id)) {
        idsActuales.push(targetMenu.id);
      }
      onUpdateReceta({
        ...receta,
        menuAsociadoId: receta.menuAsociadoId || targetMenu.id,
        menusAsociadosIds: idsActuales
      });
    }

    setModalIncorporarOpen(false);
    notificar(`✓ "${receta.nombre}" incorporada exitosamente a "${targetMenu.nombre}"`);
  };

  const handleEliminarItemPPDelMenu = (menuId: string, itemId: string) => {
    const targetMenu = menus.find(m => m.id === menuId);
    if (!targetMenu || !onUpdateMenu || !targetMenu.itemsPorPersona) return;

    const itemAEliminar = targetMenu.itemsPorPersona.find(it => it.id === itemId);
    const nuevosItems = targetMenu.itemsPorPersona.filter(it => it.id !== itemId);
    const costoARestar = itemAEliminar ? (itemAEliminar.costoUnitario || 0) * (itemAEliminar.cantidadPorPersona || 1) : 0;
    const nuevoCosto = Math.max(0, targetMenu.costoPersona - costoARestar);
    const nuevoPrecio = Math.round(nuevoCosto / 0.33);

    onUpdateMenu({
      ...targetMenu,
      itemsPorPersona: nuevosItems,
      costoPersona: nuevoCosto,
      precioSugeridoPersona: nuevoPrecio
    });

    notificar(`✓ Ítem eliminado del menú`);
  };

  // Recetas filtradas para el modal de incorporación
  const recetasFiltradasModal = useMemo(() => {
    return recetas.filter(r => {
      const matchBusqueda = !busquedaReceta.trim() ||
        r.nombre.toLowerCase().includes(busquedaReceta.toLowerCase()) ||
        (r.categoria || '').toLowerCase().includes(busquedaReceta.toLowerCase()) ||
        (r.tiempoMenu || '').toLowerCase().includes(busquedaReceta.toLowerCase());

      const matchCat = filtroCategoriaReceta === 'todas' ||
        (r.categoria || '').toLowerCase() === filtroCategoriaReceta.toLowerCase() ||
        (r.tiempoMenu || '').toLowerCase() === filtroCategoriaReceta.toLowerCase();

      return matchBusqueda && matchCat;
    });
  }, [recetas, busquedaReceta, filtroCategoriaReceta]);

  const categoriasDisponiblesRecetas = useMemo(() => {
    const setCats = new Set<string>();
    recetas.forEach(r => {
      if (r.categoria) setCats.add(r.categoria);
      if (r.tiempoMenu) setCats.add(r.tiempoMenu);
    });
    return Array.from(setCats);
  }, [recetas]);

  const recetaSeleccionadaObjeto = recetas.find(r => r.id === recetaSeleccionadaParaIncorporar);
  const calculoRecetaSeleccionada = recetaSeleccionadaObjeto ? calcularCostoReceta(recetaSeleccionadaObjeto, insumos) : null;
  const costoTotalSumar = calculoRecetaSeleccionada ? calculoRecetaSeleccionada.costoPorPorcion * (Number(cantidadPPIncorporar) || 1) : 0;

  const menuActual = menus.find(m => m.id === menuSeleccionadoId) || menus[0];
  const costoTotalMenu = (menuActual?.costoPersona || 0) * invitados;
  const precioVentaTotalMenu = (menuActual?.precioSugeridoPersona || 0) * invitados;

  const presetsInvitados = [40, 60, 80, 100, 120, 150, 180, 200];

  const handleInvitadosInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onChangeInvitados(val);
    } else if (e.target.value === '') {
      onChangeInvitados(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {toastIncorporacion && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastIncorporacion}</span>
        </div>
      )}

      {/* TARJETA 01: PROPUESTA GASTRONÓMICA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs transition-all">
        {/* Encabezado del Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                Propuesta Gastronómica & Comensales
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona el formato de menú o incorpora productos de forma libre para menús mixtos y personalizados.
              </p>
            </div>
          </div>

          {/* Resumen en vivo del módulo */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl px-4 py-2 text-right shrink-0">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Costo Insumos Menú
            </div>
            <div className="text-lg font-extrabold text-amber-950 tabular-nums">
              {formatMoneda(costoTotalMenu)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              {invitados} invitados × {formatMoneda(menuActual?.costoPersona || 0)}/pax
            </div>
          </div>
        </div>

        {/* Control de Invitados */}
        <div className="my-6 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Número de Invitados / Comensales Confirmados
              </label>
              <p className="text-xs text-slate-500">
                Este número alimenta automáticamente las porciones de comida, vajilla y cálculo de garzones recomendados.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => onChangeInvitados(Math.max(10, invitados - 10))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Restar 10 invitados"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => onChangeInvitados(Math.max(1, invitados - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Restar 1 invitado"
              >
                -1
              </button>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={1500}
                  value={invitados === 0 ? '' : invitados}
                  onChange={handleInvitadosInputChange}
                  className="w-24 h-10 px-2 text-center text-xl font-extrabold text-slate-900 bg-white border-2 border-amber-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 tabular-nums shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => onChangeInvitados(invitados + 1)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Sumar 1 invitado"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onChangeInvitados(invitados + 10)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Sumar 10 invitados"
              >
                +10
              </button>
            </div>
          </div>

          {/* Presets Rápidos */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Rápidos:</span>
            {presetsInvitados.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeInvitados(preset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  invitados === preset
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset} pax
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Menús */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Formatos de Banquete Disponibles ({menus.length} opciones)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAbrirModalIncorporar(menuSeleccionadoId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Incorporar cualquier receta o producto a este menú para armar un menú mixto"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>＋ Incorporar Receta al Menú (Menú Mixto)</span>
              </button>
              {onAddMenu && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuAEditar(null);
                    setModalNuevoMenuOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Crear Menú Gastronómico</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menus.map((menu) => {
              const isSelected = menu.id === menuSeleccionadoId;
              const isExpanded = menuExpandido === menu.id;

              return (
                <div
                  key={menu.id}
                  onClick={() => onSelectMenu(menu.id)}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                            {menu.categoria}
                          </span>
                          {menu.destacado && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Recomendado
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                          {menu.nombre}
                        </h3>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-amber-600 text-white shadow-xs' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {menu.descripcion}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Costo Insumos</span>
                        <strong className="text-slate-800 font-bold tabular-nums">
                          {formatMoneda(menu.costoPersona)}/pax
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Precio Venta Sugerido</span>
                        <strong className="text-amber-900 font-extrabold text-sm tabular-nums">
                          {formatMoneda(menu.precioSugeridoPersona)}/pax
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuExpandido(isExpanded ? null : menu.id);
                      }}
                      className="mt-3 w-full py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Ocultar minuta detallada' : 'Ver minuta de los 5 tiempos'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirModalIncorporar(menu.id);
                        }}
                        className="py-1.5 text-[11px] font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Incorporar recetas o productos de otros menús o catálogo libre"
                      >
                        <ListPlus className="w-3 h-3 text-blue-700" />
                        <span>＋ Incorporar Receta</span>
                      </button>

                      {onUpdateMenu && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAEditar(menu);
                            setModalNuevoMenuOpen(true);
                          }}
                          className="py-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Editar nombre, descripción, tiempos, ítems p.p. y costos de este menú"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>✏️ Editar este menú</span>
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs space-y-2.5 bg-slate-50/70 -mx-4 -mb-4 p-4 rounded-b-xl">
                        {/* Minuta con tiempos + fichas vinculadas dinámicamente */}
                        {(() => {
                          const tiempos = construirMinutaConFichas(menu, recetas, insumos);
                          const visibles = tiempos.filter(t => !t.ocultoManual && t.tieneContenido);
                          if (visibles.length === 0) {
                            return (
                              <div className="text-center text-slate-400 py-2 italic text-xs">
                                Este menú aún no tiene platos ni fichas asociadas. Haz clic en "Incorporar Receta" para sumar preparaciones.
                              </div>
                            );
                          }
                          return visibles.map((t) => {
                            const fichasConCosto = t.fichas.map(f => ({
                              ficha: f,
                              costo: calcularCostoReceta(f, insumos).costoPorPorcion
                            }));
                            return (
                              <div key={t.tiempoId} className="space-y-0.5">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-700">{t.tiempoLabel}:</span>
                                  {t.textoManual ? (
                                    <span className="text-slate-600">{t.textoManual}</span>
                                  ) : fichasConCosto.length === 0 ? (
                                    <span className="text-slate-400 italic text-[11px]">(sin texto manual)</span>
                                  ) : null}
                                </div>
                                {fichasConCosto.length > 0 && (
                                  <div className="ml-3 space-y-1">
                                    {fichasConCosto.map(({ ficha, costo }) => (
                                      <div key={ficha.id} className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                        <span className="font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                                          📋 Ficha
                                        </span>
                                        <span className="font-semibold text-slate-800">{ficha.nombre}</span>
                                        <span className="text-slate-400">·</span>
                                        <span className="font-bold text-emerald-800 tabular-nums">{formatMoneda(costo)}/pax</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}

                        {/* Consumos por persona (p.p.) */}
                        <div className="pt-2.5 border-t border-slate-200 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                              📦 Consumos por Persona & Compras Exactas ({invitados} Pax):
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirModalIncorporar(menu.id);
                              }}
                              className="px-2 py-0.5 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="Incorporar cualquier receta libre o de otro menú"
                            >
                              <Plus className="w-3 h-3" />
                              <span>＋ Incorporar Receta</span>
                            </button>
                          </div>

                          {menu.itemsPorPersona && menu.itemsPorPersona.length > 0 ? (
                            <div className="space-y-1">
                              {menu.itemsPorPersona.map((it) => {
                                const totalCompra = Math.round(it.cantidadPorPersona * invitados * 10) / 10;
                                return (
                                  <div key={it.id} className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-amber-200/70">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {it.recetaId && (
                                        <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-blue-100 text-blue-800 shrink-0">
                                          Ficha
                                        </span>
                                      )}
                                      <span className="font-semibold text-slate-800 truncate">
                                        • {it.nombre}: <strong className="text-amber-800">{it.cantidadPorPersona} pp</strong> ({it.unidad})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] tabular-nums">
                                        Total: {totalCompra} {it.unidad}s
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEliminarItemPPDelMenu(menu.id, it.id);
                                        }}
                                        className="text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                                        title="Eliminar este ítem del menú"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-2 text-slate-400 text-xs italic bg-white/70 rounded-md border border-dashed border-amber-200">
                              Sin consumos p.p. registrados aún.{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirModalIncorporar(menu.id);
                                }}
                                className="text-blue-700 font-bold underline hover:text-blue-900 ml-1 cursor-pointer"
                              >
                                Incorporar primera receta →
                              </button>
                            </div>
                          )}
                        </div>

                        {onIrARecetas && (
                          <div className="pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onIrARecetas(menu.id);
                              }}
                              className="w-full py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold rounded-lg text-center transition-colors cursor-pointer"
                            >
                              Costear platos de este menú en la Calculadora de Recetas →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MODAL: INCORPORAR RECETA / PRODUCTO AL MENÚ (CREAR MENÚ MIXTO) ── */}
      {modalIncorporarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <ListPlus className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Incorporar Receta / Producto al Menú
                  </h2>
                  <p className="text-xs text-slate-500">
                    Crea menús mixtos o suma preparaciones libres a cualquier menú existente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalIncorporarOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menú Destino */}
            <div className="my-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Menú al que se incorporará:
              </label>
              <select
                value={menuDestinoId}
                onChange={(e) => setMenuDestinoId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-blue-300 rounded-lg text-slate-800 focus:outline-hidden"
              >
                {menus.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.categoria}) · Costo actual: {formatMoneda(m.costoPersona)}/pax
                  </option>
                ))}
              </select>
            </div>

            {/* Buscador y filtro por categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busquedaReceta}
                  onChange={(e) => setBusquedaReceta(e.target.value)}
                  placeholder="Buscar receta por nombre o categoría..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <select
                value={filtroCategoriaReceta}
                onChange={(e) => setFiltroCategoriaReceta(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="todas">Todas las categorías ({recetas.length})</option>
                {categoriasDisponiblesRecetas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Catálogo de Recetas para Seleccionar */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 mb-4">
              {recetasFiltradasModal.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No se encontraron recetas con ese filtro.
                </div>
              ) : (
                recetasFiltradasModal.map(r => {
                  const isChecked = r.id === recetaSeleccionadaParaIncorporar;
                  const { costoPorPorcion } = calcularCostoReceta(r, insumos);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRecetaSeleccionadaParaIncorporar(r.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {r.nombre}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {r.categoria || r.tiempoMenu || 'Receta Libre'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs text-emerald-800 tabular-nums">
                          {formatMoneda(costoPorPorcion)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">/porción</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Control de Cantidad p.p. */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block">
                  Porción por comensal (p.p.):
                </label>
                <span className="text-[10px] text-slate-500">
                  Cantidad que consumirá cada uno de los {invitados} invitados
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  value={cantidadPPIncorporar}
                  onChange={(e) => setCantidadPPIncorporar(e.target.value)}
                  className="w-16 px-2 py-1 text-center font-extrabold text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 tabular-nums"
                />
                <span className="text-xs text-slate-600 font-semibold">porción p.p.</span>
              </div>
            </div>

            {/* Resumen del impacto financiero */}
            {recetaSeleccionadaObjeto && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-emerald-950 block">
                    Impacto en el Menú:
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Se sumará al costo base de insumos por comensal
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-900 tabular-nums">
                    +{formatMoneda(costoTotalSumar)} /pax
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    Total evento: +{formatMoneda(costoTotalSumar * invitados)}
                  </span>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalIncorporarOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarIncorporacion}
                disabled={!recetaSeleccionadaParaIncorporar}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Incorporar al Menú</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Menú directamente desde el Módulo 1 */}
      {onAddMenu && (
        <ModalCrearMenu
          isOpen={modalNuevoMenuOpen}
          onClose={() => {
            setModalNuevoMenuOpen(false);
            setMenuAEditar(null);
          }}
          menuAEditar={menuAEditar}
          onGuardarMenu={(menuGuardado) => {
            if (menuAEditar && onUpdateMenu) {
              onUpdateMenu(menuGuardado);
            } else {
              onAddMenu(menuGuardado);
              onSelectMenu(menuGuardado.id);
            }
            setMenuExpandido(menuGuardado.id);
            setMenuAEditar(null);
          }}
          recetasDisponibles={recetas}
          insumosDisponibles={insumos}
          invitadosReferencia={invitados}
        />
      )}
    </div>
  );
};


