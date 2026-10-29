import React, { useState, useRef } from 'react';
import {
  X,
  HardDrive,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Server,
  ExternalLink,
  ShieldCheck,
  Copy,
  Terminal,
  RefreshCw,
  FileCode2,
  Lock,
  GitBranch,
  FolderGit2,
  Check,
  Code2,
  Sparkles
} from 'lucide-react';
import {
  PaqueteRespaldoCompleto,
  descargarRespaldoJSON,
  descargarRespaldoSQL,
  leerArchivoRespaldoJSON
} from '../utils/respaldoDiscoDuro';
import {
  descargarPaqueteCompletoZip,
  descargarArchivoTextoEnMemoria,
  schemaSqlContent,
  seedSqlContent,
  guiaContent
} from '../utils/generadorZipCliente';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  probarConexionSupabase
} from '../lib/supabase';
import {
  EmpresaCliente,
  InsumoMaestro,
  RecetaFichaTecnica,
  MenuOption,
  StaffTarifas,
  ProveedorServicio,
  EstiloDecoracion,
  ReservaCalendario,
  CotizacionState
} from '../types';

interface ModalRespaldoSupabaseProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: EmpresaCliente;
  empresas: EmpresaCliente[];
  insumos: InsumoMaestro[];
  recetas: RecetaFichaTecnica[];
  menus: MenuOption[];
  tarifasStaff: StaffTarifas;
  proveedores: ProveedorServicio[];
  estilosDecoracion: EstiloDecoracion[];
  reservas: ReservaCalendario[];
  cotizacionActual: CotizacionState;
  onRestaurarDatos: (datos: PaqueteRespaldoCompleto) => void;
  onNotificar: (msg: string) => void;
}

export const ModalRespaldoSupabase: React.FC<ModalRespaldoSupabaseProps> = ({
  isOpen,
  onClose,
  empresa,
  empresas,
  insumos,
  recetas,
  menus,
  tarifasStaff,
  proveedores,
  estilosDecoracion,
  reservas,
  cotizacionActual,
  onRestaurarDatos,
  onNotificar
}) => {
  const [tabActiva, setTabActiva] = useState<'github' | 'disco' | 'supabase' | 'produccion'>('github');
  const [modoRepo, setModoRepo] = useState<'nuevo' | 'sobrescribir'>('sobrescribir');
  const [copiadoComando, setCopiadoComando] = useState<string | null>(null);
  const [repoUsuario, setRepoUsuario] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de credenciales Supabase
  const credsIniciales = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(credsIniciales.url);
  const [supabaseKey, setSupabaseKey] = useState(credsIniciales.anonKey);
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);

  if (!isOpen) return null;

  const paqueteActual: PaqueteRespaldoCompleto = {
    version: '1.2.0',
    fechaExportacion: new Date().toISOString(),
    autor: 'SOLVI Flow · CS Consultoría',
    empresaActivaId: empresa.id,
    empresas,
    insumos,
    recetas,
    menus,
    tarifasStaff,
    proveedores,
    estilosDecoracion,
    reservas,
    cotizacionActual
  };

  const handleDescargarJSON = () => {
    descargarRespaldoJSON(paqueteActual, empresa.nombre);
    onNotificar('¡Respaldo JSON descargado con éxito en tu disco duro!');
  };

  const handleDescargarSQL = () => {
    descargarRespaldoSQL(paqueteActual, empresa.nombre);
    onNotificar('¡Script SQL para Supabase/PostgreSQL generado y descargado!');
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const datos = await leerArchivoRespaldoJSON(file);
      onRestaurarDatos(datos);
      onNotificar(`¡Respaldo restaurado con éxito! Se cargaron ${datos.recetas.length} recetas y ${datos.insumos.length} insumos.`);
      onClose();
    } catch (err: any) {
      alert(`Error al restaurar archivo: ${err.message || 'Formato no reconocido'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGuardarCredencialesSupabase = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    onNotificar('Credenciales de Supabase guardadas localmente.');
  };

  const handleProbarConexion = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    const res = await probarConexionSupabase();
    setResultadoPrueba(res);
    setProbando(false);
  };

  const copiarTexto = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoComando(clave);
    onNotificar('Comando copiado al portapapeles');
    setTimeout(() => setCopiadoComando(null), 2500);
  };

  const urlFinal = repoUsuario.trim() || 'https://github.com/TU-USUARIO/TU-REPOSITORIO.git';
  const comandoGitCompleto = modoRepo === 'sobrescribir'
    ? `git remote add origin ${urlFinal} 2>nul || git remote set-url origin ${urlFinal}\ngit branch -M main\ngit push -u origin main --force`
    : `git remote add origin ${urlFinal}\ngit branch -M main\ngit push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado SOLVI Flow */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">SOLVI Flow · Subir a GitHub & Respaldos</h3>
                <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Código Limpio
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                «Todo fluye. Todo conecta». Proyecto limpio, sin archivos mezclados y con Git listo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTabActiva('github')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tabActiva === 'github'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            1. Subir a GitHub (Recomendado)
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('disco')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tabActiva === 'disco'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            2. Respaldo de Datos (JSON / SQL)
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('supabase')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tabActiva === 'supabase'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            3. Base de Datos Supabase
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('produccion')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tabActiva === 'produccion'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            4. Despliegue 24/7 (Vercel)
          </button>
        </div>

        {/* Contenido de la pestaña */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* PESTAÑA 1: GITHUB (LA SOLUCIÓN LIMPIA) */}
          {tabActiva === 'github' && (
            <div className="space-y-6">
              
              {/* Notificación de depuración exitosa */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold">Proyecto 100% Depurado y Limpio:</span> Se eliminaron todos los archivos temporales, carpetas mezcladas y archivos ZIP pesados que saturaban el repositorio. El control de versiones <strong>Git está inicializado en la rama main</strong> con un commit inicial limpio listo para subir a tu cuenta de GitHub.
                </div>
              </div>

              {/* Explicación clave sobre GitHub vs ZIP */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 leading-relaxed">
                  <span className="font-bold">¿Por qué NO usar archivos ZIP para GitHub?</span><br />
                  GitHub no lee el contenido dentro de archivos <code>.zip</code>. Si descomprimes un zip sobre una carpeta que ya tenía código antiguo, se combinan archivos viejos con nuevos, se pierden los cambios y el historial de Git se corrompe. La forma estándar y profesional es subir con los <strong>3 comandos Git directos</strong> indicados abajo.
                </div>
              </div>

              {/* Generador de Comando con URL personalizada */}
              <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600" />
                    Paso a Paso: Conectar con tu Repositorio en GitHub
                  </h4>
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Crear nuevo repo en GitHub.com
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-2">
                  <label htmlFor="repo-url-input" className="block text-xs font-semibold text-slate-700">
                    (Opcional) Pega aquí la URL de tu repositorio de GitHub para autocompletar el comando:
                  </label>
                  <input
                    id="repo-url-input"
                    type="text"
                    value={repoUsuario}
                    onChange={(e) => setRepoUsuario(e.target.value)}
                    placeholder="https://github.com/tu-usuario/solvi-flow.git"
                    className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Selector: ¿Repositorio nuevo o existente? */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-white border border-indigo-200 rounded-xl">
                  <span className="text-xs font-bold text-slate-800">¿Cuál es el estado de tu repositorio en GitHub?</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModoRepo('nuevo')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        modoRepo === 'nuevo'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Repositorio Nuevo (Vacío)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoRepo('sobrescribir')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        modoRepo === 'sobrescribir'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Existente (Sobrescribir y Limpiar)
                    </button>
                  </div>
                </div>

                {modoRepo === 'sobrescribir' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold">✨ No necesitas borrar el repositorio en GitHub:</span> El parámetro <code>--force</code> reemplaza de un solo viaje todos los commits y archivos viejos/mezclados de GitHub por este código nuevo y limpio. Si ya tenías Vercel conectado, seguirá conectado sin reconfigurar nada.
                  </div>
                )}

                {/* Bloque de comandos listo para copiar */}
                <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs relative group">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                    <span>
                      {modoRepo === 'sobrescribir'
                        ? 'Ejecuta estos comandos para limpiar y sobreescribir el repositorio existente:'
                        : 'Ejecuta estos 3 comandos en tu terminal:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copiarTexto(comandoGitCompleto, 'git-push')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-sans font-bold transition-colors cursor-pointer"
                    >
                      {copiadoComando === 'git-push' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Comandos</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed select-all">
                    {comandoGitCompleto}
                  </pre>
                </div>

              </div>

              {/* Métodos Alternativos Incluidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Script de 1 Clic */}
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <Code2 className="w-4 h-4" />
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">Scripts Automáticos Listos</h5>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hemos creado dos archivos en la raíz del proyecto para que solo des doble clic:
                  </p>
                  <ul className="text-[11px] font-mono space-y-1 text-slate-700">
                    <li>• <strong>subir-a-github.bat</strong> (Para Windows)</li>
                    <li>• <strong>subir-a-github.sh</strong> (Para Mac o Linux)</li>
                  </ul>
                  <p className="text-[11px] text-slate-500">
                    Solo te pedirán la URL de tu repositorio y subirán todo sin errores.
                  </p>
                </div>

                {/* Subir vía Navegador (Web) */}
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">Subir vía Web en GitHub.com</h5>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Si no quieres usar terminal:
                  </p>
                  <ol className="text-[11px] text-slate-700 list-decimal pl-4 space-y-1">
                    <li>En tu repositorio nuevo en GitHub, pulsa <strong>"uploading an existing file"</strong>.</li>
                    <li>Arrastra las carpetas <code>src/</code>, <code>supabase/</code> y los archivos <code>package.json</code>, <code>index.html</code>, <code>vite.config.ts</code>, <code>README.md</code>.</li>
                    <li>Haz clic en <strong>Commit changes</strong>.</li>
                  </ol>
                </div>

              </div>

              {/* Estructura Limpia Verificada */}
              <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Estructura Limpia Garantizada en tu Repositorio
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">46 archivos esenciales</span>
                </div>
                <div className="font-mono text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>
                    <span className="text-indigo-400">src/</span> - Código React, cotizador y recetas<br />
                    <span className="text-indigo-400">supabase/</span> - Scripts schema.sql y seed.sql<br />
                    <span className="text-indigo-400">README.md</span> - Documentación lista para GitHub
                  </div>
                  <div>
                    <span className="text-indigo-400">package.json</span> - Dependencias limpias sin basura<br />
                    <span className="text-indigo-400">.gitignore</span> - Excluye autom. node_modules y zips<br />
                    <span className="text-emerald-400">0 archivos zip duplicados</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA 2: DISCO DURO (DATOS JSON/SQL) */}
          {tabActiva === 'disco' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Respaldo de Datos y Configuración:</span> Puedes guardar una copia exacta de tus recetas, insumos, precios y cotizaciones en tu disco duro en formatos estándar de datos (JSON o SQL).
                </div>
              </div>

              {/* OPCIÓN: RESIDUAL JSON Y SQL DIRECTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Respaldo JSON */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                      <FileCode2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Respaldo Completo en Formato JSON</h4>
                      <p className="text-[11px] text-slate-500">Para restaurar en esta app en cualquier PC</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Guarda los {insumos.length} insumos, {recetas.length} recetas gastronómicas y cotizaciones en un archivo liviano de texto.
                  </p>
                  <button
                    type="button"
                    onClick={handleDescargarJSON}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Respaldo JSON
                  </button>
                </div>

                {/* Respaldo SQL PostgreSQL */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Script SQL para Base de Datos</h4>
                      <p className="text-[11px] text-slate-500">Para importar en Supabase / PostgreSQL</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Genera sentencias INSERT listas para ejecutar en el SQL Editor de Supabase o cualquier servidor PostgreSQL.
                  </p>
                  <button
                    type="button"
                    onClick={handleDescargarSQL}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Script SQL
                  </button>
                </div>

              </div>

              {/* Botón de Restauración */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Restaurar Respaldo desde tu Disco Duro</h4>
                  <p className="text-[11px] text-slate-500">
                    Carga un archivo <code>.json</code> previamente descargado para recuperar todos tus datos.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleSubirArchivo}
                  className="hidden"
                  id="input-restaurar-json"
                />
                <label
                  htmlFor="input-restaurar-json"
                  className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivo JSON de Respaldo
                </label>
              </div>

              {/* Paquete de Base de Datos Cliente */}
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-center justify-between gap-4">
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-emerald-900">Paquete de Tablas y Esquemas:</span> Descarga las definiciones DDL de tablas y datos semilla de prueba.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    onNotificar('Generando archivo en tu navegador...');
                    await descargarPaqueteCompletoZip(paqueteActual, 'SOLVI_Flow');
                    onNotificar('¡Descarga de esquemas completada!');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Tablas SQL
                </button>
              </div>

            </div>
          )}

          {/* PESTAÑA 3: SUPABASE */}
          {tabActiva === 'supabase' && (
            <div className="space-y-6">
              
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Estado: {isSupabaseConfigured() ? 'Configurado con Supabase' : 'Modo Local / Autónomo (Sin llaves ingresadas)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      El sistema opera con persistencia local ultra rápida y puede conectarse a Supabase cuando lo desees.
                    </p>
                  </div>
                </div>

                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Ir a Supabase.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Formulario de credenciales */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Conexión directa con tu Proyecto Supabase (Opcional)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Project URL (VITE_SUPABASE_URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://abcdefghijkl.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGuardarCredencialesSupabase}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    Guardar Credenciales
                  </button>

                  <button
                    type="button"
                    onClick={handleProbarConexion}
                    disabled={probando || !supabaseUrl || !supabaseKey}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {probando ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Probar Conexión
                  </button>
                </div>

                {resultadoPrueba && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    resultadoPrueba.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {resultadoPrueba.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{resultadoPrueba.mensaje}</span>
                  </div>
                )}
              </div>

              {/* Archivos incluidos en el proyecto */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                <h5 className="font-bold text-slate-800">Archivos Supabase preparados en el repositorio:</h5>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-700">
                  <li><span className="font-bold text-emerald-700">supabase/schema.sql</span>: Tablas DDL (empresas, insumos, recetas, menus, staff, proveedores, cotizaciones, reservas) con RLS.</li>
                  <li><span className="font-bold text-emerald-700">supabase/seed.sql</span>: Datos iniciales listos para poblar la base de datos de Dominga Eventos.</li>
                  <li><span className="font-bold text-emerald-700">src/lib/supabase.ts</span>: Conector nativo de TypeScript con fallback elegante.</li>
                </ul>
              </div>

            </div>
          )}

          {/* PESTAÑA 4: PRODUCCIÓN 24/7 (VERCEL) */}
          {tabActiva === 'produccion' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <Server className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold">Una vez subido a GitHub, publicarlo en Vercel toma 1 minuto:</span>
                  <br />
                  Vercel se conecta directamente a tu repositorio de GitHub. Cada vez que hagas un commit, tu sitio web se actualizará automáticamente sin necesidad de subir archivos manuales nunca más.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  3 Pasos para tu Dominio en Línea 24/7 sin caídas
                </h4>

                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900">Entrar a Vercel con tu GitHub</p>
                      <p className="text-slate-600">
                        Ve a <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">vercel.com</a> e inicia sesión con tu cuenta de GitHub. Haz clic en <strong>"Add New Project"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900">Seleccionar el Repositorio de SOLVI Flow</p>
                      <p className="text-slate-600">
                        Selecciona tu repositorio recién subido. Vercel detectará automáticamente que es un proyecto Vite + React. No necesitas configurar nada más.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900">Hacer Clic en Deploy</p>
                      <p className="text-slate-600">
                        En 35 segundos tendrás tu URL pública (ejemplo: <code>dominga-eventos.vercel.app</code>) funcionando 24/7, con certificado SSL gratis y disponible en todo el mundo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-slate-500"># Comando de compilación estándar verificado:</span>
                    <br />
                    <span className="text-emerald-400 font-bold">npm run build</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarTexto('npm run build', 'build-cmd')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copiadoComando === 'build-cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiadoComando === 'build-cmd' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Código limpio en Git rama main · Sin zips pesados ni historial mezclado.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
