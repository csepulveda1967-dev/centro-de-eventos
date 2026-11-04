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
  Wine,
  Trash2,
  GlassWater,
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
  costoFijoPorPersona?: number;
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  recetas?: RecetaFichaTecnica[];
  insumos?: InsumoMaestro[];
}

const BEBESTIBLES_SUGERIDOS_PRESET = [
  { id: 'beb-sug-gaseosas', nombre: 'Bebidas, Gaseosas y Aguas Minerales (350cc)', cantidadPorPersona: 2, unidad: 'lata / vaso', costoUnitario: 900, categoria: 'bebestible' as const },
  { id: 'beb-sug-vinos', nombre: 'Vinos Reserva & Espumante de Brindis', cantidadPorPersona: 1.5, unidad: 'copa', costoUnitario: 1800, categoria: 'bebestible' as const },
  { id: 'beb-sug-barra', nombre: 'Barra Libre / Coctelería de Autor (Pisco Sour, Mojito, Gin)', cantidadPorPersona: 2, unidad: 'copa / vaso', costoUnitario: 2500, categoria: 'bebestible' as const },
  { id: 'beb-sug-jugos', nombre: 'Jugos Naturales 100% Pulpa Estacional', cantidadPorPersona: 1.5, unidad: 'vaso', costoUnitario: 1200, categoria: 'bebestible' as const },
  { id: 'beb-sug-cervezas', nombre: 'Cervezas Artesanales & Premium', cantidadPorPersona: 2, unidad: 'botella', costoUnitario: 1500, categoria: 'bebestible' as const },
  { id: 'beb-sug-cafe', nombre: 'Estación Café de Grano & Té Gourmet', cantidadPorPersona: 1, unidad: 'taza', costoUnitario: 800, categoria: 'bebestible' as const }
];

export const Modulo1Menu: React.FC<Modulo1MenuProps> = ({
  menus,
  menuSeleccionadoId,
  onSelectMenu,
  invitados,
  onChangeInvitados,
  onIrARecetas,
  onAddMenu,
  costoFijoPorPersona = 0,
  bebestibles = [],
  onUpdateBebestibles,
  recetas = [],
  insumos = []
}) => {
  const [menuExpandido, setMenuExpandido] = useState<string | null>(menuSeleccionadoId);
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);
  const [nuevoBebNombre, setNuevoBebNombre] = useState('');
  const [nuevoBebRatio, setNuevoBebRatio] = useState<number | string>(2);
  const [nuevoBebUnidad, setNuevoBebUnidad] = useState('lata / vaso');
  const [nuevoBebCosto, setNuevoBebCosto] = useState<number | string>(900);

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

  // Manejadores de Bebestibles por Persona (p.p.)
  const handleToggleBebestibleSugerido = (beb: typeof BEBESTIBLES_SUGERIDOS_PRESET[0]) => {
    if (!onUpdateBebestibles) return;
    const existe = bebestibles.some(b => b.nombre.toLowerCase().includes(beb.nombre.toLowerCase().slice(0, 10)));
    if (existe) {
      onUpdateBebestibles(bebestibles.filter(b => !b.nombre.toLowerCase().includes(beb.nombre.toLowerCase().slice(0, 10))));
    } else {
      const nuevo: MenuItemRatio = {
        id: 'beb-' + Date.now(),
        nombre: beb.nombre,
        cantidadPorPersona: beb.cantidadPorPersona,
        unidad: beb.unidad,
        costoUnitario: beb.costoUnitario,
        categoria: 'bebestible'
      };
      onUpdateBebestibles([...bebestibles, nuevo]);
    }
  };

  const handleUpdateCantidadBeb = (id: string, cant: number) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(
      bebestibles.map(b => b.id === id ? { ...b, cantidadPorPersona: Math.max(0, cant) } : b)
    );
  };

  const handleRemoveBeb = (id: string) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(bebestibles.filter(b => b.id !== id));
  };

  const handleAddCustomBeb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoBebNombre.trim() || !onUpdateBebestibles) return;
    const cantNum = typeof nuevoBebRatio === 'number' ? nuevoBebRatio : parseFloat(String(nuevoBebRatio).replace(',', '.')) || 1;
    const costoNum = typeof nuevoBebCosto === 'number' ? nuevoBebCosto : parseFloat(String(nuevoBebCosto).replace(',', '.')) || 0;
    const nuevo: MenuItemRatio = {
      id: 'beb-cust-' + Date.now(),
      nombre: nuevoBebNombre.trim(),
      cantidadPorPersona: Math.max(0.01, cantNum),
      unidad: nuevoBebUnidad,
      costoUnitario: Math.max(0, costoNum),
      categoria: 'bebestible'
    };
    onUpdateBebestibles([...bebestibles, nuevo]);
    setNuevoBebNombre('');
    setNuevoBebRatio(2);
    setNuevoBebCosto(900);
  };

  const costoTotalBebestiblesPorPersona = bebestibles.reduce(
    (acc, b) => acc + (b.cantidadPorPersona * (b.costoUnitario || 0)),
    0
  );
  const costoTotalBebestiblesEvento = costoTotalBebestiblesPorPersona * invitados;

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
                onClick={() => setModalNuevoMenuOpen(true)}
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

      {/* ════════════════════════════════════════════════════════════════════════
          TARJETA 01.B: SERVICIO DE BEBESTIBLES & BARRA POR PERSONA (P.P.)
          Requerimiento: Incluir bebestibles y considerarlos por persona (pp)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              <Wine className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                  Consumos Exactos p.p.
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Servicio de Bebestibles, Vinos & Barra por Persona
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Calcula cuántas bebidas, copas de vino o tragos consume cada invitado ({invitados} Pax) para costeo y compras exactas.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-right shrink-0">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Costo Bebestibles ({invitados} Pax)
            </span>
            <div className="text-lg font-black text-purple-950 tabular-nums">
              {formatMoneda(costoTotalBebestiblesEvento)}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              {formatMoneda(costoTotalBebestiblesPorPersona)} /comensal
            </span>
          </div>
        </div>

        {/* Presets Rápidos de Bebestibles para Activar en 1 Clic */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Catálogo Rápido: Activar o desactivar servicios de bebestibles
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {BEBESTIBLES_SUGERIDOS_PRESET.map((b) => {
              const estaActivo = bebestibles.some(it => it.nombre.toLowerCase().includes(b.nombre.toLowerCase().slice(0, 10)));
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleToggleBebestibleSugerido(b)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    estaActivo
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-1 ring-purple-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs leading-tight pr-2">
                    <strong className="block text-[11px] font-bold truncate">{b.nombre}</strong>
                    <span className={estaActivo ? 'text-purple-200 text-[10px]' : 'text-slate-500 text-[10px]'}>
                      {b.cantidadPorPersona} {b.unidad} pp · {formatMoneda(b.costoUnitario)} c/u
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    estaActivo ? 'bg-white text-purple-700' : 'border border-slate-300'
                  }`}>
                    {estaActivo && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de Bebestibles Configurados Activos */}
        {bebestibles.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bebestible / Líquido</th>
                  <th className="py-2.5 px-3 text-center">Ratio p.p. (Entero o Decimal)</th>
                  <th className="py-2.5 px-3 text-center">Total a Comprar ({invitados} Pax)</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal p.p.</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bebestibles.map((item) => {
                  const totalCompra = Math.round(item.cantidadPorPersona * invitados * 10) / 10;
                  const subtotalPP = Math.round(item.cantidadPorPersona * (item.costoUnitario || 0));

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.nombre}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1 font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-300">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.cantidadPorPersona}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value.replace(',', '.'));
                              handleUpdateCantidadBeb(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-14 text-center bg-white font-black text-slate-900 rounded border border-slate-300 py-0.5 focus:outline-hidden text-xs"
                            title="Ingresa número entero (1, 2, 3) o decimal (0.5, 1.5)"
                          />
                          <span className="text-[10px] text-slate-600 font-medium">pp ({item.unidad})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800 tabular-nums">
                        {totalCompra} {item.unidad}s
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatMoneda(item.costoUnitario || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatMoneda(subtotalPP)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBeb(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Eliminar bebestible"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-slate-700 text-right">
                    Total Bebestibles por Persona:
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-purple-950 tabular-nums text-sm">
                    {formatMoneda(costoTotalBebestiblesPorPersona)}/pax
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
            No has incluido bebestibles por persona aún. Haz clic en cualquiera de las opciones rápidas de arriba para agregarlos con sus compras exactas calculadas.
          </div>
        )}

        {/* Formulario para añadir bebestible personalizado */}
        <form onSubmit={handleAddCustomBeb} className="p-3 bg-purple-50/40 border border-purple-200/80 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-purple-950 block">
            + Añadir Otro Bebestible o Barra Personalizada por Persona (p.p.)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={nuevoBebNombre}
                onChange={(e) => setNuevoBebNombre(e.target.value)}
                placeholder="Nombre del líquido (ej: Mojito Cubano, Pisco Sour, Agua Mineral...)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                step="any"
                value={nuevoBebRatio}
                onChange={(e) => setNuevoBebRatio(e.target.value)}
                placeholder="Ratio pp (ej: 2)"
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                title="Cantidad por comensal (admite enteros y decimales)"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={nuevoBebUnidad}
                onChange={(e) => setNuevoBebUnidad(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
              >
                <option value="lata / vaso">lata / vaso</option>
                <option value="copa">copa</option>
                <option value="botella">botella</option>
                <option value="vaso">vaso</option>
                <option value="taza">taza</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                step="any"
                value={nuevoBebCosto}
                onChange={(e) => setNuevoBebCosto(e.target.value)}
                placeholder="Costo unit."
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:outline-hidden tabular-nums"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-2xs h-[34px]"
                title="Agregar bebestible"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal para Crear Nuevo Menú directamente desde el Módulo 1 */}
      {onAddMenu && (
        <ModalCrearMenu
          isOpen={modalNuevoMenuOpen}
          onClose={() => setModalNuevoMenuOpen(false)}
          onGuardarMenu={(nuevoMenu) => {
            onAddMenu(nuevoMenu);
            onSelectMenu(nuevoMenu.id);
            setMenuExpandido(nuevoMenu.id);
          }}
          recetasDisponibles={recetas}
          insumosDisponibles={insumos}
          invitadosReferencia={invitados}
        />
      )}
    </div>
  );
};


