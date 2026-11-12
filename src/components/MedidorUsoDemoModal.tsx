import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Gauge,
  TrendingUp,
  Clock,
  FileText,
  MessageCircle,
  Calculator,
  Building2,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  RegistroMetricasDemo,
  obtenerMetricasDemo,
  calcularNivelUso,
  reiniciarMetricasDemo,
  formatearTiempoRelativo
} from '../utils/medidorDemoHelper';
import { PerfilClienteId } from '../types';

interface MedidorUsoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteActivoId: PerfilClienteId;
  diasRestantesDemo?: number;
  onCambiarCliente?: (id: PerfilClienteId) => void;
}

export const MedidorUsoDemoModal: React.FC<MedidorUsoDemoModalProps> = ({
  isOpen,
  onClose,
  clienteActivoId,
  diasRestantesDemo = 30,
  onCambiarCliente
}) => {
  const [metricas, setMetricas] = useState<RegistroMetricasDemo>(obtenerMetricasDemo);
  const [copiado, setCopiado] = useState(false);
  const [filtroCentro, setFiltroCentro] = useState<string>('todos');

  // Actualizar métricas cada 5 segundos si el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    setMetricas(obtenerMetricasDemo());
    const interval = setInterval(() => {
      setMetricas(obtenerMetricasDemo());
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const evaluacion = calcularNivelUso(metricas);

  const handleReiniciar = () => {
    if (window.confirm('¿Deseas reiniciar a cero las métricas y el historial de uso del demo?\n\nHaz esto únicamente cuando entregues el demo a un nuevo cliente.')) {
      const nuevo = reiniciarMetricasDemo();
      setMetricas(nuevo);
    }
  };

  const handleCopiarReporte = async () => {
    const texto = `📊 *REPORTE DE ACTIVIDAD Y USO DEL DEMO (SOLVI FLOW)*\n` +
      `• *Nivel de Uso:* ${evaluacion.porcentaje}% (${evaluacion.nivelTexto})\n` +
      `• *Estado:* ${evaluacion.estadoTexto}\n` +
      `• *Última interacción:* ${formatearTiempoRelativo(metricas.ultimaActividad)}\n` +
      `• *Interacciones totales:* ${metricas.totalInteracciones}\n` +
      `• *Sesiones:* ${metricas.sesionesIniciadas || 1} aperturas\n` +
      `• *Tiempo acumulado:* ~${metricas.tiempoTotalMinutos || 1} min\n\n` +
      `📌 *DESGLOSE POR CENTRO:*\n` +
      Object.values(metricas.porCentro || {})
        .map(c => `• ${c.centroNombre}: ${c.totalAcciones} acciones (Cot: ${c.cotizacionesCalculadas}, PDF: ${c.fichasPdfVistas}, Wsp: ${c.propuestasWhatsApp})`)
        .join('\n') +
      `\n\n*Fecha reporte:* ${new Date().toLocaleString('es-CL')}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const eventosFiltrados = filtroCentro === 'todos'
    ? metricas.historialEventos
    : metricas.historialEventos.filter(e => e.centroId === filtroCentro);

  // Totales globales sumados
  const totalCotizaciones = Object.values(metricas.porCentro).reduce((acc, c) => acc + c.cotizacionesCalculadas, 0);
  const totalPdfs = Object.values(metricas.porCentro).reduce((acc, c) => acc + c.fichasPdfVistas, 0);
  const totalWhatsApps = Object.values(metricas.porCentro).reduce((acc, c) => acc + c.propuestasWhatsApp, 0);
  const totalRecetas = Object.values(metricas.porCentro).reduce((acc, c) => acc + c.recetasConsultadas, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-xs">
              <Gauge className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Medidor de Uso del Demo
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  🔒 Panel Administrador
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Monitorea en tiempo real si el cliente está usando el demo, qué centros cotiza y cuándo fue su última acción
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/60">

          {/* TARJETA PRINCIPAL: VELOCÍMETRO / MEDIDOR DE INTENSIDAD */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              
              {/* Dial visual del Medidor */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`transition-all duration-1000 ${
                        evaluacion.porcentaje >= 75
                          ? 'stroke-emerald-500'
                          : evaluacion.porcentaje >= 40
                          ? 'stroke-blue-500'
                          : evaluacion.porcentaje >= 15
                          ? 'stroke-amber-500'
                          : 'stroke-slate-300'
                      }`}
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * evaluacion.porcentaje) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {evaluacion.porcentaje}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nivel de Uso
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    evaluacion.porcentaje >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : evaluacion.porcentaje >= 40
                      ? 'bg-blue-100 text-blue-800'
                      : evaluacion.porcentaje >= 15
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>{evaluacion.nivelTexto}</span>
                  </span>
                </div>
              </div>

              {/* Diagnóstico en Vivo */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Estado en Tiempo Real:
                    </span>
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {evaluacion.estadoTexto}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    ⏳ Quedan {diasRestantesDemo} días de demo
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {evaluacion.resumenFrase}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Última Interacción</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {formatearTiempoRelativo(metricas.ultimaActividad)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tiempo Activo Estimado</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      ~{metricas.tiempoTotalMinutos || 1} minutos ({metricas.sesionesIniciadas || 1} sesiones)
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    💡 <strong className="text-slate-700">Interpretación:</strong> Un nivel sobre 40% indica que el cliente cotizó eventos, descargó fichas PDF o generó mensajes de WhatsApp.
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* TARJETAS DE MÉTRICAS CLAVE */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              Acciones Cuantificadas en el Demo
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cotizaciones</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block tabular-nums">
                  {totalCotizaciones}
                </span>
                <span className="text-[10px] text-slate-500">Cálculos / pax</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Fichas PDF</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block tabular-nums">
                  {totalPdfs}
                </span>
                <span className="text-[10px] text-slate-500">PDFs consultados</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">WhatsApp</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block tabular-nums">
                  {totalWhatsApps}
                </span>
                <span className="text-[10px] text-slate-500">Propuestas listas</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Interacciones</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5 block tabular-nums">
                  {metricas.totalInteracciones}
                </span>
                <span className="text-[10px] text-slate-500">Clics y ajustes</span>
              </div>
            </div>
          </div>

          {/* DESGLOSE POR CENTRO DE EVENTOS */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              ¿Qué Centros de Eventos ha Probado el Cliente?
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(metricas.porCentro).map((c) => {
                const esDamaris = c.centroId === 'damaris-eventos';
                const esDominga = c.centroId === 'dominga-eventos';
                const tieneUso = c.totalAcciones > 0;

                return (
                  <div
                    key={c.centroId}
                    className={`p-4 rounded-2xl border transition-all ${
                      tieneUso
                        ? esDamaris
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/40'
                          : esDominga
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/40'
                          : 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300/40'
                        : 'bg-white border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">
                        {c.centroNombre}
                      </h5>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        tieneUso ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {c.totalAcciones} acc.
                      </span>
                    </div>

                    <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Cotizaciones:</span>
                        <strong className="text-slate-900">{c.cotizacionesCalculadas}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Fichas PDF:</span>
                        <strong className="text-emerald-700">{c.fichasPdfVistas}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Propuestas WhatsApp:</span>
                        <strong className="text-emerald-700">{c.propuestasWhatsApp}</strong>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Último uso:</span>
                        <span className="font-semibold text-slate-700">{formatearTiempoRelativo(c.ultimaActividad)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORIAL CRONOLÓGICO DE EVENTOS */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Historial de Acciones en Vivo
              </h4>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">Filtrar:</span>
                <select
                  value={filtroCentro}
                  onChange={(e) => setFiltroCentro(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden"
                >
                  <option value="todos">Todos los centros</option>
                  <option value="damaris-eventos">Damaris</option>
                  <option value="dominga-eventos">Dominga</option>
                  <option value="modelo-base">Demo Base</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {eventosFiltrados.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No hay acciones registradas para este filtro todavía.
                </div>
              ) : (
                eventosFiltrados.map((ev) => (
                  <div key={ev.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        ev.tipo === 'pdf'
                          ? 'bg-rose-500'
                          : ev.tipo === 'whatsapp'
                          ? 'bg-emerald-500'
                          : ev.tipo === 'cotizacion'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`} />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">
                          {ev.detalle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ev.centroNombre}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatearTiempoRelativo(ev.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Barra inferior */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopiarReporte}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Copiar reporte completo para pegar en notas o WhatsApp"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Reporte Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReiniciar}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Reiniciar contador de uso a cero"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Resetear Métricas</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Cerrar Medidor
          </button>
        </div>

      </div>
    </div>
  );
};
