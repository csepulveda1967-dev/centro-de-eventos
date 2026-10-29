import React from 'react';
import { ProveedorServicio } from '../types';
import { formatMoneda } from '../utils/formatters';
import {
  Truck,
  UtensilsCrossed,
  Disc,
  Flower2,
  Wine,
  Camera,
  Sparkles,
  Zap,
  Coffee,
  Check
} from 'lucide-react';

interface Modulo3ProveedoresProps {
  proveedores: ProveedorServicio[];
  proveedoresSeleccionados: Record<string, boolean>;
  onToggleProveedor: (id: string) => void;
  invitados: number;
}

export const Modulo3Proveedores: React.FC<Modulo3ProveedoresProps> = ({
  proveedores,
  proveedoresSeleccionados,
  onToggleProveedor,
  invitados
}) => {
  // Mapeo dinámico de iconos
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-800" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5 text-amber-700" />;
      case 'Disc':
        return <Disc className="w-5 h-5 text-indigo-600" />;
      case 'Flower2':
        return <Flower2 className="w-5 h-5 text-rose-600" />;
      case 'Wine':
        return <Wine className="w-5 h-5 text-red-700" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-emerald-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-600" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      default:
        return <Truck className="w-5 h-5 text-slate-600" />;
    }
  };

  // Cálculo del costo total de proveedores
  const costoTotalProveedores = proveedores.reduce((total, p) => {
    if (!proveedoresSeleccionados[p.id]) return total;
    if (p.tipoCobro === 'por_persona') {
      return total + p.costo * invitados;
    }
    return total + p.costo;
  }, 0);

  const cantidadContratados = proveedores.filter(p => proveedoresSeleccionados[p.id]).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
            03
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Proveedores & Servicios Complementarios
            </h2>
            <p className="text-xs text-slate-500">
              Activa o desactiva con un clic los servicios externos como vajilla, DJ, flores, barra y fotografía.
            </p>
          </div>
        </div>

        {/* Resumen en vivo */}
        <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-xl px-4 py-2 text-right shrink-0">
          <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
            Costo Proveedores
          </div>
          <div className="text-lg font-extrabold text-indigo-950 tabular-nums">
            {formatMoneda(costoTotalProveedores)}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium">
            {cantidadContratados} de {proveedores.length} servicios incluidos
          </div>
        </div>
      </div>

      {/* Lista de Checkboxes interactivos */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {proveedores.map((p) => {
          const isSelected = !!proveedoresSeleccionados[p.id];
          const costoCalculado = p.tipoCobro === 'por_persona' ? p.costo * invitados : p.costo;
          const precioVentaCalculado = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * invitados : p.precioVentaSugerido;

          return (
            <div
              key={p.id}
              onClick={() => onToggleProveedor(p.id)}
              className={`rounded-xl border p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100/80 shrink-0">
                      {renderIcon(p.iconName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {p.nombre}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                          {p.tipoCobro === 'por_persona' ? `Cobro por comensal (${invitados} pax)` : 'Cobro fijo del evento'}
                        </span>
                        {p.recetaVinculadaNombre && (
                          <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
                            Ficha: {p.recetaVinculadaNombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Checkbox */}
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2.5">
                  {p.descripcion}
                </p>
                {/* Datos de Contacto de Pedidos / Coordinación */}
                {(p.contactoNombre || p.telefonoPedidos) && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 font-semibold truncate">
                        👤 {p.contactoNombre || 'Contacto Comercial'}
                      </span>
                      {p.telefonoPedidos && (
                        <a
                          href={`https://wa.me/${p.telefonoPedidos.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, te contacto desde Dominga Eventos para coordinar el servicio de ${p.nombre}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition-colors shrink-0"
                          title="Enviar WhatsApp de coordinación al proveedor"
                        >
                          <span>💬 {p.telefonoPedidos}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{p.emailPedidos || 'Sin correo registrado'}</span>
                      {p.plazoAnticipacion && (
                        <span className="text-amber-800 font-medium">{p.plazoAnticipacion}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pie de Precios */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Costo Real Proveedor</span>
                  <div className="font-bold text-slate-800 tabular-nums">
                    {formatMoneda(costoCalculado)}{' '}
                    {p.tipoCobro === 'por_persona' && (
                      <span className="font-normal text-slate-400 text-[10px]">
                        ({formatMoneda(p.costo)}/pax)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Precio Sugerido Venta</span>
                  <div className="font-bold text-indigo-900 tabular-nums">
                    {formatMoneda(precioVentaCalculado)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
