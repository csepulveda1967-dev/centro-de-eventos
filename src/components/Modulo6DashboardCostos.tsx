import React from 'react';
import { ResumenFinanciero } from '../types';
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
  Check
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
  // Términos de anticipo configurables por Dominga Eventos
  porcentajeAnticipo?: number;
  onChangeAnticipo?: (pct: number) => void;
  esquemaPago?: 'dos_pagos' | 'tres_pagos' | 'corporativo';
  onChangeEsquemaPago?: (esquema: 'dos_pagos' | 'tres_pagos' | 'corporativo') => void;
  diasSaldo?: number;
  onChangeDiasSaldo?: (dias: number) => void;
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
  diasSaldo = 7,
  onChangeDiasSaldo
}) => {
  const {
    costoMenu,
    costoPersonal,
    costoProveedores,
    costoDecoracion,
    costoTotalReal,
    costoPorInvitado,
    utilidadProyectada,
    precioVentaNeto,
    ivaMonto,
    precioVentaTotal,
    precioVentaPorInvitado
  } = resumen;

  // Porcentajes para la barra de distribución
  const pctMenu = costoTotalReal > 0 ? (costoMenu / costoTotalReal) * 100 : 0;
  const pctPersonal = costoTotalReal > 0 ? (costoPersonal / costoTotalReal) * 100 : 0;
  const pctProveedores = costoTotalReal > 0 ? (costoProveedores / costoTotalReal) * 100 : 0;
  const pctDecoracion = costoTotalReal > 0 ? (costoDecoracion / costoTotalReal) * 100 : 0;

  const presetsMargen = [25, 30, 35, 40, 45, 50];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm lg:sticky lg:top-20 transition-all">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
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
          Cálculo Reactivo 100%
        </div>
      </div>

      {/* Tarjeta Principal: Costo Real Total de Producción */}
      <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white shadow-xs">
        <span className="text-xs text-slate-400 font-medium block">
          Costo Real de Operación (Tu Gasto Base)
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums mt-0.5">
          {formatMoneda(costoTotalReal)}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <span>Costo real por comensal:</span>
          <span className="font-bold text-amber-400 tabular-nums">
            {formatMoneda(costoPorInvitado)} <span className="text-[10px] text-slate-400 font-normal">/pax</span>
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Segmentadas por Área */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          <span>Distribución por Áreas</span>
          <span className="text-slate-400 font-normal">100%</span>
        </div>

        {/* Barra visual horizontal compuesta */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
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
        </div>

        {/* Lista de Desglose Detallada */}
        <div className="mt-3 space-y-2 text-xs">
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

          <div className="flex items-center justify-between py-1">
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
        </div>
      </div>

      {/* Margen de Ganancia Comercial */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-slate-500" />
            Margen Comercial Deseado
          </label>
          <span className="text-xs font-extrabold text-amber-700 tabular-nums">
            {margenGanancia}%
          </span>
        </div>

        {/* Botones de presets */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {presetsMargen.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChangeMargen(m)}
              className={`py-1 text-[11px] font-bold rounded-md transition-colors ${
                margenGanancia === m
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}%
            </button>
          ))}
        </div>

        {/* Slider libre */}
        <input
          type="range"
          min={10}
          max={65}
          step={1}
          value={margenGanancia}
          onChange={(e) => onChangeMargen(Number(e.target.value))}
          className="w-full accent-amber-600 cursor-pointer"
        />

        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Utilidad bruta proyectada:</span>
          <span className="font-bold text-emerald-800 tabular-nums">
            +{formatMoneda(utilidadProyectada)}
          </span>
        </div>
      </div>

      {/* Precio Sugerido de Venta al Cliente */}
      <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-700" />
            Precio Sugerido Venta Cliente
          </span>

          {/* Toggle IVA */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={aplicaIva}
              onChange={(e) => onToggleIva(e.target.checked)}
              className="rounded-xs text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span>IVA (19%)</span>
          </label>
        </div>

        <div className="text-2xl sm:text-3xl font-black text-amber-950 tabular-nums mt-1">
          {formatMoneda(aplicaIva ? precioVentaTotal : precioVentaNeto)}
        </div>

        <div className="mt-2 pt-2 border-t border-amber-200/60 space-y-1 text-xs text-amber-900">
          <div className="flex justify-between">
            <span className="text-slate-600">Valor Neto:</span>
            <span className="font-semibold tabular-nums">{formatMoneda(precioVentaNeto)}</span>
          </div>
          {aplicaIva && (
            <div className="flex justify-between">
              <span className="text-slate-600">IVA (19%):</span>
              <span className="font-semibold tabular-nums">+{formatMoneda(ivaMonto)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-amber-200/40 font-bold text-amber-950">
            <span>Sugerido por invitado:</span>
            <span className="tabular-nums">
              {formatMoneda(aplicaIva ? precioVentaPorInvitado : precioVentaNeto / (invitados || 1))} /pax
            </span>
          </div>
        </div>
      </div>

      {/* Términos de Anticipo & Condiciones de Pago (Configurable por Dominga) */}
      <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            Condiciones de Anticipo & Pago
          </label>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            {porcentajeAnticipo}% Pie
          </span>
        </div>

        {/* Explicación de política de empresa */}
        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 leading-snug flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-800">Política Dominga Eventos:</strong> El anticipo asegura la exclusividad de la fecha y fondea compras mayoristas; lo define la productora, <em>no se deja a criterio libre del cliente</em>.
          </span>
        </div>

        {/* Selector de Porcentaje de Anticipo */}
        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Porcentaje de Anticipo para Reserva:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[30, 40, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onChangeAnticipo && onChangeAnticipo(pct)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  porcentajeAnticipo === pct
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pct}% {pct === 40 ? '(Estándar)' : pct === 50 ? '(Alta Dem.)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Modalidad / Esquema */}
        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Modalidad de Pago:
          </span>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'dos_pagos' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'dos_pagos'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('dos_pagos')}
                className="accent-emerald-600"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block text-[11px]">2 Pagos (Estándar Matrimonios)</span>
                <span className="text-[10px] text-slate-500">Anticipo {porcentajeAnticipo}% + Saldo hasta {diasSaldo} días antes</span>
              </div>
            </label>

            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'tres_pagos' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'tres_pagos'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('tres_pagos')}
                className="accent-emerald-600"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block text-[11px]">3 Cuotas / Hitos</span>
                <span className="text-[10px] text-slate-500">Reserva {porcentajeAnticipo}% + Degustación 30% + Saldo final</span>
              </div>
            </label>

            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              esquemaPago === 'corporativo' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="esquemaPago"
                checked={esquemaPago === 'corporativo'}
                onChange={() => onChangeEsquemaPago && onChangeEsquemaPago('corporativo')}
                className="accent-emerald-600"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block text-[11px]">Corporativo / Facturación</span>
                <span className="text-[10px] text-slate-500">Anticipo {porcentajeAnticipo}% + Saldo contra factura 30 días</span>
              </div>
            </label>
          </div>
        </div>

        {/* Desglose Matemático de Cuotas en CLP */}
        <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
          {(() => {
            const total = aplicaIva ? precioVentaTotal : precioVentaNeto;
            const pieMonto = Math.round(total * (porcentajeAnticipo / 100));
            const hito2Monto = esquemaPago === 'tres_pagos' ? Math.round(total * 0.30) : 0;
            const saldoMonto = total - pieMonto - hito2Monto;

            return (
              <>
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>1. Anticipo Reserva ({porcentajeAnticipo}%):</span>
                  <span className="tabular-nums">{formatMoneda(pieMonto)}</span>
                </div>
                {esquemaPago === 'tres_pagos' && (
                  <div className="flex justify-between text-slate-700">
                    <span>2. Hito Degustación (30%):</span>
                    <span className="tabular-nums font-semibold">{formatMoneda(hito2Monto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span>{esquemaPago === 'tres_pagos' ? '3. Saldo Final' : '2. Saldo Restante'}:</span>
                  <span className="tabular-nums font-semibold">{formatMoneda(saldoMonto)}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mt-5 space-y-2">
        {onAbrirWhatsAppPropuesta && (
          <button
            type="button"
            onClick={onAbrirWhatsAppPropuesta}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            title="Enviar propuesta formal formateada por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enviar Propuesta por WhatsApp (1 Clic)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onGuardarEnCalendario}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Agendar esta Cotización en Calendario</span>
        </button>

        <button
          type="button"
          onClick={onAbrirFichaCliente}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Generar Ficha Formal para el Cliente (PDF)</span>
        </button>
      </div>
    </div>
  );
};
