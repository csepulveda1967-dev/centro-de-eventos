import React from 'react';
import { CotizacionState, ResumenFinanciero, MenuOption, EstiloDecoracion, Mesa, ProveedorServicio } from '../types';
import { formatMoneda, formatPorcentaje } from '../utils/formatters';
import {
  Sparkles,
  DollarSign,
  Users,
  CreditCard,
  MessageCircle,
  Printer,
  CalendarPlus,
  Sliders,
  Utensils,
  Users2,
  Truck,
  LayoutGrid,
  Palette,
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Percent,
  Wine,
  Save
} from 'lucide-react';

interface ResumenPropuestaComercialProps {
  cotizacion: CotizacionState;
  resumen: ResumenFinanciero;
  menuActual?: MenuOption;
  estiloActual?: EstiloDecoracion;
  proveedores: ProveedorServicio[];
  onIrAAdmCostos: () => void;
  onAbrirFichaCliente: () => void;
  onAbrirWhatsAppPropuesta: () => void;
  onGuardarEnCalendario: () => void;
  onGuardarCotizacion?: () => void;
  onToggleIva: (aplica: boolean) => void;
  onToggleUsarPrecioManual: (usar: boolean) => void;
  onChangePrecioManual: (precio: number) => void;
  onChangeAnticipo: (pct: number) => void;
  onChangeDiasSaldo: (dias: number) => void;
}

export const ResumenPropuestaComercial: React.FC<ResumenPropuestaComercialProps> = ({
  cotizacion,
  resumen,
  menuActual,
  estiloActual,
  proveedores,
  onIrAAdmCostos,
  onAbrirFichaCliente,
  onAbrirWhatsAppPropuesta,
  onGuardarEnCalendario,
  onGuardarCotizacion,
  onToggleIva,
  onToggleUsarPrecioManual,
  onChangePrecioManual,
  onChangeAnticipo,
  onChangeDiasSaldo
}) => {
  const invitados = cotizacion.invitados || 1;
  const precioFinal = resumen.precioCobradoFinal;
  const precioPorPersona = Math.round(precioFinal / invitados);

  // Totales de vendibles para desglose rápido al cliente
  const costoTotalMenu = (menuActual?.precioSugeridoPersona || 0) * invitados;
  const totalPersonal = cotizacion.personal.garzones + cotizacion.personal.cocineros + cotizacion.personal.aseo + cotizacion.personal.maitre;
  const proveedoresActivos = proveedores.filter(p => cotizacion.proveedoresSeleccionados[p.id]);
  const capacidadMesas = cotizacion.mesas.reduce((acc, m) => acc + m.capacidad, 0);

  // Esquema de pagos
  const pctAnticipo = cotizacion.porcentajeAnticipo ?? 40;
  const montoAnticipo = Math.round(precioFinal * (pctAnticipo / 100));
  const montoSaldo = precioFinal - montoAnticipo;
  const diasSaldo = cotizacion.diasSaldo ?? 7;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm overflow-hidden sticky top-20">
      
      {/* Cabecera Tarjeta: Propuesta Comercial Vendible */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
            <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
            Propuesta Comercial Cliente
          </span>
          <span className="text-[11px] text-indigo-200 font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <strong className="text-white">{invitados}</strong> Pax
          </span>
        </div>

        <div className="mt-3">
          <span className="text-xs text-indigo-200 font-medium block">
            {cotizacion.usarPrecioManual ? 'Precio Venta Personalizado (Tu Criterio)' : 'Precio Venta Sugerido (Plataforma)'}
          </span>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <span className="text-3xl font-black text-white tracking-tight tabular-nums">
              {formatMoneda(precioFinal)}
            </span>
            <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/30 tabular-nums">
              {formatMoneda(precioPorPersona)} /pax
            </span>
          </div>

          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
            <span>
              {cotizacion.aplicaIva ? '✓ Incluye IVA (19%)' : 'Sin IVA (Exento / Neto)'}
            </span>
            <span className="text-emerald-400 font-semibold">
              Margen Proyectado: ~{resumen.margenRealObtenido}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Interruptor Criterio Libre del Emprendedor (Sugerido vs Propio) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Criterio Libre de Fijación
            </span>
            <button
              type="button"
              onClick={() => onToggleUsarPrecioManual(!cotizacion.usarPrecioManual)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                cotizacion.usarPrecioManual
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {cotizacion.usarPrecioManual ? 'Precio Propio Activo' : 'Usar Sugerido'}
            </button>
          </div>

          {cotizacion.usarPrecioManual ? (
            <div className="pt-1">
              <label className="text-[11px] text-slate-600 block mb-1 font-medium">
                Ingresa tu precio final deseado a cobrar:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={cotizacion.precioVentaManual || ''}
                  onChange={(e) => onChangePrecioManual(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="ej. 3500000"
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 tabular-nums"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                La plataforma sugiere <strong>{formatMoneda(resumen.precioVentaTotal)}</strong>, pero la decisión final siempre es tuya.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 leading-snug">
              Calculado automáticamente sobre tus costos reales (variables + fijos prorrateados) con margen del {cotizacion.margenGanancia}%.
            </p>
          )}

          {/* Toggle IVA */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-700">Calcular con IVA (19%):</span>
            <button
              type="button"
              onClick={() => onToggleIva(!cotizacion.aplicaIva)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                cotizacion.aplicaIva
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {cotizacion.aplicaIva ? 'IVA Incluido' : 'Neto / Exento'}
            </button>
          </div>
        </div>

        {/* Desglose de Componentes Vendibles para el Cliente */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Componentes Incluidos en la Propuesta
          </h3>

          <div className="space-y-2 text-xs">
            {/* Menú */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {menuActual?.nombre || 'Menú Gastronómico'}
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">
                {invitados} porciones
              </span>
            </div>

            {/* Bebestibles & Barra por Persona */}
            {((cotizacion.bebestibles && cotizacion.bebestibles.length > 0) || (menuActual?.bebestiblesPorPersona && menuActual.bebestiblesPorPersona.length > 0)) && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <Wine className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">
                    Bebestibles & Barra por Persona
                  </span>
                </div>
                <span className="font-bold text-purple-900 tabular-nums shrink-0 ml-2">
                  {(cotizacion.bebestibles || menuActual?.bebestiblesPorPersona || []).length} variedades
                </span>
              </div>
            )}

            {/* Brigada */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <Users2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  Brigada de Operaciones
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">
                {totalPersonal} personas
              </span>
            </div>

            {/* Proveedores y Vajilla */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  Servicios Complementarios & Vajilla
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">
                {proveedoresActivos.length} activos
              </span>
            </div>

            {/* Mesas */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  Montaje & Distribución Salón
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">
                {cotizacion.mesas.length} mesas ({capacidadMesas} asientos)
              </span>
            </div>

            {/* Decoración */}
            <div className={`flex items-center justify-between p-2 rounded-lg border ${
              cotizacion.decoracionId === 'sin-decoracion' || !estiloActual
                ? 'bg-slate-50/70 border-dashed border-slate-200 text-slate-500'
                : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <Palette className={`w-3.5 h-3.5 shrink-0 ${
                  cotizacion.decoracionId === 'sin-decoracion' || !estiloActual ? 'text-slate-400' : 'text-rose-600'
                }`} />
                <span className="font-semibold text-slate-800 truncate">
                  Ambientación: {cotizacion.decoracionId === 'sin-decoracion' || !estiloActual ? 'No incluida (Aporte cliente)' : estiloActual.nombre}
                </span>
              </div>
              <span className={`font-bold shrink-0 ml-2 ${
                cotizacion.decoracionId === 'sin-decoracion' || !estiloActual ? 'text-slate-500' : 'text-emerald-700'
              }`}>
                {cotizacion.decoracionId === 'sin-decoracion' || !estiloActual ? 'Opcional / $0' : 'Incluido'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan de Pago Comercial (Anticipo / Saldo) */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-700" />
              Esquema de Pago al Cliente
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-900 font-semibold">
              <span>Anticipo:</span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pctAnticipo}
                  onChange={(e) => onChangeAnticipo(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-14 bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-black text-center text-amber-950 focus:outline-hidden"
                />
                <span className="font-bold text-xs">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white p-2 rounded-lg border border-amber-200">
              <span className="text-[10px] text-slate-500 block font-medium">Anticipo Reserva ({pctAnticipo}%)</span>
              <span className="text-sm font-extrabold text-amber-950 tabular-nums">
                {formatMoneda(montoAnticipo)}
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-amber-200">
              <span className="text-[10px] text-slate-500 block font-medium">Saldo Final ({100 - pctAnticipo}%)</span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                {formatMoneda(montoSaldo)}
              </span>
              <span className="text-[9px] text-slate-500 block">
                {diasSaldo} días antes del evento
              </span>
            </div>
          </div>
        </div>

        {/* ── TARJETA VINCULANTE: ADM. COSTOS & PRORRATEO ── */}
        <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200 rounded-xl space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-widest block">
                Control Interno del Negocio
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                Costos Reales & Gastos Fijos
              </h4>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Prorrateo Activo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-indigo-100">
            <div>
              <span className="text-[10px] text-slate-400 block">Gasto Base Real:</span>
              <strong className="text-slate-900 font-bold tabular-nums">
                {formatMoneda(resumen.costoTotalReal)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Fijo Prorrateado:</span>
              <strong className="text-indigo-900 font-bold tabular-nums">
                {formatMoneda(resumen.costosFijosEvento)}
              </strong>
              <span className="text-[9px] text-slate-500 block">
                ({formatMoneda(resumen.costoFijoPorPersona)}/pax)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onIrAAdmCostos}
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Gestionar en Adm. Costos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botones de Acción Inmediata de Propuesta */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onAbrirWhatsAppPropuesta}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white text-white" />
            <span>Enviar Propuesta por WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onAbrirFichaCliente}
              className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ver Ficha</span>
            </button>
            <button
              type="button"
              onClick={onGuardarCotizacion || onGuardarEnCalendario}
              className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Guardar cotización en tu historial y calendario"
            >
              <Save className="w-3.5 h-3.5 text-emerald-700" />
              <span>Guardar Ficha</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
