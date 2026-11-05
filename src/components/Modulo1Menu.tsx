import React, { useState } from 'react';
import { MenuOption, MenuItemRatio, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { formatMoneda } from '../utils/formatters';
import { ModalCrearMenu } from './ModalCrearMenu';
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
  Pencil
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
  costoFijoPorPersona = 0,
  recetas = [],
  insumos = []
}) => {
  const [menuExpandido, setMenuExpandido] = useState<string | null>(menuSeleccionadoId);
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);
  const [menuAEditar, setMenuAEditar] = useState<MenuOption | null>(null);

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
                Selecciona el formato de menú e ingresa la cantidad de invitados para calcular costos automáticos.
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Formatos de Banquete Disponibles ({menus.length} opciones)
            </span>
            {onAddMenu && (
              <button
                type="button"
                onClick={() => {
                  setMenuAEditar(null);
                  setModalNuevoMenuOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>+ Crear Menú Gastronómico</span>
              </button>
            )}
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

                    {onUpdateMenu && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAEditar(menu);
                          setModalNuevoMenuOpen(true);
                        }}
                        className="mt-1.5 w-full py-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Editar nombre, descripción, tiempos, ítems p.p. y costos de este menú"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>✏️ Editar este menú</span>
                      </button>
                    )}

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs space-y-2 bg-slate-50/70 -mx-4 -mb-4 p-4 rounded-b-xl">
                        <div>
                          <span className="font-bold text-slate-700">Cóctel de Bienvenida:</span>{' '}
                          <span className="text-slate-600">{menu.tiempos.coctel}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Entrada:</span>{' '}
                          <span className="text-slate-600">{menu.tiempos.entrada}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Plato de Fondo:</span>{' '}
                          <span className="text-slate-600">{menu.tiempos.fondo}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Postre:</span>{' '}
                          <span className="text-slate-600">{menu.tiempos.postre}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Bajonativo / Trasnoche:</span>{' '}
                          <span className="text-slate-600">{menu.tiempos.trasnoche}</span>
                        </div>

                        {/* Consumos por persona (p.p.) */}
                        {menu.itemsPorPersona && menu.itemsPorPersona.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-200 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                              📦 Consumos por Persona & Compras Exactas ({invitados} Pax):
                            </span>
                            <div className="space-y-1">
                              {menu.itemsPorPersona.map((it) => {
                                const totalCompra = Math.round(it.cantidadPorPersona * invitados * 10) / 10;
                                return (
                                  <div key={it.id} className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-amber-200/70">
                                    <span className="font-semibold text-slate-800">
                                      • {it.nombre}: <strong className="text-amber-800">{it.cantidadPorPersona} pp</strong> ({it.unidad})
                                    </span>
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] tabular-nums">
                                      Total: {totalCompra} {it.unidad}s
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

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


