import React, { useState } from 'react';
import { ResumenFinanciero, ItemGastoFijo, RegistroCostoFijoMensual } from '../types';
import { formatMoneda, formatPorcentaje } from '../utils/formatters';
import {
  TrendingUp,
  Percent,
  CalendarPlus,
  Printer,
  Utensils,
  Users2,
  Truck,
  Palette,
  DollarSign,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  Building2,
  Zap,
  Flame,
  Plus,
  Trash2,
  HelpCircle,
  Sliders,
  CheckCircle2,
  Sparkles,
  Calculator,
  UserCheck,
  Calendar,
  Save,
  Clock,
  Copy
} from 'lucide-react';

interface Modulo6DashboardCostosProps {
  resumen: ResumenFinanciero;
  invitados: number;
  margenGanancia: number;
  onChangeMargen: (margen: number) => void;
  aplicaIva: boolean;
  onToggleIva: (aplica: boolean) => void;
  onGuardarEnCalendario: () => void;
  onAbrirFichaCliente: () => void;
  onAbrirWhatsAppPropuesta?: () => void;
  porcentajeAnticipo?: number;
  onChangeAnticipo?: (pct: number) => void;
  esquemaPago?: 'un_pago' | 'dos_pagos' | 'tres_pagos' | 'cuatro_pagos' | 'corporativo' | 'personalizado' | (string & {});
  onChangeEsquemaPago?: (esquema: 'un_pago' | 'dos_pagos' | 'tres_pagos' | 'cuatro_pagos' | 'corporativo' | 'personalizado' | string) => void;
  hito2Porcentaje?: number;
  onChangeHito2Porcentaje?: (pct: number) => void;
  hito3Porcentaje?: number;
  onChangeHito3Porcentaje?: (pct: number) => void;
  condicionesPagoPersonalizadas?: string;
  onChangeCondicionesPagoPersonalizadas?: (texto: string) => void;
  diasSaldo?: number;
  onChangeDiasSaldo?: (dias: number) => void;
  diasConfirmacionComensales?: number;
  onChangeDiasConfirmacion?: (dias: number) => void;
  validezDias?: number;
  onChangeValidezDias?: (dias: number) => void;
  metodoPago?: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque' | 'otro';
  onChangeMetodoPago?: (metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque' | 'otro') => void;
  detalleMetodoPago?: string;
  onChangeDetalleMetodoPago?: (texto: string) => void;
  mostrarCondicionesPago?: boolean;
  onToggleMostrarCondiciones?: (mostrar: boolean) => void;
  modoCondicionesPago?: 'manual' | 'auto';
  onChangeModoCondiciones?: (modo: 'manual' | 'auto') => void;
  // Campos básicos de luz & gas y otros gastos fijos a mano
  gastoLuzMensual?: number;
  onChangeGastoLuz?: (luz: number) => void;
  gastoGasMensual?: number;
  onChangeGastoGas?: (gas: number) => void;
  otrosGastosFijos?: ItemGastoFijo[];
  onAddOtroGastoFijo?: (nombre: string, monto: number) => void;
  onUpdateOtroGastoFijo?: (id: string, nombre: string, monto: number) => void;
  onRemoveOtroGastoFijo?: (id: string) => void;
  eventosAlMes?: number;
  onChangeEventosAlMes?: (cant: number) => void;
  // Historial y guardado mensual (variación mes a mes)
  mesActivoCostosFijos?: string;
  onChangeMesActivo?: (mes: string) => void;
  historialCostosFijosMensuales?: Record<string, RegistroCostoFijoMensual>;
  onGuardarMesCostosFijos?: (registro: RegistroCostoFijoMensual) => void;
  onCargarMesCostosFijos?: (registro: RegistroCostoFijoMensual) => void;
  // Criterio libre del emprendedor
  usarPrecioManual?: boolean;
  onToggleUsarPrecioManual?: (usar: boolean) => void;
  precioVentaManual?: number;
  onChangePrecioManual?: (precio: number) => void;
}

export const Modulo6DashboardCostos: React.FC<Modulo6DashboardCostosProps> = ({
  resumen,
  invitados,
  margenGanancia,
  onChangeMargen,
  aplicaIva,
  onToggleIva,
  onGuardarEnCalendario,
  onAbrirFichaCliente,
  onAbrirWhatsAppPropuesta,
  porcentajeAnticipo = 40,
  onChangeAnticipo,
  esquemaPago = 'dos_pagos',
  onChangeEsquemaPago,
  hito2Porcentaje = 30,
  onChangeHito2Porcentaje,
  hito3Porcentaje = 20,
  onChangeHito3Porcentaje,
  condicionesPagoPersonalizadas = '',
  onChangeCondicionesPagoPersonalizadas,
  diasSaldo = 7,
  onChangeDiasSaldo,
  diasConfirmacionComensales = 10,
  onChangeDiasConfirmacion,
  validezDias = 15,
  onChangeValidezDias,
  metodoPago = 'transferencia',
  onChangeMetodoPago,
  detalleMetodoPago = '',
  onChangeDetalleMetodoPago,
  mostrarCondicionesPago = false,
  onToggleMostrarCondiciones,
  modoCondicionesPago = 'manual',
  onChangeModoCondiciones,
  gastoLuzMensual = 0,
  onChangeGastoLuz,
  gastoGasMensual = 0,
  onChangeGastoGas,
  otrosGastosFijos = [],
  onAddOtroGastoFijo,
  onUpdateOtroGastoFijo,
  onRemoveOtroGastoFijo,
  eventosAlMes = 4,
  onChangeEventosAlMes,
  mesActivoCostosFijos = 'Noviembre 2024',
  onChangeMesActivo,
  historialCostosFijosMensuales = {},
  onGuardarMesCostosFijos,
  onCargarMesCostosFijos,
  usarPrecioManual = false,
  onToggleUsarPrecioManual,
  precioVentaManual = 0,
  onChangePrecioManual
}) => {
  const {
    costoMenu,
    costoPersonal,
    costoProveedores,
    costoDecoracion,
    costosFijosEvento = 0,
    costoFijoPorPersona = 0,
    gastosFijosMensuales = 0,
    costoVariablesTotal = (costoMenu + costoPersonal + costoProveedores + costoDecoracion),
    costoTotalReal,
    costoPorInvitado,
    utilidadProyectada,
    precioVentaNeto,
    ivaMonto,
    precioVentaTotal,
    precioVentaPorInvitado,
    precioCobradoFinal,
    margenRealObtenido,
    utilidadRealObtenida
  } = resumen;

  // Formulario local para añadir nuevos costos a mano
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nombreNuevoGasto, setNombreNuevoGasto] = useState('');
  const [montoNuevoGasto, setMontoNuevoGasto] = useState<number | ''>('');

  // Nombres de meses para el gestor de facturas mensuales
  const MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Mes y Año seleccionado para registrar facturas
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(10); // Noviembre (0-indexed = 10)
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(2024);
  const [toastGuardadoMes, setToastGuardadoMes] = useState<string | null>(null);

  const keyMesActual = `${añoSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
  const mesNombreCompleto = `${MESES_NOMBRES[mesSeleccionado]} ${añoSeleccionado}`;
  const registroGuardadoEsteMes = historialCostosFijosMensuales[keyMesActual];

  // Mes previo para opción "Copiar mes anterior"
  const mesPrevioIndex = mesSeleccionado === 0 ? 11 : mesSeleccionado - 1;
  const añoPrevio = mesSeleccionado === 0 ? añoSeleccionado - 1 : añoSeleccionado;
  const keyMesPrevio = `${añoPrevio}-${String(mesPrevioIndex + 1).padStart(2, '0')}`;
  const registroMesPrevio = historialCostosFijosMensuales[keyMesPrevio];

  const handleCambiarMes = (nuevoMesIndex: number, nuevoAño: number) => {
    setMesSeleccionado(nuevoMesIndex);
    setAñoSeleccionado(nuevoAño);
    const key = `${nuevoAño}-${String(nuevoMesIndex + 1).padStart(2, '0')}`;
    const existente = historialCostosFijosMensuales[key];
    if (existente) {
      onCargarMesCostosFijos?.(existente);
      setToastGuardadoMes(`✓ Facturas de ${existente.mesNombre} cargadas`);
      setTimeout(() => setToastGuardadoMes(null), 3000);
    }
  };

  const handleGuardarMesActual = () => {
    const registro: RegistroCostoFijoMensual = {
      id: keyMesActual,
      mesNombre: mesNombreCompleto,
      mesIndex: mesSeleccionado,
      año: añoSeleccionado,
      gastoLuz: gastoLuzMensual,
      gastoGas: gastoGasMensual,
      otrosGastos: [...otrosGastosFijos],
      eventosAlMes: eventosAlMes,
      fechaGuardado: new Date().toLocaleDateString('es-CL')
    };

    onGuardarMesCostosFijos?.(registro);
    setToastGuardadoMes(`✓ Facturas de ${mesNombreCompleto} guardadas`);
    setTimeout(() => setToastGuardadoMes(null), 3500);
  };

  const handleCargarRegistroMes = (reg: RegistroCostoFijoMensual) => {
    setMesSeleccionado(reg.mesIndex);
    setAñoSeleccionado(reg.año);
    onCargarMesCostosFijos?.(reg);
    setToastGuardadoMes(`✓ ${reg.mesNombre} activo en el simulador`);
    setTimeout(() => setToastGuardadoMes(null), 3000);
  };

  const handleCopiarMesAnterior = () => {
    if (!registroMesPrevio) return;
    onChangeGastoLuz?.(registroMesPrevio.gastoLuz);
    onChangeGastoGas?.(registroMesPrevio.gastoGas);
    if (registroMesPrevio.eventosAlMes) {
      onChangeEventosAlMes?.(registroMesPrevio.eventosAlMes);
    }
    setToastGuardadoMes(`✓ Valores base copiados de ${registroMesPrevio.mesNombre}`);
    setTimeout(() => setToastGuardadoMes(null), 3000);
  };

  const handleAgregarNuevoGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoGasto.trim()) return;
    onAddOtroGastoFijo?.(nombreNuevoGasto.trim(), Number(montoNuevoGasto) || 0);
    setNombreNuevoGasto('');
    setMontoNuevoGasto('');
    setMostrarFormNuevo(false);
  };

  // Porcentajes para la barra de distribución compuesta
  const pctMenu = costoTotalReal > 0 ? (costoMenu / costoTotalReal) * 100 : 0;
  const pctPersonal = costoTotalReal > 0 ? (costoPersonal / costoTotalReal) * 100 : 0;
  const pctProveedores = costoTotalReal > 0 ? (costoProveedores / costoTotalReal) * 100 : 0;
  const pctDecoracion = costoTotalReal > 0 ? (costoDecoracion / costoTotalReal) * 100 : 0;
  const pctCostosFijos = costoTotalReal > 0 ? (costosFijosEvento / costoTotalReal) * 100 : 0;

  const presetsMargen = [20, 25, 30, 35, 40, 45, 50];
  const presetsEventos = [2, 4, 8, 12, 16, 20, 24, 30];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm lg:sticky lg:top-20 transition-all space-y-5">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">
            Módulo 06 · En Vivo
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Dashboard de Costos Reales
          </h2>
        </div>
        <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold">
          Cálculo Reactivo
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          1. COSTOS FIJOS OPERACIONALES: SIMPLE PARA PEQUEÑOS EMPRENDEDORES
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              Costos Fijos Operacionales
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Prorrateo simple para emprendedores (Luz, Gas y otros)
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full tabular-nums">
            Total {formatMoneda(gastosFijosMensuales)}/mes
          </span>
        </div>

        {/* Notificación temporal de guardado de mes */}
        {toastGuardadoMes && (
          <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastGuardadoMes}</span>
          </div>
        )}

        {/* ── BARRA DE GESTIÓN MENSUAL: Permite variar Luz/Gas mes a mes y guardar cada mes ── */}
        <div className="bg-white p-2.5 rounded-lg border border-teal-200/90 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Mes de Facturación:
              </span>
              <select
                value={mesSeleccionado}
                onChange={(e) => handleCambiarMes(Number(e.target.value), añoSeleccionado)}
                className="px-2 py-0.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-md focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                {MESES_NOMBRES.map((mes, idx) => (
                  <option key={mes} value={idx}>
                    {mes}
                  </option>
                ))}
              </select>
              <select
                value={añoSeleccionado}
                onChange={(e) => handleCambiarMes(mesSeleccionado, Number(e.target.value))}
                className="px-2 py-0.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-md focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGuardarMesActual}
              className="px-2.5 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-md flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              title={`Guardar facturas para ${MESES_NOMBRES[mesSeleccionado]} ${añoSeleccionado}`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar {MESES_NOMBRES[mesSeleccionado]}</span>
            </button>
          </div>

          {/* Subtítulo de estado del mes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 gap-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {registroGuardadoEsteMes ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ Facturas guardadas para {mesNombreCompleto} (Luz: {formatMoneda(registroGuardadoEsteMes.gastoLuz)} · Gas: {formatMoneda(registroGuardadoEsteMes.gastoGas)})
                </span>
              ) : (
                <span className="text-amber-800 font-medium">
                  Modificando cuentas de {mesNombreCompleto}. Haz clic en "Guardar {MESES_NOMBRES[mesSeleccionado]}" para conservar el mes.
                </span>
              )}
            </span>

            {registroMesPrevio && (
              <button
                type="button"
                onClick={handleCopiarMesAnterior}
                className="text-[10px] text-teal-700 hover:underline font-semibold flex items-center gap-0.5 self-start sm:self-auto cursor-pointer"
                title={`Copiar valores desde ${registroMesPrevio.mesNombre}`}
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Copiar {registroMesPrevio.mesNombre}</span>
              </button>
            )}
          </div>

          {/* Historial rápido de meses guardados con 1 clic */}
          {Object.keys(historialCostosFijosMensuales).length > 0 && (
            <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-slate-400 uppercase font-bold mr-1">Meses Guardados:</span>
              {Object.values(historialCostosFijosMensuales).map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => handleCargarRegistroMes(reg)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border cursor-pointer ${
                    reg.mesIndex === mesSeleccionado && reg.año === añoSeleccionado
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`Cargar cuentas de ${reg.mesNombre}`}
                >
                  {reg.mesNombre.split(' ')[0]} ({formatMoneda(reg.gastoLuz + reg.gastoGas + reg.otrosGastos.reduce((s,o)=>s+o.monto,0))})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2 Campos Básicos Cotidianos: Luz y Gas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Campo Básico 1: Luz */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Luz ($ mensual)
              </label>
              {gastoLuzMensual > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeGastoLuz?.(0)}
                  className="text-[9px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                  title="Volver celda de luz a 0"
                >
                  Volver a $0
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                type="number"
                min={0}
                step={10000}
                value={gastoLuzMensual === 0 ? '' : gastoLuzMensual}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  onChangeGastoLuz?.(isNaN(val) ? 0 : Math.max(0, val));
                }}
                onBlur={() => {
                  if (gastoLuzMensual === 0 || isNaN(gastoLuzMensual)) {
                    onChangeGastoLuz?.(0);
                  }
                }}
                placeholder="0"
                className="w-full pl-6 pr-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 tabular-nums"
              />
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Electricidad del recinto</span>
          </div>

          {/* Campo Básico 2: Gas */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Gas ($ mensual)
              </label>
              {gastoGasMensual > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeGastoGas?.(0)}
                  className="text-[9px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                  title="Volver celda de gas a 0"
                >
                  Volver a $0
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                type="number"
                min={0}
                step={10000}
                value={gastoGasMensual === 0 ? '' : gastoGasMensual}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  onChangeGastoGas?.(isNaN(val) ? 0 : Math.max(0, val));
                }}
                onBlur={() => {
                  if (gastoGasMensual === 0 || isNaN(gastoGasMensual)) {
                    onChangeGastoGas?.(0);
                  }
                }}
                placeholder="0"
                className="w-full pl-6 pr-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 tabular-nums"
              />
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Balones / gas cocina</span>
          </div>
        </div>

        {/* Costos Adicionales del Mes (Añadir a mano y anotar datos directamente) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Otros Costos del Mes {otrosGastosFijos.length > 0 ? `(${otrosGastosFijos.length})` : ''}
              </span>
              <span className="text-[9px] text-slate-500">
                Anota gastos adicionales del mes (arriendos, fletes, patentes, etc.)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {gastosFijosMensuales > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeGastoLuz?.(0);
                    onChangeGastoGas?.(0);
                    otrosGastosFijos.forEach(gf => onUpdateOtroGastoFijo?.(gf.id, gf.nombre, 0));
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                  title="Volver todas las celdas de costos a $0"
                >
                  Volver todas a $0
                </button>
              )}
              <button
                type="button"
                onClick={() => setMostrarFormNuevo(true)}
                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Añadir Costo del Mes</span>
              </button>
            </div>
          </div>

          {/* Formulario rápido para nuevo costo */}
          {mostrarFormNuevo && (
            <form onSubmit={handleAgregarNuevoGasto} className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 space-y-2 mb-2">
              <span className="text-[10px] font-bold text-teal-900 block">
                Ingresar Nuevo Costo del Mes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={nombreNuevoGasto}
                  onChange={(e) => setNombreNuevoGasto(e.target.value)}
                  placeholder="Concepto (ej: Fletes, Arriendo taller...)"
                  className="px-2.5 py-1 text-xs font-medium text-slate-900 bg-white border border-teal-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={montoNuevoGasto}
                  onChange={(e) => setMontoNuevoGasto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Monto $ mensual"
                  className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-teal-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-teal-500 tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setMostrarFormNuevo(false)}
                  className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-[10px] font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs cursor-pointer"
                >
                  Guardar Costo
                </button>
              </div>
            </form>
          )}

          {/* Lista de gastos del mes con inputs interactivos para anotar datos */}
          {otrosGastosFijos.length === 0 ? (
            <div className="py-3 px-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block">
                Sin costos fijos adicionales este mes.
              </span>
              <span className="text-[10px] text-slate-400">
                Haz clic en <strong>+ Añadir Costo del Mes</strong> para anotar gastos si los tienes.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {otrosGastosFijos.map((gf) => (
                <div key={gf.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <input
                    type="text"
                    value={gf.nombre}
                    onChange={(e) => onUpdateOtroGastoFijo?.(gf.id, e.target.value, gf.monto)}
                    placeholder="Concepto (ej: Fletes, Bodega...)"
                    className="flex-1 min-w-0 px-2 py-1 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={gf.monto === 0 ? '' : gf.monto}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => onUpdateOtroGastoFijo?.(gf.id, gf.nombre, e.target.value === '' ? 0 : Number(e.target.value))}
                      onBlur={() => {
                        if (gf.monto === 0 || isNaN(gf.monto)) {
                          onUpdateOtroGastoFijo?.(gf.id, gf.nombre, 0);
                        }
                      }}
                      placeholder="0"
                      className="w-full pl-5 pr-2 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 tabular-nums text-right"
                    />
                  </div>
                  {gf.monto > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateOtroGastoFijo?.(gf.id, gf.nombre, 0)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 cursor-pointer"
                      title="Volver celda a $0"
                    >
                      $0
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveOtroGastoFijo?.(gf.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer shrink-0"
                    title="Eliminar este costo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divisor: Cantidad de Eventos al Mes */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Cantidad de Eventos al Mes (Prorrateo)
            </label>
            <span className="text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded tabular-nums">
              {eventosAlMes} {eventosAlMes === 1 ? 'evento proyectado' : 'eventos proyectados'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón rápido -1 */}
            <button
              type="button"
              onClick={() => onChangeEventosAlMes?.(Math.max(1, (eventosAlMes || 1) - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform text-xs cursor-pointer shadow-xs"
              title="Restar 1 evento"
            >
              -1
            </button>

            {/* Input libre sin tope restrictivo */}
            <input
              type="number"
              min={1}
              max={500}
              value={eventosAlMes === 0 ? '' : eventosAlMes}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                onChangeEventosAlMes?.(isNaN(val) ? 0 : Math.max(0, val));
              }}
              placeholder="4"
              className="w-20 h-8 px-2 text-center text-sm font-extrabold text-slate-900 bg-white border-2 border-teal-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-400 tabular-nums shadow-xs"
            />

            {/* Botón rápido +1 */}
            <button
              type="button"
              onClick={() => onChangeEventosAlMes?.((eventosAlMes || 0) + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform text-xs cursor-pointer shadow-xs"
              title="Sumar 1 evento"
            >
              +1
            </button>

            {/* Botón rápido +5 para meses activos */}
            <button
              type="button"
              onClick={() => onChangeEventosAlMes?.((eventosAlMes || 0) + 5)}
              className="px-2 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform text-[11px] cursor-pointer shadow-xs"
              title="Sumar 5 eventos al mes"
            >
              +5
            </button>
          </div>

          {/* Presets ampliados para emprendedores de baja y alta frecuencia */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Rápidos:</span>
            {presetsEventos.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => onChangeEventosAlMes?.(ev)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                  eventosAlMes === ev
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ev} ev.
              </button>
            ))}
          </div>

          {/* Explicación clara para responder a: ¿si tiene más de 8 eventos qué opción hay? */}
          <div className="text-[10px] text-slate-600 bg-teal-50/60 p-2 rounded-lg leading-relaxed border border-teal-200/70">
            💡 <strong>¿Tienes más de 8 eventos al mes?</strong> Puedes escribir cualquier número libremente en el campo (ej: <strong>10, 15, 20 o 30 eventos</strong>). Si atiendes coffee breaks o servicios corporativos semanales, mayor cantidad de eventos significa que tus cuentas de arriendo, luz y gas se dividen entre más servicios, reduciendo el costo fijo que absorbe cada comensal.
          </div>
        </div>

        {/* Resultados Clave de Prorrateo: Costo Fijo por Evento y Costo Fijo por Persona (p.p.) */}
        <div className="pt-2.5 border-t border-slate-200/90 space-y-1.5 text-xs bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
          <div className="flex items-center justify-between">
            <span className="text-teal-950 font-semibold">Costo Fijo asignado a este evento:</span>
            <span className="font-extrabold text-teal-900 text-sm tabular-nums">
              {formatMoneda(costosFijosEvento)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-teal-200/50 text-[11px]">
            <span className="text-slate-600 font-medium">Costo Fijo por comensal (p.p.):</span>
            <span className="font-bold text-teal-800 tabular-nums">
              +{formatMoneda(costoFijoPorPersona)} /pax
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block leading-tight pt-0.5">
            💡 Considera estos +{formatMoneda(costoFijoPorPersona)}/pax al costear tus productos y menús para absorber tus cuentas fijas.
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. COSTO REAL DE OPERACIÓN (TU GASTO BASE)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium block">
            Costo Real de Operación (Tu Gasto Base)
          </span>
          <span className="text-[10px] text-teal-300 bg-teal-950/80 border border-teal-800/80 px-2 py-0.5 rounded-full font-semibold">
            Variables + Costo Fijo
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums mt-0.5">
          {formatMoneda(costoTotalReal)}
        </div>

        {/* Subtotales en el Gasto Base */}
        <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Variables de Producción:</span>
            <span className="font-semibold text-slate-200 tabular-nums">{formatMoneda(costoVariablesTotal)}</span>
          </div>
          <div className="text-right">
            <span className="text-teal-400 block text-[10px]">Fijo Prorrateado:</span>
            <span className="font-bold text-teal-300 tabular-nums">+{formatMoneda(costosFijosEvento)}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <span>Costo real base por comensal:</span>
          <span className="font-bold text-amber-400 tabular-nums">
            {formatMoneda(costoPorInvitado)} <span className="text-[10px] text-slate-400 font-normal">/pax</span>
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          3. DISTRIBUCIÓN POR ÁREAS (GRÁFICO Y DESGLOSE)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          <span>Distribución por Áreas</span>
          <span className="text-slate-400 font-normal">100%</span>
        </div>

        {/* Barra visual horizontal compuesta con 5 segmentos */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${pctMenu}%` }}
            className="bg-amber-600 transition-all duration-300"
            title={`Menú: ${formatPorcentaje(pctMenu)}`}
          />
          <div
            style={{ width: `${pctPersonal}%` }}
            className="bg-blue-600 transition-all duration-300"
            title={`Personal: ${formatPorcentaje(pctPersonal)}`}
          />
          <div
            style={{ width: `${pctProveedores}%` }}
            className="bg-indigo-600 transition-all duration-300"
            title={`Proveedores: ${formatPorcentaje(pctProveedores)}`}
          />
          <div
            style={{ width: `${pctDecoracion}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Decoración: ${formatPorcentaje(pctDecoracion)}`}
          />
          <div
            style={{ width: `${pctCostosFijos}%` }}
            className="bg-teal-600 transition-all duration-300"
            title={`Costos Fijos: ${formatPorcentaje(pctCostosFijos)}`}
          />
        </div>

        {/* Lista de Desglose Detallada */}
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <Utensils className="w-3.5 h-3.5 text-slate-400" />
              Gastronomía & Menú
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-900 tabular-nums">{formatMoneda(costoMenu)}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">({formatPorcentaje(pctMenu)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <Users2 className="w-3.5 h-3.5 text-slate-400" />
              Personal & Brigada
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-900 tabular-nums">{formatMoneda(costoPersonal)}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">({formatPorcentaje(pctPersonal)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              Proveedores & Técnica
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-900 tabular-nums">{formatMoneda(costoProveedores)}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">({formatPorcentaje(pctProveedores)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Decoración & Montaje
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-900 tabular-nums">{formatMoneda(costoDecoracion)}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">({formatPorcentaje(pctDecoracion)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-slate-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              Costos Fijos (Prorrateo)
            </span>
            <div className="text-right">
              <span className="font-extrabold text-teal-900 tabular-nums">{formatMoneda(costosFijosEvento)}</span>
              <span className="text-[10px] text-teal-700 ml-1.5 font-bold">({formatPorcentaje(pctCostosFijos)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4. MARGEN & PRECIO DE VENTA: CRITERIO LIBRE DEL EMPRENDEDOR
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border border-amber-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-700" />
            Precio de Venta & Margen
          </label>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            {usarPrecioManual ? 'A Criterio Libre' : 'Sugerencia Sistema'}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-snug">
          La plataforma te entrega una <strong>sugerencia referencial</strong> para proteger tu rentabilidad, pero tú tienes siempre la libertad de definir tu precio final.
        </p>

        {/* Selector de Modo: Sugerencia del Sistema vs Criterio Libre */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => onToggleUsarPrecioManual?.(false)}
            className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
              !usarPrecioManual
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sugerencia ({margenGanancia}%)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleUsarPrecioManual?.(true);
              if (!precioVentaManual || precioVentaManual <= 0) {
                onChangePrecioManual?.(aplicaIva ? precioVentaTotal : precioVentaNeto);
              }
            }}
            className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
              usarPrecioManual
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mi Precio Libre</span>
          </button>
        </div>

        {/* CASO A: SUGERENCIA REFERENCIAL CON MARGEN */}
        {!usarPrecioManual && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                Margen Sugerido Deseado:
              </span>
              <span className="font-extrabold text-amber-800 text-sm tabular-nums">
                {margenGanancia}%
              </span>
            </div>

            {/* Presets de Margen */}
            <div className="grid grid-cols-7 gap-1">
              {presetsMargen.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeMargen(m)}
                  className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    margenGanancia === m
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={65}
              step={1}
              value={margenGanancia}
              onChange={(e) => onChangeMargen(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer mt-1"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Utilidad sugerida proyectada:</span>
              <span className="font-bold text-emerald-800 tabular-nums">
                +{formatMoneda(utilidadProyectada)}
              </span>
            </div>
          </div>
        )}

        {/* CASO B: PRECIO LIBRE DEFINIDO POR EL EMPRENDEDOR */}
        {usarPrecioManual && (
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-amber-950 block">
              Ingresa el Precio Total que deseas cobrar ($):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min={0}
                step={50000}
                value={precioVentaManual === 0 ? '' : precioVentaManual}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  onChangePrecioManual?.(isNaN(val) ? 0 : Math.max(0, val));
                }}
                placeholder="Ej: 4500000"
                className="w-full pl-7 pr-3 py-2 text-base font-black text-slate-900 bg-white border-2 border-amber-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 tabular-nums shadow-xs"
              />
            </div>

            {/* Análisis en vivo del Margen Real que le queda al cliente */}
            <div className="p-2.5 rounded-lg bg-white border border-amber-200/80 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Margen real según tu precio:</span>
                <span className={`font-extrabold text-sm tabular-nums px-2 py-0.5 rounded-md ${
                  margenRealObtenido >= margenGanancia
                    ? 'bg-emerald-100 text-emerald-900'
                    : margenRealObtenido >= 20
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  {margenRealObtenido}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Tu ganancia líquida real:</span>
                <span className="font-bold text-emerald-800 tabular-nums">
                  +{formatMoneda(utilidadRealObtenida)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Sugerencia del sistema:</span>
                <span className="tabular-nums">
                  {formatMoneda(aplicaIva ? precioVentaTotal : precioVentaNeto)}
                  {' '}({precioCobradoFinal >= (aplicaIva ? precioVentaTotal : precioVentaNeto) ? '+' : ''}
                  {formatMoneda(precioCobradoFinal - (aplicaIva ? precioVentaTotal : precioVentaNeto))})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta de Precio Final Cobrado Activo */}
        <div className="pt-2 border-t border-amber-200/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">
              {usarPrecioManual ? 'Precio Final Cobrado (Tu Elección)' : 'Precio Sugerido Venta Cliente'}
            </span>

            {/* Toggle IVA */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={aplicaIva}
                onChange={(e) => onToggleIva(e.target.checked)}
                className="rounded-xs text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>IVA (19%)</span>
            </label>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-amber-950 tabular-nums">
            {formatMoneda(precioCobradoFinal)}
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-amber-900 font-semibold pt-1 border-t border-amber-200/40">
            <span>Por invitado ({invitados} pax):</span>
            <span className="tabular-nums">
              {formatMoneda(Math.round(precioCobradoFinal / Math.max(1, invitados)))} /pax
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          5. TÉRMINOS DE ANTICIPO & CONDICIONES DE PAGO (LIBERTAD TOTAL DE COBRO)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Condiciones de Pago</span>
          </label>
          <span className={`text-[10px] font-extrabold border px-2.5 py-0.5 rounded-full ${
            !mostrarCondicionesPago
              ? 'bg-slate-100 text-slate-600 border-slate-300'
              : modoCondicionesPago === 'manual'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            {!mostrarCondicionesPago
              ? 'No se muestran'
              : modoCondicionesPago === 'manual'
              ? '✍️ Manual'
              : '⚙️ Automático'}
          </span>
        </div>

        {/* Interruptor maestro: mostrar u ocultar las condiciones */}
        <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
          mostrarCondicionesPago ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-300'
        }`}>
          <input
            type="checkbox"
            checked={mostrarCondicionesPago}
            onChange={(e) => onToggleMostrarCondiciones && onToggleMostrarCondiciones(e.target.checked)}
            className="accent-emerald-600 cursor-pointer mt-0.5"
          />
          <div className="leading-tight">
            <span className="font-bold text-slate-900 block text-[11px]">
              Mostrar condiciones de pago en la ficha y en el WhatsApp
            </span>
            <span className="text-[10px] text-slate-500">
              Si lo desactivas, no aparece ningún texto de condiciones en la ficha ni en el mensaje (útil cuando no corresponde).
            </span>
          </div>
        </label>

        {mostrarCondicionesPago && (
          <>
            {/* Selector de modo: manual o automático */}
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                ¿Quién define las condiciones?
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeModoCondiciones && onChangeModoCondiciones('manual')}
                  className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    modoCondicionesPago === 'manual'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="La banquetera escribe las condiciones tal cual saldrán en la ficha"
                >
                  ✍️ Manual (yo las escribo)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeModoCondiciones && onChangeModoCondiciones('auto')}
                  className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    modoCondicionesPago === 'auto'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="El sistema arma el desglose según el anticipo y las cuotas configuradas"
                >
                  ⚙️ Automático (según cuotas)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {modoCondicionesPago === 'manual'
                  ? 'En modo manual la ficha y el WhatsApp muestran exactamente el texto que escribas abajo.'
                  : 'En modo automático la ficha y el WhatsApp muestran el desglose calculado con los valores de abajo.'}
              </p>
            </div>

            {modoCondicionesPago === 'manual' && (
              <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 block">
                  Condiciones de pago (texto libre — sale tal cual en la ficha y WhatsApp):
                </label>
                <textarea
                  rows={6}
                  value={condicionesPagoPersonalizadas}
                  onChange={(e) => onChangeCondicionesPagoPersonalizadas && onChangeCondicionesPagoPersonalizadas(e.target.value)}
                  placeholder={"Ej:\nAnticipo del 50% al reservar la fecha.\nSaldo del 50% el mismo día del evento, en efectivo.\nConfirmación de comensales hasta 10 días antes."}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-500">
                  Puedes usar varias líneas. Si lo dejas vacío, no se mostrará nada de condiciones aunque el interruptor esté activo.
                </p>
              </div>
            )}
          </>
        )}

        {/* Selector de Porcentaje de Anticipo Libre */}
        {esquemaPago !== 'un_pago' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Porcentaje de Anticipo / Pie de Reserva:
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={porcentajeAnticipo}
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    onChangeAnticipo && onChangeAnticipo(val);
                  }}
                  className="w-16 px-2 py-0.5 text-xs font-black text-center bg-white border border-slate-300 rounded-md focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-slate-700">%</span>
              </div>
            </div>

            {/* Presets rápidos sin bloquear valores manuales */}
            <div className="grid grid-cols-6 gap-1">
              {[0, 20, 30, 40, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChangeAnticipo && onChangeAnticipo(pct)}
                  className={`py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    porcentajeAnticipo === pct
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={pct === 0 ? 'Sin anticipo / Pago total al final' : pct === 100 ? 'Pago 100% contado al inicio' : `${pct}% de pie`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Modalidad / Esquemas de Cobro */}
        <div>
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
            Modalidad de Cobro al Cliente:
          </span>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {/* 1 Pago (Contado) */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'un_pago' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'un_pago'}
                onChange={() => {
                  onChangeEsquemaPago && onChangeEsquemaPago('un_pago');
                  onChangeAnticipo && onChangeAnticipo(100);
                }}
                className="accent-emerald-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">1 Solo Pago (100% Contado / Anticipado)</span>
                <span className="text-[10px] text-slate-500">Un solo abono del 100% al reservar o confirmar la fecha</span>
              </div>
            </label>

            {/* 2 Pagos */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'dos_pagos' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'dos_pagos'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('dos_pagos')}
                className="accent-emerald-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">2 Pagos (Anticipo + Saldo Final)</span>
                <span className="text-[10px] text-slate-500">Anticipo de {porcentajeAnticipo}% + Saldo de {100 - porcentajeAnticipo}% antes del evento</span>
              </div>
            </label>

            {/* 3 Pagos / Hitos */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'tres_pagos' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'tres_pagos'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('tres_pagos')}
                className="accent-emerald-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">3 Pagos / Hitos de Avance</span>
                <span className="text-[10px] text-slate-500">Reserva {porcentajeAnticipo}% + Degustación/Avance {hito2Porcentaje}% + Saldo final {Math.max(0, 100 - porcentajeAnticipo - hito2Porcentaje)}%</span>
              </div>
            </label>

            {/* 4 Cuotas */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'cuatro_pagos' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'cuatro_pagos'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('cuatro_pagos')}
                className="accent-emerald-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">4 Cuotas / Facilidades (Matrimonios / Graduaciones)</span>
                <span className="text-[10px] text-slate-500">4 pagos divididos durante la planificación del evento</span>
              </div>
            </label>

            {/* Corporativo */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'corporativo' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'corporativo'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('corporativo')}
                className="accent-emerald-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">Corporativo / Facturación con O.C.</span>
                <span className="text-[10px] text-slate-500">Anticipo {porcentajeAnticipo}% + Saldo contra factura a 30 días</span>
              </div>
            </label>

            {/* 100% Personalizado */}
            <label className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'personalizado' ? 'bg-white border-amber-500 ring-1 ring-amber-500' : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'personalizado'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('personalizado')}
                className="accent-amber-600 cursor-pointer mt-0.5"
              />
              <div className="leading-tight">
                <span className="font-bold text-amber-950 block text-[11px]">⭐ Esquema 100% Personalizado (Criterio Libre)</span>
                <span className="text-[10px] text-slate-500">Redacta tú mismo las condiciones y plazos exactos de cobro</span>
              </div>
            </label>
          </div>
        </div>

        {mostrarCondicionesPago && modoCondicionesPago === 'auto' && (
          <>
        {/* Parámetros Ajustables Adicionales según Modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
          {esquemaPago === 'tres_pagos' && (
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                % Segundo Hito (Degustación / Avance):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={5}
                  max={Math.max(5, 100 - porcentajeAnticipo - 5)}
                  value={hito2Porcentaje}
                  onChange={(e) => onChangeHito2Porcentaje && onChangeHito2Porcentaje(Number(e.target.value) || 0)}
                  className="w-18 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs text-slate-600">%</span>
                <span className="text-[10px] text-slate-500">
                  (Saldo final: {Math.max(0, 100 - porcentajeAnticipo - hito2Porcentaje)}%)
                </span>
              </div>
            </div>
          )}

          {esquemaPago !== 'un_pago' && esquemaPago !== 'corporativo' && (
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                Días de Anticipación para Saldo:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={diasSaldo}
                  onChange={(e) => onChangeDiasSaldo && onChangeDiasSaldo(Number(e.target.value) || 0)}
                  className="w-18 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs text-slate-600">días</span>
                <span className="text-[10px] text-slate-500">
                  {diasSaldo === 0 ? '(El mismo día)' : 'antes del evento'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-1">
              Validez de la Oferta:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={90}
                value={validezDias}
                onChange={(e) => onChangeValidezDias && onChangeValidezDias(Number(e.target.value) || 15)}
                className="w-18 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-600">días corridos</span>
            </div>
          </div>
        </div>

        {/* Glosa Contractual Libre (Siempre disponible para escribir condiciones especiales) */}
        <div>
          <label className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
            <span>Glosa de Condiciones Comerciales (Libre Redacción):</span>
            <span className="text-[9px] text-slate-400 font-normal">Aparece en la Ficha Formal y WhatsApp</span>
          </label>
          <textarea
            rows={2}
            value={condicionesPagoPersonalizadas}
            onChange={(e) => onChangeCondicionesPagoPersonalizadas && onChangeCondicionesPagoPersonalizadas(e.target.value)}
            placeholder="Ej: Confirmación definitiva de comensales hasta 10 días antes. Degustación incluida para 2 personas tras pago de reserva."
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

          </>
        )}

        {/* Medio de Pago y Confirmación de Comensales (Libre) */}
        {mostrarCondicionesPago && (
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className={`grid grid-cols-1 ${modoCondicionesPago === 'auto' ? 'sm:grid-cols-2' : ''} gap-2`}>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => onChangeMetodoPago && onChangeMetodoPago(e.target.value as 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque' | 'otro')}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta (débito / crédito)</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro / Mixto</option>
                </select>
              </div>
              {modoCondicionesPago === 'auto' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">
                    Días mínimos para confirmar comensales:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={diasConfirmacionComensales}
                      onChange={(e) => onChangeDiasConfirmacion && onChangeDiasConfirmacion(Number(e.target.value) || 0)}
                      className="w-18 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-600">días</span>
                  </div>
                </div>
              )}
            </div>
            {modoCondicionesPago === 'auto' && (
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Detalle libre del medio de pago:
                </label>
                <input
                  type="text"
                  value={detalleMetodoPago}
                  onChange={(e) => onChangeDetalleMetodoPago && onChangeDetalleMetodoPago(e.target.value)}
                  placeholder="Ej: efectivo contra entrega / 50% transferencia y 50% efectivo"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              {modoCondicionesPago === 'auto'
                ? 'El medio de pago y su detalle aparecen en la ficha formal y en el WhatsApp.'
                : 'El medio de pago define si se muestran los datos bancarios (solo transferencia). La forma de pago y los plazos escríbelos tú en el texto de condiciones.'}
            </p>
          </div>
        )}

        {/* Desglose Matemático Reactivo de Cuotas en CLP */}
        <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
          {(() => {
            const total = precioCobradoFinal;

            if (esquemaPago === 'un_pago') {
              return (
                <div className="flex justify-between font-bold text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span>Pago Único Total (100%):</span>
                  <span className="tabular-nums text-sm font-black">{formatMoneda(total)}</span>
                </div>
              );
            }

            if (esquemaPago === 'tres_pagos') {
              const pieMonto = Math.round(total * (porcentajeAnticipo / 100));
              const hito2Monto = Math.round(total * (hito2Porcentaje / 100));
              const saldoMonto = Math.max(0, total - pieMonto - hito2Monto);

              return (
                <>
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>1. Anticipo Reserva ({porcentajeAnticipo}%):</span>
                    <span className="tabular-nums">{formatMoneda(pieMonto)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-900 font-semibold">
                    <span>2. Hito Degustación / Avance ({hito2Porcentaje}%):</span>
                    <span className="tabular-nums">{formatMoneda(hito2Monto)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-semibold">
                    <span>3. Saldo Final ({Math.max(0, 100 - porcentajeAnticipo - hito2Porcentaje)}%):</span>
                    <span className="tabular-nums">{formatMoneda(saldoMonto)}</span>
                  </div>
                </>
              );
            }

            if (esquemaPago === 'cuatro_pagos') {
              const cuota1 = Math.round(total * (porcentajeAnticipo > 0 ? porcentajeAnticipo / 100 : 0.25));
              const restante = total - cuota1;
              const cuota2 = Math.round(restante / 3);
              const cuota3 = Math.round(restante / 3);
              const cuota4 = restante - cuota2 - cuota3;

              return (
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>1. Cuota Reserva ({porcentajeAnticipo > 0 ? porcentajeAnticipo : 25}%):</span>
                    <span className="tabular-nums">{formatMoneda(cuota1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>2. Segunda Cuota:</span>
                    <span className="tabular-nums font-semibold">{formatMoneda(cuota2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>3. Tercera Cuota:</span>
                    <span className="tabular-nums font-semibold">{formatMoneda(cuota3)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>4. Cuota Final ({diasSaldo} días antes):</span>
                    <span className="tabular-nums">{formatMoneda(cuota4)}</span>
                  </div>
                </div>
              );
            }

            // Esquema estándar (2 pagos, corporativo o personalizado)
            const pieMonto = Math.round(total * (porcentajeAnticipo / 100));
            const saldoMonto = total - pieMonto;

            return (
              <>
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>1. Anticipo Reserva ({porcentajeAnticipo}%):</span>
                  <span className="tabular-nums">{formatMoneda(pieMonto)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-semibold">
                  <span>2. Saldo {esquemaPago === 'corporativo' ? 'contra factura 30 días' : `(${100 - porcentajeAnticipo}%)`}:</span>
                  <span className="tabular-nums">{formatMoneda(saldoMonto)}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          6. BOTONES DE ACCIÓN
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 pt-1">
        {onAbrirWhatsAppPropuesta && (
          <button
            type="button"
            onClick={onAbrirWhatsAppPropuesta}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Enviar propuesta formal formateada por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enviar Propuesta por WhatsApp (1 Clic)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onGuardarEnCalendario}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Agendar esta Cotización en Calendario</span>
        </button>

        <button
          type="button"
          onClick={onAbrirFichaCliente}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Generar Ficha Formal para el Cliente (PDF)</span>
        </button>
      </div>
    </div>
  );
};
