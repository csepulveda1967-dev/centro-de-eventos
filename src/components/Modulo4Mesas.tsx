import React, { useState } from 'react';
import { Mesa } from '../types';
import {
  LayoutGrid,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wand2,
  Edit2,
  Check,
  Armchair
} from 'lucide-react';

interface Modulo4MesasProps {
  mesas: Mesa[];
  onChangeMesas: (mesas: Mesa[]) => void;
  invitadosTotales: number;
}

export const Modulo4Mesas: React.FC<Modulo4MesasProps> = ({
  mesas,
  onChangeMesas,
  invitadosTotales
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNombre, setTempNombre] = useState<string>('');

  // Capacidad total de todas las mesas sumadas
  const capacidadTotalMesas = mesas.reduce((sum, m) => sum + m.capacidad, 0);
  const diferencia = capacidadTotalMesas - invitadosTotales;

  // Acciones sobre mesas
  const agregarMesa = (tipo: 'redonda' | 'imperial' | 'presidencial' | 'infantil', capacidad: number) => {
    const nuevoNumero = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1;
    let nombreSugerido = `Mesa ${nuevoNumero}`;
    if (tipo === 'presidencial') nombreSugerido = `Mesa Presidencial ${nuevoNumero}`;
    if (tipo === 'imperial') nombreSugerido = `Mesa Imperial ${nuevoNumero}`;
    if (tipo === 'infantil') nombreSugerido = `Mesa Niños ${nuevoNumero}`;

    const nuevaMesa: Mesa = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      numero: nuevoNumero,
      nombre: nombreSugerido,
      capacidad,
      tipo,
      zona: 'Salón Principal'
    };

    onChangeMesas([...mesas, nuevaMesa]);
  };

  const eliminarMesa = (id: string) => {
    onChangeMesas(mesas.filter(m => m.id !== id));
  };

  const cambiarCapacidadMesa = (id: string, delta: number) => {
    onChangeMesas(
      mesas.map(m => {
        if (m.id !== id) return m;
        const nuevaCapacidad = Math.max(2, Math.min(20, m.capacidad + delta));
        return { ...m, capacidad: nuevaCapacidad };
      })
    );
  };

  const iniciarEdicion = (m: Mesa) => {
    setEditingId(m.id);
    setTempNombre(m.nombre);
  };

  const guardarEdicion = (id: string) => {
    if (tempNombre.trim()) {
      onChangeMesas(
        mesas.map(m => (m.id === id ? { ...m, nombre: tempNombre.trim() } : m))
      );
    }
    setEditingId(null);
  };

  // Auto-completar mesas faltantes
  const autoCompletarMesasFaltantes = () => {
    const faltantes = invitadosTotales - capacidadTotalMesas;
    if (faltantes <= 0) return;

    const nuevas: Mesa[] = [];
    let pendientes = faltantes;
    let ultimoNum = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) : 0;

    while (pendientes > 0) {
      ultimoNum++;
      const cap = pendientes >= 10 ? 10 : (pendientes >= 8 ? 8 : pendientes);
      nuevas.push({
        id: 'm-auto-' + Date.now() + '-' + ultimoNum,
        numero: ultimoNum,
        nombre: `Mesa ${ultimoNum}`,
        capacidad: cap,
        tipo: 'redonda',
        zona: 'Salón Principal'
      });
      pendientes -= cap;
    }

    onChangeMesas([...mesas, ...nuevas]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            04
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-emerald-600" />
              Esquema de Mesas & Distribución de Salón
            </h2>
            <p className="text-xs text-slate-500">
              Configura las mesas del evento y verifica que todos los comensales tengan puesto asignado.
            </p>
          </div>
        </div>

        {/* Resumen de puestos */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Cotizados Módulo 1</span>
            <span className="text-sm font-extrabold text-slate-800 tabular-nums">{invitadosTotales}</span>
          </div>
          <div className="text-slate-300 font-bold">/</div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-emerald-700 block font-medium">Capacidad en Mesas</span>
            <span className="text-sm font-extrabold text-emerald-950 tabular-nums">{capacidadTotalMesas}</span>
          </div>
        </div>
      </div>

      {/* CRITICAL REQUIREMENT: AVISO VISUAL DE ALERTA DE MESAS */}
      <div className="my-5">
        {diferencia < 0 ? (
          /* Alerta: Faltan puestos */
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  ¡Atención! Faltan mesas por distribuir en el salón
                </h3>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  Has configurado <strong>{invitadosTotales} invitados</strong> en el Módulo 1, pero tus mesas actuales solo tienen capacidad para <strong>{capacidadTotalMesas} personas</strong>.
                  <span className="block font-semibold mt-1 text-amber-950">
                    Faltan por ubicar: {Math.abs(diferencia)} comensales.
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={autoCompletarMesasFaltantes}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 active:scale-95 rounded-lg shadow-xs transition-all shrink-0 self-start md:self-center"
            >
              <Wand2 className="w-4 h-4" />
              Auto-añadir {Math.abs(diferencia)} puestos faltantes
            </button>
          </div>
        ) : diferencia === 0 ? (
          /* Alerta: Distribución Perfecta */
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold">¡Distribución Perfecta!</span> La capacidad de las mesas ({capacidadTotalMesas} puestos) coincide exactamente con los {invitadosTotales} invitados cotizados.
            </div>
          </div>
        ) : (
          /* Alerta: Capacidad holgada / puestos libres */
          <div className="p-3.5 bg-sky-50 border border-sky-300 rounded-xl flex items-center gap-3 shadow-xs">
            <Info className="w-5 h-5 text-sky-700 shrink-0" />
            <div className="text-xs text-sky-950">
              <span className="font-bold">Capacidad holgada:</span> Tienes {capacidadTotalMesas} asientos en mesas para {invitadosTotales} invitados (+{diferencia} asientos libres para imprevistos o fotógrafos).
            </div>
          </div>
        )}
      </div>

      {/* Botones de Acción Rápida para Añadir Mesas */}
      <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
        <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Añadir Mesas al Salón:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => agregarMesa('redonda', 10)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            + Mesa Redonda (10 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('imperial', 12)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            + Mesa Imperial (12 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('presidencial', 8)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            + Mesa Presidencial / Novios (8 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('infantil', 6)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            + Mesa Niños (6 pax)
          </button>
        </div>
      </div>

      {/* Grid de Mesas Existentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span>Mesas del Salón ({mesas.length} mesas configuradas)</span>
          {mesas.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeMesas([])}
              className="text-[11px] font-normal text-slate-400 hover:text-rose-600 underline"
            >
              Limpiar todas las mesas
            </button>
          )}
        </div>

        {mesas.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Armchair className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No hay mesas configuradas aún</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Usa los botones superiores para añadir mesas redondas, imperiales o la mesa de honor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {mesas.map((m) => {
              const isEditing = editingId === m.id;

              return (
                <div
                  key={m.id}
                  className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-slate-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
                >
                  <div>
                    {/* Header de la mesa */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{m.numero}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempNombre}
                              onChange={(e) => setTempNombre(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(m.id)}
                              className="text-xs font-bold text-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => guardarEdicion(m.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 line-clamp-1">
                              {m.nombre}
                            </span>
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(m)}
                              className="text-slate-400 hover:text-slate-600"
                              title="Editar nombre"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarMesa(m.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Representación visual de sillas */}
                    <div className="mt-3 flex items-center justify-center py-2 bg-slate-50 rounded-lg">
                      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[150px]">
                        {Array.from({ length: m.capacidad }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-emerald-600/80"
                            title={`Puesto ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Controles de Capacidad */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Capacidad:</span>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-md">
                      <button
                        type="button"
                        onClick={() => cambiarCapacidadMesa(m.id, -1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900 tabular-nums text-xs">
                        {m.capacidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCapacidadMesa(m.id, 1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
