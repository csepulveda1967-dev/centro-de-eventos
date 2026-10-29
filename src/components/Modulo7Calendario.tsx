import React, { useState } from 'react';
import { ReservaCalendario, CotizacionState } from '../types';
import { formatMoneda, formatFechaEsp } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Lock,
  Tag,
  Phone,
  Mail,
  DollarSign,
  Utensils
} from 'lucide-react';

interface Modulo7CalendarioProps {
  reservas: ReservaCalendario[];
  onCargarCotizacion: (snapshot: CotizacionState) => void;
  onCrearReservaDesdeActual: (fecha: string, estado: 'confirmado' | 'cotizado' | 'bloqueado') => void;
  cotizacionActual: CotizacionState;
}

export const Modulo7Calendario: React.FC<Modulo7CalendarioProps> = ({
  reservas,
  onCargarCotizacion,
  onCrearReservaDesdeActual,
  cotizacionActual
}) => {
  // Mes y año actual visualizado (ej. Octubre / Noviembre 2026)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // Octubre 2026
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaCalendario | null>(reservas[0] || null);
  const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const anio = currentDate.getFullYear();
  const mes = currentDate.getMonth(); // 0-11

  // Nombres de meses en español
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Navegación de mes
  const irMesAnterior = () => {
    setCurrentDate(new Date(anio, mes - 1, 1));
  };

  const irMesSiguiente = () => {
    setCurrentDate(new Date(anio, mes + 1, 1));
  };

  // Cálculo de los días del mes para el grid
  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // Lunes = 0
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasEnMesAnterior = new Date(anio, mes, 0).getDate();

  // Matriz de días
  const celdasDias: Array<{ dia: number; esMesActual: boolean; fechaStr: string }> = [];

  // Días del mes anterior
  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const diaNum = diasEnMesAnterior - i;
    const mesAnt = mes === 0 ? 12 : mes;
    const anioAnt = mes === 0 ? anio - 1 : anio;
    const fechaStr = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
    celdasDias.push({ dia: diaNum, esMesActual: false, fechaStr });
  }

  // Días del mes actual
  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdasDias.push({ dia: d, esMesActual: true, fechaStr });
  }

  // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
  const celdasRestantes = 42 - celdasDias.length;
  for (let d = 1; d <= celdasRestantes; d++) {
    const mesSig = mes === 11 ? 1 : mes + 2;
    const anioSig = mes === 11 ? anio + 1 : anio;
    const fechaStr = `${anioSig}-${String(mesSig).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdasDias.push({ dia: d, esMesActual: false, fechaStr });
  }

  // Filtrar reservas
  const reservasFiltradas = reservas.filter(r => {
    if (filtroEstado === 'todos') return true;
    return r.estado === filtroEstado;
  });

  // Estilos de badge según estado
  const getBadgeEstado = (estado: ReservaCalendario['estado']) => {
    switch (estado) {
      case 'confirmado':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          texto: 'Confirmado',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        };
      case 'cotizado':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          texto: 'Cotizado',
          icon: <Clock className="w-3 h-3 text-blue-600" />
        };
      case 'bloqueado':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-600',
          texto: 'Bloqueado',
          icon: <Lock className="w-3 h-3 text-amber-700" />
        };
      case 'completado':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
          texto: 'Realizado',
          icon: <CheckCircle2 className="w-3 h-3 text-slate-500" />
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest block">
              Módulo 07 · Planificación
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            Calendario Mensual de Reservas & Ocupación
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Haz clic en cualquier evento para inspeccionarlo o cargarlo directamente en el cotizador dinámico.
          </p>
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({reservas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('confirmado')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === 'confirmado' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmados
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('cotizado')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === 'cotizado' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cotizados
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('bloqueado')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === 'bloqueado' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bloqueados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario Mensual (2 Columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Controles de Navegación del Mes */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {nombresMeses[mes]} {anio}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  ({reservasFiltradas.length} reservas registradas)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={irMesAnterior}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(2026, 9, 1))}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Oct 2026
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(2026, 10, 1))}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Nov 2026
                </button>
                <button
                  type="button"
                  onClick={irMesSiguiente}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mt-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
              {diasSemana.map((d, i) => (
                <div key={i} className={i >= 5 ? 'text-amber-700 font-extrabold' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de Celdas de Días */}
            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {celdasDias.map((celda, idx) => {
                const reservasDelDia = reservasFiltradas.filter(r => r.fecha === celda.fechaStr);
                const tieneReservas = reservasDelDia.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (tieneReservas) {
                        setReservaSeleccionada(reservasDelDia[0]);
                      } else {
                        setDiaSeleccionadoModal(celda.fechaStr);
                      }
                    }}
                    className={`min-h-[75px] sm:min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      celda.esMesActual
                        ? tieneReservas
                          ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-xs'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        : 'border-transparent bg-slate-50/40 text-slate-300'
                    }`}
                  >
                    {/* Número de día */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${
                        celda.esMesActual ? 'text-slate-800' : 'text-slate-300'
                      }`}>
                        {celda.dia}
                      </span>

                      {tieneReservas && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      )}
                    </div>

                    {/* Mini tarjetas de eventos en el día */}
                    <div className="space-y-1 mt-1">
                      {reservasDelDia.map(res => {
                        const b = getBadgeEstado(res.estado);
                        const isSelected = reservaSeleccionada?.id === res.id;

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setReservaSeleccionada(res);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold leading-tight truncate border shadow-2xs transition-transform hover:scale-102 ${
                              b.bg
                            } ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
                            title={`${res.titulo} (${b.texto}) - ${res.invitados} pax`}
                          >
                            <span className="truncate block">{res.titulo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda de Colores */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Estados de Reserva:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Confirmado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Cotizado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>Bloqueado</span>
              </span>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Ficha del Evento Seleccionado + Cargar en Cotizador */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          {reservaSeleccionada ? (
            <div>
              {/* Header de la Ficha */}
              <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const b = getBadgeEstado(reservaSeleccionada.estado);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${b.bg}`}>
                          {b.icon}
                          {b.texto}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-slate-400 font-medium">
                      {reservaSeleccionada.tipoEvento}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {reservaSeleccionada.titulo}
                  </h3>
                </div>
              </div>

              {/* Datos Clave */}
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    Fecha del Evento:
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatFechaEsp(reservaSeleccionada.fecha)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    Comensales:
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {reservaSeleccionada.invitados} personas
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Total Cotizado:
                  </span>
                  <span className="font-extrabold text-amber-900 tabular-nums text-sm">
                    {formatMoneda(reservaSeleccionada.montoTotal)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-700 block">Contacto del Cliente:</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{reservaSeleccionada.cliente}</span>
                  </div>
                  {reservaSeleccionada.cotizacionSnapshot?.telefonoCliente && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reservaSeleccionada.cotizacionSnapshot.telefonoCliente}</span>
                    </div>
                  )}
                  {reservaSeleccionada.cotizacionSnapshot?.emailCliente && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reservaSeleccionada.cotizacionSnapshot.emailCliente}</span>
                    </div>
                  )}
                </div>

                {reservaSeleccionada.cotizacionSnapshot?.observaciones && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-lg text-amber-900">
                    <span className="font-bold block text-[11px] mb-0.5">Notas operativas:</span>
                    <p className="text-[11px] leading-relaxed">
                      {reservaSeleccionada.cotizacionSnapshot.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* CRITICAL USER REQUIREMENT: Cargar cotización específica en el cotizador */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onCargarCotizacion(reservaSeleccionada.cotizacionSnapshot)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all"
                >
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <span>Cargar Esta Cotización en el Cotizador</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Al pulsar aquí, todos los valores (menú, garzones, mesas y servicios) se volcarán al cotizador en vivo para editar o recalcular.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Selecciona un evento del calendario para ver sus detalles</p>
            </div>
          )}

          {/* Opción rápida: Vincular la cotización actual a una fecha */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 block mb-1">
              ¿Deseas agendar la cotización actual?
            </span>
            <p className="text-[11px] text-slate-500 mb-3">
              Guarda el evento de &ldquo;{cotizacionActual.cliente || 'Nuevo Cliente'}&rdquo; ({cotizacionActual.invitados} pax) en el calendario.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={cotizacionActual.fechaEvento || '2026-11-28'}
                id="input-fecha-reserva-rapida"
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('input-fecha-reserva-rapida') as HTMLInputElement;
                  if (input && input.value) {
                    onCrearReservaDesdeActual(input.value, 'cotizado');
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
