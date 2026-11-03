import React from 'react';
import { EstiloDecoracion } from '../types';
import { formatMoneda } from '../utils/formatters';
import { Palette, Check, Sparkles, Ban } from 'lucide-react';

interface Modulo5DecoracionProps {
  estilos: EstiloDecoracion[];
  decoracionSeleccionadaId: string;
  onSelectDecoracion: (id: string) => void;
}

export const Modulo5Decoracion: React.FC<Modulo5DecoracionProps> = ({
  estilos,
  decoracionSeleccionadaId,
  onSelectDecoracion
}) => {
  const noIncluyeDecoracion = decoracionSeleccionadaId === 'sin-decoracion' || !decoracionSeleccionadaId;
  const estiloActual = noIncluyeDecoracion ? null : (estilos.find(e => e.id === decoracionSeleccionadaId) || estilos[0]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
            05
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-rose-600" />
              Ambientación, Escenografía & Estilo Visual
            </h2>
            <p className="text-xs text-slate-500">
              Escoge el concepto decorativo integral del salón, o déjalo libre sin incluirlo si el cliente lo aporta.
            </p>
          </div>
        </div>

        {/* Resumen en vivo */}
        <div className={`border rounded-xl px-4 py-2 text-right shrink-0 transition-colors ${
          noIncluyeDecoracion 
            ? 'bg-slate-100 border-slate-300' 
            : 'bg-rose-50/70 border-rose-200/60'
        }`}>
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${
            noIncluyeDecoracion ? 'text-slate-600' : 'text-rose-800'
          }`}>
            Costo Fijo Decoración
          </div>
          <div className={`text-lg font-extrabold tabular-nums ${
            noIncluyeDecoracion ? 'text-slate-800' : 'text-rose-950'
          }`}>
            {formatMoneda(noIncluyeDecoracion ? 0 : (estiloActual?.costoFijo || 0))}
          </div>
          <div className={`text-[11px] font-medium ${
            noIncluyeDecoracion ? 'text-slate-500' : 'text-rose-700'
          }`}>
            {noIncluyeDecoracion ? 'Sin ambientación (No incluida)' : `Estilo: ${estiloActual?.nombre}`}
          </div>
        </div>
      </div>

      {/* Galería de Tarjetas */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ── OPCIÓN LIBRE: NO INCLUIR DECORACIÓN / SIN AMBIENTACIÓN ($0) ── */}
        <div
          onClick={() => onSelectDecoracion('sin-decoracion')}
          className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
            noIncluyeDecoracion
              ? 'border-slate-800 bg-slate-50/80 shadow-md ring-2 ring-slate-800'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                    <Ban className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    No incluir Decoración ni Ambientación
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Opción libre para eventos sin montaje visual o donde el cliente aporta su propia decoración.
                </p>
              </div>

              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                noIncluyeDecoracion ? 'bg-slate-900 text-white shadow-xs' : 'border border-slate-300 bg-white'
              }`}>
                {noIncluyeDecoracion && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              Al seleccionar esta opción libre, el costo fijo de decoración se descuenta a <strong>$0</strong> y no se cobrará en la propuesta ni en la ficha de cotización.
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Condición del Servicio:
              </span>
              <ul className="space-y-1 text-xs text-slate-500">
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Sin costo de ambientación para el centro de eventos ($0).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>El cliente o empresa externa se encarga del montaje escenográfico.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Costo Montaje</span>
              <span className="font-bold text-slate-700 tabular-nums">$0</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Precio Venta</span>
              <span className="font-bold text-slate-900 tabular-nums">$0</span>
            </div>
          </div>
        </div>

        {/* Estilos Predefinidos */}
        {estilos.map((estilo) => {
          const isSelected = !noIncluyeDecoracion && estilo.id === decoracionSeleccionadaId;

          return (
            <div
              key={estilo.id}
              onClick={() => onSelectDecoracion(isSelected ? 'sin-decoracion' : estilo.id)}
              className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-rose-500 bg-gradient-to-br from-white to-rose-50/40 shadow-md ring-2 ring-rose-400'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {estilo.nombre}
                      </h3>
                      {estilo.destacado && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-rose-600" />
                          Tendencia
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {estilo.subtitulo}
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-rose-600 text-white shadow-xs' : 'border border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Paleta de Colores */}
                <div className="mt-3.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Paleta:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {estilo.paleta.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color }}
                        title={`Tono ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {estilo.descripcion}
                </p>

                {/* Elementos Incluidos */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Elementos Clave Incluidos:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-500">
                    {estilo.elementos.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold leading-none mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pie de Precios */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Costo Real Montaje</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {formatMoneda(estilo.costoFijo)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Precio Sugerido Venta</span>
                  <span className="font-bold text-rose-900 tabular-nums">
                    {formatMoneda(estilo.precioVentaSugerido)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
