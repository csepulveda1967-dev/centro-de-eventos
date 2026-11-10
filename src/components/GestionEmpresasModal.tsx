import React, { useState } from 'react';
import { EmpresaCliente, PerfilClienteId } from '../types';
import {
  Building2,
  Plus,
  CheckCircle2,
  X,
  Database,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Server,
  Lock,
  Unlock,
  FolderGit2,
  Share2,
  Clock,
  Rocket,
  Key
} from 'lucide-react';

interface GestionEmpresasModalProps {
  empresas: EmpresaCliente[];
  empresaActivaId: string;
  onSelectEmpresa: (id: string) => void;
  onAddEmpresa: (nueva: EmpresaCliente) => void;
  onClose: () => void;
  modoAdmin?: boolean;
  onToggleModoAdmin?: () => void;
  onAbrirRespaldo?: () => void;
  onAbrirFormularioEmpresa?: () => void;
  onActivarDemoEmpresa?: (perfilId: PerfilClienteId) => void;
  onLiberarLicenciaDefinitiva?: (perfilId: PerfilClienteId) => void;
  onReiniciarDemo30Dias?: (perfilId: PerfilClienteId) => void;
  diasRestantesDemo?: number;
}

export const GestionEmpresasModal: React.FC<GestionEmpresasModalProps> = ({
  empresas,
  empresaActivaId,
  onSelectEmpresa,
  onAddEmpresa,
  onClose,
  modoAdmin = false,
  onToggleModoAdmin,
  onAbrirRespaldo,
  onAbrirFormularioEmpresa,
  onActivarDemoEmpresa,
  onLiberarLicenciaDefinitiva,
  onReiniciarDemo30Dias,
  diasRestantesDemo = 30
}) => {
  const [tab, setTab] = useState<'empresas' | 'nueva'>('empresas');

  // Clave maestra de administrador
  const [claveAdmin, setClaveAdmin] = useState<string>(() => {
    try {
      return localStorage.getItem('solvi_admin_master_pin') || '1967';
    } catch {
      return '1967';
    }
  });
  const [editandoClave, setEditandoClave] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');

  // Formulario nueva empresa
  const [nombre, setNombre] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [recinto, setRecinto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [colorTema, setColorTema] = useState<EmpresaCliente['colorTema']>('amber');

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const inicial = nombre.trim().charAt(0).toUpperCase();
    const nuevaEmpresa: EmpresaCliente = {
      id: 'emp-' + Date.now(),
      nombre: nombre.trim(),
      subtitulo: subtitulo.trim() || 'Centro de Eventos & Banquetería',
      recintoPrincipal: recinto.trim() || nombre.trim(),
      direccion: direccion.trim() || 'Dirección por definir',
      ciudad: ciudad.trim() || 'Santiago, Chile',
      telefono: telefono.trim() || '+56 9 0000 0000',
      email: email.trim() || 'contacto@empresa.cl',
      sitioWeb: sitioWeb.trim() || undefined,
      letraLogo: inicial,
      colorTema,
      fechaRegistro: new Date().toISOString().slice(0, 10)
    };

    onAddEmpresa(nuevaEmpresa);
    onSelectEmpresa(nuevaEmpresa.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header del Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">SOLVI Flow · Gestión Multi-Empresa</h2>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  CS Consultoría
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Administra múltiples banqueteras, productoras y centros de eventos. Cada cliente opera de forma aislada con sus propias recetas y tarifas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de navegación interna */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('empresas')}
              className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                tab === 'empresas'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Centros de Eventos Activos ({empresas.length})
            </button>

            <button
              type="button"
              onClick={() => setTab('nueva')}
              className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                tab === 'nueva'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              + Registro Rápido
            </button>
          </div>

          {onAbrirFormularioEmpresa && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAbrirFormularioEmpresa();
              }}
              className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 transition-colors shadow-2xs cursor-pointer"
              title="Abrir formulario detallado con RUT, representante, modalidad y datos bancarios"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-800" />
              <span>📝 Ficha Completa & Contratación</span>
            </button>
          )}
        </div>

        {/* Contenido según Tab */}
        <div className="p-6">
          
          {/* Control de Modo Administrador vs Modo Demo */}
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${modoAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                {modoAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Estado de la Plataforma: {modoAdmin ? 'Modo Administrador Activo' : 'Modo Demo (Para Clientes)'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {modoAdmin
                    ? 'Herramientas de GitHub, base de datos y respaldos visibles.'
                    : 'Herramientas técnicas ocultas para mantener una presentación comercial limpia.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {onToggleModoAdmin && (
                <button
                  type="button"
                  onClick={onToggleModoAdmin}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    modoAdmin
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {modoAdmin ? 'Desactivar Admin' : 'Activar Modo Admin'}
                </button>
              )}
              {onAbrirRespaldo && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAbrirRespaldo();
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>GitHub & Respaldo</span>
                </button>
              )}
            </div>

            {/* Configuración y cambio de Clave Maestra de Administrador */}
            <div className="w-full mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-extrabold">Clave Maestra Administrador:</span>
                <span className="font-mono bg-white border border-slate-300 px-2 py-0.5 rounded-md text-slate-900 font-black tracking-wider shadow-2xs">
                  {editandoClave ? nuevaClave || 'Escribe tu nueva clave...' : claveAdmin}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  (Sirve para abrir candado y liberar licencias)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {!editandoClave ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNuevaClave(claveAdmin);
                      setEditandoClave(true);
                    }}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    🔑 Cambiar Clave
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      placeholder="Nueva clave..."
                      className="px-2 py-0.5 border-2 border-amber-500 rounded-lg bg-white text-xs font-bold w-32 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!nuevaClave.trim()) {
                          alert('Por favor escribe una clave válida.');
                          return;
                        }
                        try {
                          localStorage.setItem('solvi_admin_master_pin', nuevaClave.trim());
                          setClaveAdmin(nuevaClave.trim());
                          setEditandoClave(false);
                          alert(`✓ Clave de Administrador guardada exitosamente:\n\n"${nuevaClave.trim()}"\n\nGuárdala bien: con esta clave podrás abrir el candado de cualquier demo y liberar licencias.`);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-xs"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoClave(false)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: LISTADO DE EMPRESAS */}
          {tab === 'empresas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empresas.map((emp) => {
                  const isActiva = emp.id === empresaActivaId;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        if (!modoAdmin && !isActiva) {
                          alert(`🔒 El centro de eventos está protegido en Modo Demo.\n\nPara cambiar a "${emp.nombre}", primero debes abrir el candado de Administrador en la cabecera.`);
                          return;
                        }
                        onSelectEmpresa(emp.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isActiva
                          ? 'border-amber-500 bg-amber-50/30 shadow-xs ring-2 ring-amber-400 cursor-default'
                          : modoAdmin
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                          : 'border-slate-200 bg-slate-50/70 opacity-90 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-serif font-black text-lg flex items-center justify-center shrink-0">
                              {emp.letraLogo}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm">
                                {emp.nombre}
                              </h3>
                              <span className="text-[11px] font-semibold text-amber-800">
                                {emp.recintoPrincipal}
                              </span>
                            </div>
                          </div>

                          {isActiva ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Activo
                            </span>
                          ) : !modoAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                              <Lock className="w-2.5 h-2.5 text-slate-500" />
                              Bloqueado
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.direccion}, {emp.ciudad}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{emp.telefono}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {onActivarDemoEmpresa && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const perfilKey: PerfilClienteId = emp.id === 'emp-dominga' ? 'dominga-eventos' : emp.id === 'emp-damaris' ? 'damaris-eventos' : 'modelo-base';
                                  onActivarDemoEmpresa(perfilKey);
                                  onClose();
                                }}
                                className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 ${
                                  emp.id === 'emp-damaris'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : emp.id === 'emp-dominga'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                                title={`Activar demostración comercial de 30 días para ${emp.nombre}`}
                              >
                                <Rocket className="w-3.5 h-3.5" />
                                <span>{emp.id === 'emp-damaris' ? '🚀 Pasar Demo a Damaris (30 Días)' : '🚀 Activar Demo 30 Días'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const perfilKey = emp.id === 'emp-dominga' ? 'dominga-eventos' : emp.id === 'emp-damaris' ? 'damaris-eventos' : 'modelo-base';
                                const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?centro=${perfilKey}&demo=true` : '';
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(url);
                                }
                                alert(`✓ Enlace de Demo para "${emp.nombre}" (30 Días) copiado al portapapeles:\n\n${url}\n\nEste enlace abrirá directamente este centro con el candado cerrado y los 30 días de evaluación activos.`);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Copiar enlace directo de demo protegido para este centro de eventos"
                            >
                              <Share2 className="w-3 h-3 text-indigo-600" />
                              <span>Copiar Link Demo</span>
                            </button>

                            {modoAdmin && onLiberarLicenciaDefinitiva && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const perfilKey = emp.id === 'emp-dominga' ? 'dominga-eventos' : emp.id === 'emp-damaris' ? 'damaris-eventos' : 'modelo-base';
                                  onLiberarLicenciaDefinitiva(perfilKey);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Liberar licencia definitiva sin límite de tiempo para este centro"
                              >
                                <span>✨ Liberar Ilimitado</span>
                              </button>
                            )}
                          </div>

                          <div>
                            {isActiva ? (
                              <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Activo {!modoAdmin && `(${diasRestantesDemo ?? 30}d)`}</span>
                              </span>
                            ) : modoAdmin ? (
                              <span className="font-bold text-amber-900 hover:underline text-[11px] cursor-pointer">
                                Seleccionar →
                              </span>
                            ) : (
                              <span className="font-bold text-slate-400 text-[11px] flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                Fijado en Demo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTab('nueva')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Nuevo Cliente / Centro</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FORMULARIO NUEVA EMPRESA */}
          {tab === 'nueva' && (
            <form onSubmit={handleCrear} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <span className="font-bold block mb-0.5">Crea un espacio 100% aislado para tu nuevo cliente:</span>
                <p className="text-[11px]">
                  Tendrá su propio catálogo de recetas, valores de garzones, salones y cotizaciones con su propio logotipo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Comercial de la Empresa *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Casona San Carlos de Apoquindo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtítulo / Tipo de Servicio</label>
                  <input
                    type="text"
                    value={subtitulo}
                    onChange={(e) => setSubtitulo(e.target.value)}
                    placeholder="Ej: Banquetería Campestre & Matrimonios"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Recinto / Salón Principal</label>
                  <input
                    type="text"
                    value={recinto}
                    onChange={(e) => setRecinto(e.target.value)}
                    placeholder="Ej: Finca Las Acacias"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad / Comuna</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Pirque, Buin, Chicureo, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Física del Salón</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Camino El Principal Parcela 22"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eventos@cliente.cl"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sitio Web (Opcional)</label>
                  <input
                    type="text"
                    value={sitioWeb}
                    onChange={(e) => setSitioWeb(e.target.value)}
                    placeholder="www.casonacliente.cl"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTab('empresas')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Crear y Activar Espacio
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
