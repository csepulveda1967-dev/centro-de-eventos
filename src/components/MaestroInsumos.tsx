import React, { useState, useMemo, useEffect } from 'react';
import { InsumoMaestro } from '../types';
import { formatMoneda } from '../utils/formatters';
import {
  Boxes,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Filter,
  Building2,
  Tag,
  FolderPlus,
  Check,
  X,
  Edit2
} from 'lucide-react';
import { obtenerContactoProveedor } from '../config/proveedoresContactos';
import {
  CATEGORIAS_INSUMOS_DEFAULT,
  formatearNombreCategoria,
  obtenerColorCategoria
} from '../config/insumosYRecetas';

interface MaestroInsumosProps {
  insumos: InsumoMaestro[];
  onUpdateInsumo: (
    id: string,
    precioCompra: number,
    mermaPorcentaje: number,
    categoria?: string,
    nombre?: string,
    proveedor?: string
  ) => void;
  onAddInsumo: (nuevoInsumo: InsumoMaestro) => void;
  onDeleteInsumo: (id: string) => void;
  onRestablecerInsumos: () => void;
}

const STORAGE_CATEGORIAS_KEY = 'hlr_categorias_personalizadas_insumos';

export const MaestroInsumos: React.FC<MaestroInsumosProps> = ({
  insumos,
  onUpdateInsumo,
  onAddInsumo,
  onDeleteInsumo,
  onRestablecerInsumos
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Categorías personalizadas creadas libremente por el usuario
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATEGORIAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal para crear nueva categoría en forma libre
  const [modalNuevaCatOpen, setModalNuevaCatOpen] = useState(false);
  const [textoNuevaCat, setTextoNuevaCat] = useState('');

  // Modal para nuevo insumo
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('carnes');
  const [esCategoriaNuevaLibre, setEsCategoriaNuevaLibre] = useState(false);
  const [categoriaLibreInput, setCategoriaLibreInput] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState<InsumoMaestro['unidadMedida']>('kg');
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(10000);
  const [nuevaMerma, setNuevaMerma] = useState<number>(5);
  const [nuevoProveedor, setNuevoProveedor] = useState('');

  // Edición rápida de categoría por fila
  const [filaEditandoCatId, setFilaEditandoCatId] = useState<string | null>(null);

  // Guardar categorías personalizadas en localStorage
  const guardarCategoriasPersonalizadas = (nuevas: string[]) => {
    setCategoriasPersonalizadas(nuevas);
    try {
      localStorage.setItem(STORAGE_CATEGORIAS_KEY, JSON.stringify(nuevas));
    } catch (e) {
      console.error('Error guardando categorías en localStorage:', e);
    }
  };

  // Consolidar todas las categorías (predeterminadas + personalizadas + las que existan en los insumos)
  const todasLasCategorias = useMemo(() => {
    const lista: { id: string; label: string; count: number; esPersonalizada: boolean }[] = [];
    const setIds = new Set<string>();

    // 1. Predeterminadas
    for (const def of CATEGORIAS_INSUMOS_DEFAULT) {
      setIds.add(def.id.toLowerCase());
      const count = insumos.filter(i => (i.categoria || '').toLowerCase() === def.id.toLowerCase()).length;
      lista.push({ id: def.id, label: def.label, count, esPersonalizada: false });
    }

    // 2. Personalizadas guardadas
    for (const catPers of categoriasPersonalizadas) {
      const catTrim = catPers.trim();
      const slug = catTrim.toLowerCase().replace(/\s+/g, '_');
      if (!setIds.has(slug) && !setIds.has(catTrim.toLowerCase())) {
        setIds.add(slug);
        const count = insumos.filter(i => {
          const c = (i.categoria || '').toLowerCase();
          return c === slug || c === catTrim.toLowerCase();
        }).length;
        lista.push({ id: slug, label: catTrim, count, esPersonalizada: true });
      }
    }

    // 3. Categorías existentes en los insumos (por ejemplo restauradas de Supabase o SQL)
    for (const ins of insumos) {
      if (ins.categoria) {
        const catTrim = ins.categoria.trim();
        const slug = catTrim.toLowerCase().replace(/\s+/g, '_');
        if (!setIds.has(slug) && !setIds.has(catTrim.toLowerCase())) {
          setIds.add(slug);
          const count = insumos.filter(i => (i.categoria || '').toLowerCase() === catTrim.toLowerCase()).length;
          lista.push({
            id: ins.categoria,
            label: formatearNombreCategoria(ins.categoria),
            count,
            esPersonalizada: true
          });
        }
      }
    }

    return lista;
  }, [insumos, categoriasPersonalizadas]);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 2500);
  };

  // Crear categoría en forma libre desde el modal de categorías
  const handleCrearCategoriaLibre = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = textoNuevaCat.trim();
    if (!nombreLimpio) return;

    const slug = nombreLimpio.toLowerCase().replace(/\s+/g, '_');
    const yaExiste = todasLasCategorias.some(c => c.id.toLowerCase() === slug || c.label.toLowerCase() === nombreLimpio.toLowerCase());

    if (yaExiste) {
      mostrarToast(`La categoría "${nombreLimpio}" ya existe.`);
      setModalNuevaCatOpen(false);
      setTextoNuevaCat('');
      return;
    }

    const actualizadas = [...categoriasPersonalizadas, nombreLimpio];
    guardarCategoriasPersonalizadas(actualizadas);
    setCategoriaFiltro(slug);
    setModalNuevaCatOpen(false);
    setTextoNuevaCat('');
    mostrarToast(`✓ Nueva categoría "${nombreLimpio}" agregada y vinculada a la Ficha de Receta`);
  };

  // Eliminar una categoría personalizada que no tenga insumos
  const handleEliminarCategoriaPersonalizada = (catId: string, label: string) => {
    const tieneInsumos = insumos.some(i => (i.categoria || '').toLowerCase() === catId.toLowerCase());
    if (tieneInsumos) {
      alert(`No puedes eliminar la categoría "${label}" porque contiene insumos asignados. Reasigna o elimina los insumos primero.`);
      return;
    }

    if (window.confirm(`¿Deseas eliminar la categoría personalizada "${label}"?`)) {
      const actualizadas = categoriasPersonalizadas.filter(
        c => c.trim().toLowerCase() !== label.trim().toLowerCase() && c.toLowerCase().replace(/\s+/g, '_') !== catId.toLowerCase()
      );
      guardarCategoriasPersonalizadas(actualizadas);
      if (categoriaFiltro === catId) {
        setCategoriaFiltro('todas');
      }
      mostrarToast(`Categoría "${label}" eliminada`);
    }
  };

  // Filtrado de insumos
  const insumosFiltrados = insumos.filter(i => {
    const coincideTexto = i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (i.proveedor && i.proveedor.toLowerCase().includes(busqueda.toLowerCase())) ||
      (i.categoria && formatearNombreCategoria(i.categoria).toLowerCase().includes(busqueda.toLowerCase()));

    const catActual = (i.categoria || '').toLowerCase().replace(/\s+/g, '_');
    const catFiltroNorm = categoriaFiltro.toLowerCase().replace(/\s+/g, '_');
    const coincideCat = categoriaFiltro === 'todas' || catActual === catFiltroNorm || (i.categoria || '').toLowerCase() === categoriaFiltro.toLowerCase();

    return coincideTexto && coincideCat;
  });

  // Guardar nuevo insumo con opción de categoría libre
  const handleCrearInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    let categoriaFinal = nuevaCategoria;

    // Si el usuario eligió escribir una categoría libre
    if (esCategoriaNuevaLibre && categoriaLibreInput.trim()) {
      const catLibreNombre = categoriaLibreInput.trim();
      const slug = catLibreNombre.toLowerCase().replace(/\s+/g, '_');
      categoriaFinal = slug;

      // Guardar también en la lista de categorías personalizadas
      if (!categoriasPersonalizadas.some(c => c.toLowerCase() === catLibreNombre.toLowerCase())) {
        const actualizadas = [...categoriasPersonalizadas, catLibreNombre];
        guardarCategoriasPersonalizadas(actualizadas);
      }
    }

    const nuevo: InsumoMaestro = {
      id: 'ins-' + Date.now(),
      nombre: nuevoNombre.trim(),
      categoria: categoriaFinal,
      unidadMedida: nuevaUnidad,
      precioCompra: Math.max(0, nuevoPrecio),
      mermaPorcentaje: Math.max(0, Math.min(90, nuevaMerma)),
      proveedor: nuevoProveedor.trim() || 'Proveedor Local',
      ultimoCambio: new Date().toISOString().slice(0, 10)
    };

    onAddInsumo(nuevo);
    setModalNuevoOpen(false);
    setNuevoNombre('');
    setNuevoPrecio(10000);
    setNuevaMerma(5);
    setNuevoProveedor('');
    setEsCategoriaNuevaLibre(false);
    setCategoriaLibreInput('');

    mostrarToast(`✓ Insumo "${nuevo.nombre}" guardado en categoría "${formatearNombreCategoria(categoriaFinal)}"`);
  };

  const handlePrecioChange = (id: string, nuevoValor: number, mermaActual: number) => {
    onUpdateInsumo(id, Math.max(0, nuevoValor), mermaActual);
    mostrarToast('✓ Valor actualizado en maestro y recetas vinculadas');
  };

  const handleMermaChange = (id: string, nuevoPrecio: number, nuevaMerma: number) => {
    onUpdateInsumo(id, nuevoPrecio, Math.max(0, Math.min(90, nuevaMerma)));
    mostrarToast('✓ Merma actualizada en maestro y recetas');
  };

  const handleCambiarCategoriaInsumo = (insumoId: string, nuevaCat: string) => {
    const ins = insumos.find(i => i.id === insumoId);
    if (!ins) return;
    onUpdateInsumo(ins.id, ins.precioCompra, ins.mermaPorcentaje, nuevaCat);
    setFilaEditandoCatId(null);
    mostrarToast(`✓ Categoría actualizada a "${formatearNombreCategoria(nuevaCat)}"`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {toastMensaje && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Encabezado del Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest block">
              Gestión de Costos Base & Categorización Libre
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            Maestro de Insumos & Valores Reales de Compra
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea categorías libremente y define tus materias primas con precios reales. Todo queda 100% vinculado a la <strong>Ficha de Receta</strong> y compatible con Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setModalNuevaCatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            title="Crear una nueva categoría en forma libre"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <span>+ Nueva Categoría</span>
          </button>

          <button
            type="button"
            onClick={onRestablecerInsumos}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Restablecer precios iniciales de insumos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Valores Base
          </button>

          <button
            type="button"
            onClick={() => setModalNuevoOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Banner Explicativo de Vinculación */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/70 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed space-y-1">
          <p className="font-bold text-slate-900 flex items-center gap-2">
            <span>¿Cómo se vinculan las categorías con la Ficha de Receta y Supabase?</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
              Sincronización Total
            </span>
          </p>
          <p>
            Cualquier categoría que crees aquí (ej. <em>"Embutidos Gourmet"</em>, <em>"Frutos Secos"</em> o <em>"Insumos Premium"</em>) queda inmediatamente disponible como filtro y etiqueta en la <strong>Calculadora de Recetas</strong>. Podrás ver el desglose exacto de Food Cost por categoría en cada plato y se almacena en Supabase en la columna de texto de insumos sin requerir cambios en el esquema.
          </p>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda con Categorías Dinámicas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, proveedor o categoría..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>{todasLasCategorias.length} categorías activas</span>
          </div>
        </div>

        {/* Selector de categoría dinámico con badges y soporte libre */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          
          {/* Botón Todas */}
          <button
            type="button"
            onClick={() => setCategoriaFiltro('todas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              categoriaFiltro === 'todas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <span>Todas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoriaFiltro === 'todas' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {insumos.length}
            </span>
          </button>

          {/* Categorías (Predeterminadas y Creadas Libremente) */}
          {todasLasCategorias.map(cat => {
            const isSelected = categoriaFiltro === cat.id;
            const color = obtenerColorCategoria(cat.id);

            return (
              <div key={cat.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setCategoriaFiltro(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : color.text.replace('text-', 'bg-')}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>

                {/* Si es personalizada y no tiene insumos, permitir eliminar con icono discreto */}
                {cat.esPersonalizada && cat.count === 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarCategoriaPersonalizada(cat.id, cat.label);
                    }}
                    title="Eliminar categoría vacía"
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shadow-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Botón rápido "+ Categoría" */}
          <button
            type="button"
            onClick={() => setModalNuevaCatOpen(true)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 flex items-center gap-1 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Categoría</span>
          </button>
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Insumo / Materia Prima</th>
                <th className="py-3 px-4">Categoría Vinculada</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-center">Unidad Base</th>
                <th className="py-3 px-4 text-right">Precio Compra ($)</th>
                <th className="py-3 px-4 text-center">Merma Est. (%)</th>
                <th className="py-3 px-4 text-right">Costo Real C/Merma</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {insumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron insumos en esta categoría.</p>
                    <p className="text-xs text-slate-400 mt-1">Crea un insumo nuevo o cambia el filtro de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((ins) => {
                  const factorRendimiento = 1 - ins.mermaPorcentaje / 100;
                  const costoConMerma = factorRendimiento > 0 ? ins.precioCompra / factorRendimiento : ins.precioCompra;
                  const estiloColor = obtenerColorCategoria(ins.categoria);
                  const estaEditandoCat = filaEditandoCatId === ins.id;

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ins.nombre}
                      </td>

                      {/* Categoría editable directamente */}
                      <td className="py-3 px-4">
                        {estaEditandoCat ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={ins.categoria}
                              onChange={(e) => handleCambiarCategoriaInsumo(ins.id, e.target.value)}
                              className="text-xs px-2 py-1 bg-white border border-blue-400 rounded-lg font-medium focus:outline-hidden"
                              autoFocus
                            >
                              {todasLasCategorias.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setFilaEditandoCatId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="Cerrar edición"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/cat">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${estiloColor.badge}`}>
                              {formatearNombreCategoria(ins.categoria)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFilaEditandoCatId(ins.id)}
                              className="opacity-0 group-hover/cat:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                              title="Cambiar categoría de este insumo"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Proveedor */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{ins.proveedor || 'Mercado Central'}</span>
                        </div>
                        {ins.proveedor && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            📞 {obtenerContactoProveedor(ins.proveedor).telefonoPedidos}
                          </div>
                        )}
                      </td>

                      {/* Unidad */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700 font-bold">
                          {ins.unidadMedida}
                        </span>
                      </td>

                      {/* Precio de Compra Editable */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={ins.precioCompra}
                            onChange={(e) => handlePrecioChange(ins.id, Number(e.target.value) || 0, ins.mermaPorcentaje)}
                            className="w-24 text-right font-extrabold text-slate-900 bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-lg px-2 py-1 tabular-nums focus:outline-hidden"
                          />
                        </div>
                      </td>

                      {/* Merma Editable */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={90}
                            value={ins.mermaPorcentaje}
                            onChange={(e) => handleMermaChange(ins.id, ins.precioCompra, Number(e.target.value) || 0)}
                            className="w-14 text-center font-bold text-slate-700 bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-lg px-1.5 py-1 tabular-nums focus:outline-hidden text-xs"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>

                      {/* Costo Real con Merma */}
                      <td className="py-3 px-4 text-right font-bold text-blue-900 tabular-nums">
                        {formatMoneda(costoConMerma)}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          por {ins.unidadMedida} neto
                        </span>
                      </td>

                      {/* Eliminar */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Deseas eliminar el insumo "${ins.nombre}"?`)) {
                              onDeleteInsumo(ins.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen al pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mostrando {insumosFiltrados.length} de {insumos.length} materias primas</span>
          <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-blue-600" />
            Todas las categorías y precios se actualizan en las recetas de inmediato
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: AGREGAR CATEGORÍA EN FORMA LIBRE
      ───────────────────────────────────────────────────────────── */}
      {modalNuevaCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                Nueva Categoría en Forma Libre
              </h2>
              <button
                type="button"
                onClick={() => setModalNuevaCatOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Define libremente una nueva categoría de insumos (ej: <em>"Chocolates & Coberturas"</em>, <em>"Frutos Secos"</em>, <em>"Embalajes & Desechables"</em>, <em>"Cortes Premium"</em>). Quedará vinculada automáticamente a la <strong>Ficha de Receta</strong> y a Supabase.
            </p>

            <form onSubmit={handleCrearCategoriaLibre} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={textoNuevaCat}
                  onChange={(e) => setTextoNuevaCat(e.target.value)}
                  placeholder="Ej: Embutidos Artesanales"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium text-sm"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 space-y-1">
                <p className="font-bold">✓ Vinculación garantizada:</p>
                <p>Esta categoría aparecerá al registrar insumos, en los filtros del maestro y en el desglose de costos de la <strong>Calculadora de Recetas</strong>.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaCatOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Crear y Vincular Categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CREAR NUEVO INSUMO
      ───────────────────────────────────────────────────────────── */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Registrar Nuevo Insumo Maestro
              </h2>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Agrega una materia prima para costear platos en la Ficha de Receta.
            </p>

            <form onSubmit={handleCrearInsumo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Salmón Ahumado en Láminas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Categoría con soporte de creación libre */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setEsCategoriaNuevaLibre(!esCategoriaNuevaLibre)}
                    className="text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    {esCategoriaNuevaLibre ? '← Elegir de la lista' : '+ Nueva categoría libre'}
                  </button>
                </div>

                {esCategoriaNuevaLibre ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={categoriaLibreInput}
                      onChange={(e) => setCategoriaLibreInput(e.target.value)}
                      placeholder="Escribe el nombre de la nueva categoría..."
                      className="w-full px-3 py-2 border border-blue-400 bg-blue-50/30 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Se creará esta categoría y quedará disponible para todas tus recetas.
                    </span>
                  </div>
                ) : (
                  <select
                    value={nuevaCategoria}
                    onChange={(e) => {
                      if (e.target.value === '__NUEVA__') {
                        setEsCategoriaNuevaLibre(true);
                      } else {
                        setNuevaCategoria(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden bg-white font-medium"
                  >
                    {todasLasCategorias.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label} {c.esPersonalizada ? '★ (Personalizada)' : ''}
                      </option>
                    ))}
                    <option value="__NUEVA__">+ Escribir nueva categoría libre...</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad de Medida</label>
                  <select
                    value={nuevaUnidad}
                    onChange={(e) => setNuevaUnidad(e.target.value as InsumoMaestro['unidadMedida'])}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="unidad">Unidad (unidad)</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Compra ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merma Estimada (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={nuevaMerma}
                    onChange={(e) => setNuevaMerma(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold tabular-nums"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0% a 90%</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor / Distribuidor</label>
                  <input
                    type="text"
                    value={nuevoProveedor}
                    onChange={(e) => setNuevoProveedor(e.target.value)}
                    placeholder="Ej: Distribuidora Lo Valledor"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Insumo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
