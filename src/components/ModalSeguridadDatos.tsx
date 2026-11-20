import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  FileWarning,
  RefreshCw,
  LogOut
} from 'lucide-react';
import {
  guardarNuevoPinAdmin,
  inspeccionarJwtSupabase,
  limpiarDatosSensiblesNavegador,
  obtenerEstadoBloqueoAdmin,
  tienePinAdminPersonalizado,
  verificarPinAdmin
} from '../utils/security';
import {
  clearSupabaseCredentials,
  cerrarSesionSupabase,
  getSupabaseCredentials,
  isSupabaseConfigured,
  obtenerSesionSupabase
} from '../lib/supabase';

interface ModalLoginAdminProps {
  isOpen: boolean;
  onClose: () => void;
  onAutenticado: () => void;
  titulo?: string;
  subtitulo?: string;
}

export const ModalLoginAdminSeguro: React.FC<ModalLoginAdminProps> = ({
  isOpen,
  onClose,
  onAutenticado,
  titulo = 'Acceso de Administrador Protegido',
  subtitulo = 'Ingresa tu PIN maestro para desbloquear la gestión multi-centro y configuración.'
}) => {
  const [pin, setPin] = useState('');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError(null);
      return;
    }
    const estado = obtenerEstadoBloqueoAdmin();
    if (estado.bloqueado) {
      setSegundosBloqueo(estado.segundosRestantes);
    } else {
      setSegundosBloqueo(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || segundosBloqueo <= 0) return;
    const t = setInterval(() => {
      const estado = obtenerEstadoBloqueoAdmin();
      setSegundosBloqueo(estado.bloqueado ? estado.segundosRestantes : 0);
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, segundosBloqueo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificando(true);
    const res = await verificarPinAdmin(pin);
    setVerificando(false);

    if (res.ok) {
      setPin('');
      onAutenticado();
      onClose();
    } else {
      setError(res.error || 'PIN incorrecto.');
      if (res.lockout.bloqueado) {
        setSegundosBloqueo(res.lockout.segundosRestantes);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">{titulo}</h3>
              <p className="text-[11px] text-indigo-200/80">Verificación cifrada SHA-256</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{subtitulo}</p>

          <div>
            <label htmlFor="admin-pin-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              PIN Maestro de Administrador
            </label>
            <div className="relative">
              <input
                id="admin-pin-input"
                type={mostrarPin ? 'text' : 'password'}
                autoComplete="off"
                autoFocus
                disabled={segundosBloqueo > 0}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ingresa tu PIN (por defecto inicial: 1967)"
                className="w-full pr-10 pl-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setMostrarPin((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={mostrarPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {mostrarPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!tienePinAdminPersonalizado() && (
              <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Recomendación: cambia el PIN inicial (1967) en el Centro de Seguridad.</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {segundosBloqueo > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold text-center">
              Bloqueo temporal activo por seguridad: {segundosBloqueo}s restantes.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={verificando || segundosBloqueo > 0 || !pin.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
            >
              {verificando ? 'Verificando...' : 'Desbloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ModalSeguridadDatosProps {
  isOpen: boolean;
  onClose: () => void;
  modoAdmin: boolean;
  onCerrarModoAdmin: () => void;
  onNotificar: (msg: string) => void;
  onAbrirPanelSupabase: () => void;
}

export const ModalSeguridadDatos: React.FC<ModalSeguridadDatosProps> = ({
  isOpen,
  onClose,
  modoAdmin,
  onCerrarModoAdmin,
  onNotificar,
  onAbrirPanelSupabase
}) => {
  const [pinPersonalizado, setPinPersonalizado] = useState(false);
  const [sesionSupabaseEmail, setSesionSupabaseEmail] = useState<string | null>(null);
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [confirmarBorradoDatos, setConfirmarBorradoDatos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPinPersonalizado(tienePinAdminPersonalizado());
    setPinFeedback(null);
    setConfirmarBorradoDatos(false);
    obtenerSesionSupabase().then((s) => {
      setSesionSupabaseEmail(s?.user?.email || null);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const esHttps =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const creds = getSupabaseCredentials();
  const supabaseActivo = isSupabaseConfigured();
  const jwtCheck = inspeccionarJwtSupabase(creds.anonKey);
  const sinServiceRoleEnNavegador = !jwtCheck.esServiceRole;

  const handleCambiarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);
    if (nuevoPin.trim() !== confirmarPin.trim()) {
      setPinFeedback({ ok: false, msg: 'Los PIN ingresados no coinciden.' });
      return;
    }
    const res = await guardarNuevoPinAdmin(nuevoPin);
    if (res.ok) {
      setPinPersonalizado(true);
      setNuevoPin('');
      setConfirmarPin('');
      setPinFeedback({ ok: true, msg: 'PIN maestro actualizado y cifrado con SHA-256 + salt.' });
      onNotificar('✓ PIN de Administrador actualizado de forma segura');
    } else {
      setPinFeedback({ ok: false, msg: res.error || 'No se pudo actualizar el PIN.' });
    }
  };

  const handleLimpiarCredenciales = async () => {
    clearSupabaseCredentials();
    await cerrarSesionSupabase();
    limpiarDatosSensiblesNavegador({ borrarCredencialesSupabase: true, cerrarModoAdmin: true });
    setSesionSupabaseEmail(null);
    onCerrarModoAdmin();
    onNotificar('✓ Credenciales Supabase cerradas y eliminadas del navegador');
  };

  const handleLimpiarTodoEquipoCompartido = async () => {
    clearSupabaseCredentials();
    await cerrarSesionSupabase();
    const count = limpiarDatosSensiblesNavegador({
      borrarCredencialesSupabase: true,
      borrarDatosClientes: true,
      cerrarModoAdmin: true
    });
    onCerrarModoAdmin();
    onNotificar(`✓ Limpieza segura completada (${count} registros locales eliminados). Recargando...`);
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">Centro de Seguridad & Protección de Datos</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  Auditoría Activa
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Protección multicapa para datos de clientes, costos internos, respaldos y base de datos Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Diagnóstico en vivo */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Diagnóstico de Seguridad en Tiempo Real
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${esHttps ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                {esHttps ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Transporte Cifrado (HTTPS)</div>
                  <div className="text-[11px] text-slate-600">
                    {esHttps ? 'Conexión segura activa en origen HTTPS/local.' : 'Usa siempre dominio HTTPS en producción.'}
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${sinServiceRoleEnNavegador ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {sinServiceRoleEnNavegador ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Custodia de Llave Privada</div>
                  <div className="text-[11px] text-slate-600">
                    {sinServiceRoleEnNavegador
                      ? 'Sin llaves service_role expuestas en el navegador.'
                      : '¡Alerta! Se detectó una llave secreta. Bórrala de inmediato.'}
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${pinPersonalizado ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                {pinPersonalizado ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                <div className="text-xs">
                  <div className="font-bold text-slate-900">PIN Maestro Administrador (SHA-256)</div>
                  <div className="text-[11px] text-slate-600">
                    {pinPersonalizado
                      ? 'PIN personalizado activo con bloqueo anti fuerza bruta (5 intentos).'
                      : 'Aún usas el PIN inicial (1967). Cámbialo abajo antes de entregar a clientes.'}
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${!supabaseActivo || sesionSupabaseEmail ? 'bg-emerald-50/70 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <Server className={`w-4 h-4 shrink-0 mt-0.5 ${!supabaseActivo || sesionSupabaseEmail ? 'text-emerald-600' : 'text-indigo-600'}`} />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Base de Datos & RLS</div>
                  <div className="text-[11px] text-slate-600">
                    {!supabaseActivo
                      ? 'Modo Local Aislado (los datos no salen de tu equipo).'
                      : sesionSupabaseEmail
                      ? `Supabase Auth activo (${sesionSupabaseEmail}).`
                      : 'Supabase conectado sin sesión Auth (RLS restringe tablas privadas).'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capas automáticas activas */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Defensas Automáticas Integradas en el Código
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <li>• <strong>Anti-XSS:</strong> Escape HTML estricto en fichas descargables y CSP en cabecera.</li>
              <li>• <strong>Anti-SQL & PostgREST Injection:</strong> Validación numérica, bytes NUL y slugs estrictos.</li>
              <li>• <strong>Anti-CSV Formula Injection:</strong> Neutralización de fórmulas (=,+,-,@) en Excel/CSV.</li>
              <li>• <strong>Anti-Prototype Pollution:</strong> Limpieza de claves peligrosas y límite de 5 MB al restaurar JSON/XLSX.</li>
              <li>• <strong>RLS Endurecido por Defecto:</strong> Scripts SQL bloquean lectura/borrado anónimo de costos y PII.</li>
              <li>• <strong>Bloqueo de service_role:</strong> Rechazo automático si alguien pega una llave secreta en el cliente.</li>
            </ul>
          </div>

          {/* Cambio de PIN Maestro */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Cambiar PIN Maestro de Administrador
              </h4>
              {!modoAdmin && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Requiere Modo Admin activo
                </span>
              )}
            </div>

            {modoAdmin ? (
              <form onSubmit={handleCambiarPin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nuevo PIN (mín. 4 caracteres)</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={nuevoPin}
                    onChange={(e) => setNuevoPin(e.target.value)}
                    placeholder="Ej: Solvi#2025"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirmar Nuevo PIN</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmarPin}
                    onChange={(e) => setConfirmarPin(e.target.value)}
                    placeholder="Repite el PIN"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!nuevoPin || !confirmarPin}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Guardar PIN Cifrado
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500">
                Activa el candado de <strong>Modo Administrador</strong> primero para cambiar o personalizar tu PIN maestro.
              </p>
            )}

            {pinFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  pinFeedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {pinFeedback.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{pinFeedback.msg}</span>
              </div>
            )}
          </div>

          {/* Limpieza segura de sesión y equipos compartidos */}
          <div className="border border-rose-200 bg-rose-50/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <FileWarning className="w-4 h-4 text-rose-600" />
              Limpieza Segura de Sesión (Para Computadores Compartidos)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si abriste tu panel en un computador de un cliente o equipo compartido, cierra tu sesión y elimina las credenciales guardadas localmente para evitar accesos posteriores.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleLimpiarCredenciales}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span>Cerrar Sesión Admin & Borrar Llaves Supabase</span>
              </button>

              <button
                type="button"
                onClick={onAbrirPanelSupabase}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gestionar Auth Supabase</span>
              </button>

              {!confirmarBorradoDatos ? (
                <button
                  type="button"
                  onClick={() => setConfirmarBorradoDatos(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Todos los Datos Locales</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] font-bold text-rose-900">¿Confirmar borrado total del navegador?</span>
                  <button
                    type="button"
                    onClick={handleLimpiarTodoEquipoCompartido}
                    className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Sí, Borrar y Recargar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarBorradoDatos(false)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Respalda tus datos en JSON/SQL antes de ejecutar limpiezas totales.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
