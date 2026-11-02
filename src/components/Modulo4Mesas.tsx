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
  Armchair,
  Sparkles,
  Users
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
  const [formatoSugerido, setFormatoSugerido] = useState<'10' | '8' | '12' | 'presidencial_10'>('10');

  // Capacidad total de todas las mesas sumadas
  const capacidadTotalMesas = mesas.reduce((sum, m) => sum + m.capacidad, 0);
  const diferencia = capacidadTotalMesas - invitadosTotales;

  // Cálculo de estimación sugerida según formato
  const calcularMesasSugeridas = (formato: '10' | '8' | '12' | 'presidencial_10') => {
    const total = Math.max(1, invitadosTotales);
    if (formato === '10') {
      return Math.ceil(total / 10);
    }
    if (formato === '8') {
      return Math.ceil(total / 8);
    }
    if (formato === '12') {
      return Math.ceil(total / 12);
    }
    if (formato === 'presidencial_10') {
      const restantes = Math.max(0, total - 6);
      return 1 + Math.ceil(restantes / 10);
    }
    return Math.ceil(total / 10);
  };

  const cantidadSugerida = calcularMesasSugeridas(formatoSugerido);

  // Aplicar estimación sugerida en 1 clic
  const aplicarEstimacionSugerida = () => {
    const total = Math.max(1, invitadosTotales);
    const nuevas: Mesa[] = [];

    if (formatoSugerido === 'presidencial_10') {
      // 1 Mesa Presidencial de 6 puestos
      nuevas.push({
        id: 'm-pres-' + Date.now(),
        numero: 1,
        nombre: 'Mesa Presidencial (Honor)',
        capacidad: Math.min(6, total),
        tipo: 'presidencial',
        zona: 'Cabecera Salón'
      });

      let pendientes = Math.max(0, total - 6);
      let num = 2;
      while (pendientes > 0) {
        const cap = pendientes >= 10 ? 10 : (pendientes >= 8 ? 8 : pendientes);
        nuevas.push({
          id: 'm-sug-' + Date.now() + '-' + num,
          numero: num,
          nombre: `Mesa ${num}`,
          capacidad: cap,
          tipo: 'redonda',
          zona: 'Salón Principal'
        });
        pendientes -= cap;
        num++;
      }
    } else {
      const capPorMesa = formatoSugerido === '10' ? 10 : (formatoSugerido === '8' ? 8 : 12);
      let pendientes = total;
      let num = 1;

      while (pendientes > 0) {
        const cap = pendientes >= capPorMesa ? capPorMesa : (pendientes >= (capPorMesa - 2) ? capPorMesa : pendientes);
        nuevas.push({
          id: 'm-sug-' + Date.now() + '-' + num,
          numero: num,
          nombre: `Mesa ${num}`,
          capacidad: cap,
          tipo: formatoSugerido === '12' ? 'imperial' : 'redonda',
          zona: 'Salón Principal'
        });
        pendientes -= cap;
        num++;
      }
    }

    onChangeMesas(nuevas);
  };

  // Acciones individuales sobre mesas
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
              Estimación sugerida automática basada en tus {invitadosTotales} invitados confirmados.
            </p>
          </div>
        </div>

        {/* Resumen de puestos */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Pax Confirmados</span>
            <span className="text-sm font-extrabold text-slate-800 tabular-nums">{invitadosTotales}</span>
          </div>
          <div className="text-slate-300 font-bold">/</div>
          <div className={`rounded-xl px-3 py-1.5 text-center border ${
            diferencia === 0
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : diferencia < 0
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-sky-50 border-sky-300 text-sky-950'
          }`}>
            <span className="text-[10px] block font-medium">Asientos en Mesas</span>
            <span className="text-sm font-extrabold tabular-nums">{capacidadTotalMesas}</span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN CLAVE: ESTIMACIÓN SUGERIDA DE MESAS PARA EL EMPRENDEDOR ── */}
      <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Estimación Sugerida por la Plataforma</span>
            </div>
            <p className="text-xs text-slate-700">
              Para albergar con confort a tus <strong>{invitadosTotales} comensales</strong>, se sugiere una distribución de{' '}
              <strong className="text-emerald-900 font-extrabold underline">{cantidadSugerida} mesas</strong>.
            </p>

            {/* Selector de formato sugerido */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] text-slate-500 font-medium">Formato:</span>
              <button
                type="button"
                onClick={() => setFormatoSugerido('10')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  formatoSugerido === '10'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mesas de 10 Pax (Estándar Banquetería)
              </button>
              <button
                type="button"
                onClick={() => setFormatoSugerido('8')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  formatoSugerido === '8'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mesas de 8 Pax (Espacioso)
              </button>
              <button
                type="button"
                onClick={() => setFormatoSugerido('12')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  formatoSugerido === '12'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mesas de 12 Pax (Imperial)
              </button>
              <button
                type="button"
                onClick={() => setFormatoSugerido('presidencial_10')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  formatoSugerido === 'presidencial_10'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                1 Presidencial + Mesas de 10
              </button>
            </div>
          </div>

          {/* Botón 1 Clic para Aplicar la Estimación Sugerida */}
          <button
            type="button"
            onClick={aplicarEstimacionSugerida}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>🪄 Aplicar Estimación Sugerida ({cantidadSugerida} mesas)</span>
          </button>
        </div>
      </div>

      {/* ESTADO DE BALANCE DE SILLAS */}
      <div className="mb-5">
        {diferencia < 0 ? (
          /* Alerta: Faltan puestos */
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <span className="font-bold">Faltan puestos en el salón:</span> Hay {capacidadTotalMesas} sillas para {invitadosTotales} invitados confirmados.
                <span className="font-semibold text-amber-900 ml-1">
                  (Faltan {Math.abs(diferencia)} puestos).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={autoCompletarMesasFaltantes}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 active:scale-95 rounded-lg shadow-2xs transition-all shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Completar {Math.abs(diferencia)} asientos faltantes
            </button>
          </div>
        ) : diferencia === 0 ? (
          /* Alerta: Distribución Perfecta */
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-xs text-emerald-950">
              <span className="font-bold">¡Distribución Exacta!</span> La capacidad en mesas ({capacidadTotalMesas} puestos) cubre el 100% de los {invitadosTotales} invitados confirmados.
            </div>
          </div>
        ) : (
          /* Alerta: Capacidad holgada / puestos libres */
          <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <Info className="w-4 h-4 text-sky-700 shrink-0" />
            <div className="text-xs text-sky-950">
              <span className="font-bold">Capacidad con holgura:</span> Tienes {capacidadTotalMesas} asientos para {invitadosTotales} comensales (+{diferencia} asientos libres para staff o imprevistos).
            </div>
          </div>
        )}
      </div>

      {/* Botones Manuales para Añadir Mesas Específicas */}
      <div className="mb-5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Añadir Mesas Extras Manualmente:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => agregarMesa('redonda', 10)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            + Mesa Redonda (10 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('imperial', 12)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            + Mesa Imperial (12 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('presidencial', 8)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            + Mesa Presidencial (8 pax)
          </button>

          <button
            type="button"
            onClick={() => agregarMesa('infantil', 6)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs cursor-pointer"
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
              className="text-[11px] font-normal text-slate-400 hover:text-rose-600 underline cursor-pointer"
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
              Haz clic en "Aplicar Estimación Sugerida" arriba para crear la distribución de forma instantánea.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {mesas.map((m) => {
              const isEditing = editingId === m.id;

              return (
                <div
                  key={m.id}
                  className="border border-slate-200 rounded-xl p-3 bg-white hover:border-slate-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
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
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Editar nombre de la mesa"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarMesa(m.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Representación visual de sillas */}
                    <div className="mt-2.5 flex items-center justify-center py-2 bg-slate-50 rounded-lg">
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
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Capacidad:</span>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-md">
                      <button
                        type="button"
                        onClick={() => cambiarCapacidadMesa(m.id, -1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900 tabular-nums text-xs">
                        {m.capacidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCapacidadMesa(m.id, 1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
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
