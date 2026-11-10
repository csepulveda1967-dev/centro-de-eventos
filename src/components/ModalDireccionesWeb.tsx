import React, { useState } from 'react';
import { EmpresaCliente, PerfilClienteId } from '../types';
import { obtenerUrlDirectaEmpresa, obtenerSlugEmpresa } from '../utils/empresaUrlHelper';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Globe,
  Sparkles,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';

interface ModalDireccionesWebProps {
  isOpen: boolean;
  onClose: () => void;
  empresaActiva: EmpresaCliente;
  clienteActivoId: PerfilClienteId;
  empresasDisponibles: EmpresaCliente[];
  onCambiarEmpresa?: (clienteId: PerfilClienteId) => void;
}

export const ModalDireccionesWeb: React.FC<ModalDireccionesWebProps> = ({
  isOpen,
  onClose,
  empresaActiva,
  clienteActivoId,
  empresasDisponibles,
  onCambiarEmpresa
}) => {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  if (!isOpen) return null;

  const urlActual = typeof window !== 'undefined'
    ? obtenerUrlDirectaEmpresa(clienteActivoId, empresaActiva.id)
    : '';

  const copiarUrl = async (url: string, id: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2500);
    } catch (e) {
      console.error('Error al copiar al portapapeles:', e);
    }
  };

  // Mapeo de perfiles predeterminados
  const centrosEspeciales = [
    {
      perfilId: 'damaris-eventos' as PerfilClienteId,
      empresaId: 'emp-damaris',
      nombre: 'Centro de Eventos Damaris',
      subtitulo: 'Salón & Parque Campestre 10.000 m² (Calera de Tango)',
      slug: 'damaris',
      color: 'emerald',
      letra: 'CD'
    },
    {
      perfilId: 'dominga-eventos' as PerfilClienteId,
      empresaId: 'emp-dominga',
      nombre: 'Dominga Eventos by Mauge',
      subtitulo: 'Alta Banquetería & Finca La Toscana (Buin / Linderos)',
      slug: 'dominga',
      color: 'amber',
      letra: 'DE'
    },
    {
      perfilId: 'modelo-base' as PerfilClienteId,
      empresaId: 'emp-isidora',
      nombre: 'Doña Isidora Eventos',
      subtitulo: 'Banquetería Itinerante & Matrimonios en Parcelas',
      slug: 'isidora',
      color: 'rose',
      letra: 'DI'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Direcciones Web Propias de Cada Centro</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  URL Directa
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Cada empresa cuenta con su propio enlace aislado. Al enviarlo a un cliente, entra directamente a ese centro.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Tarjeta destacada: Empresa Activa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-blue-50/50 border-2 border-indigo-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {empresaActiva.letraLogo || 'SF'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Centro Activo en Pantalla
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                    {empresaActiva.nombre}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copiarUrl(urlActual, 'activa')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiadoId === 'activa'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                }`}
              >
                {copiadoId === 'activa' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace Propio</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-indigo-200/60 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-indigo-950 font-semibold truncate select-all">
                {urlActual}
              </span>
              <a
                href={urlActual}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors shrink-0"
                title="Probar abrir enlace en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-slate-600 flex items-center gap-1.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Cualquier persona que reciba este enlace entrará <strong>directamente a {empresaActiva.nombre}</strong> con su propuesta, logotipo, colores y cotización oficial.
              </span>
            </p>
          </div>

          {/* Lista de Centros de Eventos Disponibles */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Enlaces Directos de Todos los Centros de Eventos
            </h4>

            <div className="space-y-2.5">
              {centrosEspeciales.map((c) => {
                const url = typeof window !== 'undefined'
                  ? obtenerUrlDirectaEmpresa(c.perfilId, c.empresaId)
                  : '';
                const esElActual = clienteActivoId === c.perfilId;
                const estaCopiado = copiadoId === c.perfilId;

                return (
                  <div
                    key={c.perfilId}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      esElActual
                        ? 'border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0 ${
                          c.color === 'emerald' ? 'bg-emerald-600' : c.color === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
                        }`}>
                          {c.letra}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {c.nombre}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate">
                            {c.subtitulo}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1.5 font-mono text-[11px] text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/80 inline-block max-w-full truncate">
                        ?centro={c.slug}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {onCambiarEmpresa && !esElActual && (
                        <button
                          type="button"
                          onClick={() => {
                            onCambiarEmpresa(c.perfilId);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Cargar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => copiarUrl(url, c.perfilId)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                          estaCopiado
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                        title={`Copiar enlace directo de ${c.nombre}`}
                      >
                        {estaCopiado ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title={`Abrir ${c.nombre} en nueva pestaña`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guía Explicativa */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>💡 ¿Cómo compartir con clientes o socios?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Para mandar <strong>Damaris</strong>, envía el enlace que termina en <code>?centro=damaris</code>. Para <strong>Dominga</strong>, el que termina en <code>?centro=dominga</code>. Cada dirección es fija, aislada y jamás se cruza con otra empresa.
            </p>
          </div>

        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
