import React, { useState } from 'react';
import { MessageCircle, X, ExternalLink } from 'lucide-react';
import { EmpresaCliente } from '../types';

interface BotonFlotanteWhatsAppProps {
  empresa: EmpresaCliente;
}

export const BotonFlotanteWhatsApp: React.FC<BotonFlotanteWhatsAppProps> = ({ empresa }) => {
  const [abierto, setAbierto] = useState(false);
  const telefonoLimpio = '56931181304';
  const telefonoFormateado = '+56 9 3118 1304';

  const demoUrl = typeof window !== 'undefined' ? window.location.href : 'https://domingaeventos.cl';

  const mensajeWhatsApp = `Hola! Quiero consultar por el Sistema de Cotizaciones y Costeo para Centros de Eventos (${empresa.nombre}). Puedes ver el demo funcionando aquí: ${demoUrl}`;
  const enlaceWsp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print flex flex-col items-end gap-2">
      
      {/* Tarjeta flotante desplegable con el demo y contacto */}
      {abierto && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-xs w-72 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                W
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Asesoría Comercial</h4>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En línea por WhatsApp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-slate-600 space-y-2">
            <p>
              ¿Tienes dudas o quieres activar este sistema para tu centro de eventos?
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-500 font-mono break-all">
              Demo: <span className="text-emerald-700 font-semibold">{empresa.nombre}</span>
            </div>
          </div>

          <a
            href={enlaceWsp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Chatear al {telefonoFormateado}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      )}

      {/* Botón flotante redondo con el logo de WhatsApp */}
      <div className="flex items-center gap-2">
        {!abierto && (
          <div 
            onClick={() => setAbierto(true)}
            className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 shadow-md py-1.5 px-3 rounded-full text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WhatsApp Demo: {telefonoFormateado}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-90 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform duration-200 group ring-4 ring-emerald-500/20"
          title={`Abrir WhatsApp Asesoría (${telefonoFormateado})`}
        >
          <MessageCircle className="w-7 h-7 fill-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

    </div>
  );
};
