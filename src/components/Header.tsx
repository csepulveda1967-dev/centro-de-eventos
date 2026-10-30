import React from 'react';
import { EmpresaCliente, PerfilClienteId } from '../types';
import {
  Calendar,
  Calculator,
  Settings,
  Printer,
  Sparkles,
  Users,
  Building2,
  ChevronDown,
  Film,
  HardDrive,
  ShoppingCart,
  MessageCircle,
  FolderGit2,
  Lock,
  Unlock
} from 'lucide-react';
import { formatMoneda } from '../utils/formatters';

interface HeaderProps {
  vistaActual: 'cotizador' | 'recetas' | 'insumos' | 'compras' | 'calendario' | 'tarifas';
  setVistaActual: (vista: 'cotizador' | 'recetas' | 'insumos' | 'compras' | 'calendario' | 'tarifas') => void;
  invitados: number;
  precioSugeridoVenta: number;
  empresaActiva: EmpresaCliente;
  clienteActivoId: PerfilClienteId;
  onCambiarCliente: (clienteId: PerfilClienteId) => void;
  onAbrirFicha: () => void;
  onNuevaCotizacion: () => void;
  onAbrirGestionEmpresas: () => void;
  onAbrirComercial: () => void;
  onAbrirRespaldo: () => void;
  onAbrirWhatsAppPropuesta: () => void;
  modoAdmin?: boolean;
  onToggleModoAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  vistaActual,
  setVistaActual,
  invitados,
  precioSugeridoVenta,
  empresaActiva,
  clienteActivoId,
  onCambiarCliente,
  onAbrirFicha,
  onNuevaCotizacion,
  onAbrirGestionEmpresas,
  onAbrirComercial,
  onAbrirRespaldo,
  onAbrirWhatsAppPropuesta,
  modoAdmin = false,
  onToggleModoAdmin
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Marca Principal SOLVI Flow + Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onAbrirGestionEmpresas}
              className="flex items-center gap-2.5 p-1 -ml-1 rounded-2xl hover:bg-slate-100 transition-colors text-left group"
              title="Información de la empresa y productora"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-950 via-indigo-700 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-700/30 font-black text-base tracking-wider group-hover:scale-105 transition-transform shrink-0">
                {empresaActiva.letraLogo || 'SF'}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-950 text-sm tracking-tight leading-none truncate max-w-[150px]">
                    {empresaActiva.nombre}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                    SOLVI
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate max-w-[170px]">
                  <span className="text-slate-600 font-semibold truncate">{empresaActiva.recintoPrincipal}</span>
                </div>
              </div>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SELECTOR ELEGANTE: PERFIL DE OPERACIÓN / CLIENTE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 py-1.5 rounded-xl border border-indigo-400/30 shadow-xs shrink-0">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col text-left">
              <label htmlFor="selector-perfil-cliente" className="text-[9px] font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1 leading-tight">
                <span>Perfil de Operación / Cliente</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Aislamiento activo en localStorage" />
              </label>
              <div className="relative flex items-center">
                <select
                  id="selector-perfil-cliente"
                  value={clienteActivoId}
                  onChange={(e) => onCambiarCliente(e.target.value as PerfilClienteId)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer pr-5 py-0.5 appearance-none [&>option]:text-slate-900 [&>option]:bg-white"
                  title="Cambiar perfil y propuesta aislada en localStorage"
                >
                  <option value="modelo-base">Modelo Base (Configuración por defecto)</option>
                  <option value="dominga-eventos">Dominga Eventos (Propuesta Linderos / Finca La Toscana)</option>
                  <option value="damaris-eventos">Centro de Eventos Damaris (Propuesta Campestre Calera de Tango)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-300 pointer-events-none absolute right-0" />
              </div>
            </div>
          </div>

          {/* Navegación Principal (Tabs) */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setVistaActual('cotizador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'cotizador'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>Cotizador</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('recetas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'recetas'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Recetas & Costeo</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('insumos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'insumos'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Maestro Insumos</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('compras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'compras'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Resumen de insumos y compras a proveedores"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span className="flex items-center gap-1">
                <span>Resumen Compras</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'calendario'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Calendario</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('tarifas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                vistaActual === 'tarifas'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-700" />
              <span>Tarifas Generales</span>
            </button>
          </nav>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Resumen flotante de invitados y precio */}
            <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{invitados}</span> comensales
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-amber-900 tabular-nums">
                {formatMoneda(precioSugeridoVenta)}
              </span>
            </div>

            {/* Botón WhatsApp Propuesta 1 Clic */}
            <button
              type="button"
              onClick={onAbrirWhatsAppPropuesta}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-lg border border-emerald-300 transition-all shadow-xs"
              title="Generar propuesta por WhatsApp en 1 clic para el cliente o tu equipo"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700 fill-emerald-700" />
              <span className="hidden sm:inline">WhatsApp Propuesta</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Selector interactivo de Modo Demo (Cliente) vs Modo Administrador */}
            {onToggleModoAdmin && (
              <button
                type="button"
                onClick={onToggleModoAdmin}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  modoAdmin
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs ring-2 ring-amber-400/40'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title={
                  modoAdmin
                    ? 'Modo Administrador ACTIVO: Los botones de GitHub y Respaldo están visibles. Haz clic aquí para volver a Modo Demo (ocultar herramientas técnicas para clientes).'
                    : 'Modo Demo para Clientes (herramientas técnicas ocultas). Haz clic aquí para activar el Modo Administrador.'
                }
              >
                {modoAdmin ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Admin ON</span>
                    <span className="sm:hidden">Admin</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Modo Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </>
                )}
              </button>
            )}

            {/* Botón de Respaldo & GitHub (Visible de inmediato al activar Modo Administrador) */}
            {modoAdmin && (
              <button
                type="button"
                onClick={onAbrirRespaldo}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg border border-indigo-700 transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                title="Herramientas de Administrador: GitHub, Base de Datos y Respaldos"
              >
                <FolderGit2 className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">GitHub & Respaldo</span>
                <span className="sm:hidden">GitHub</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAbrirComercial}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 rounded-lg shadow-sm hover:shadow-md transition-all ring-1 ring-amber-400/50"
              title="Ver presentación publicitaria con voz en off interactiva"
            >
              <Film className="w-4 h-4 text-amber-900" />
              <span>Voz Comercial</span>
            </button>

            <button
              type="button"
              onClick={onAbrirFicha}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-lg shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ficha Cliente (PDF)</span>
              <span className="sm:hidden">Ficha PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
