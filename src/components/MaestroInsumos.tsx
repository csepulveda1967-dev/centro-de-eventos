import React, { useState } from 'react';
import { InsumoMaestro } from '../types';
import { formatMoneda } from '../utils/formatters';
import {
  Boxes,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  Building2
} from 'lucide-react';
import { obtenerContactoProveedor } from '../config/proveedoresContactos';

interface MaestroInsumosProps {
  insumos: InsumoMaestro[];
  onUpdateInsumo: (id: string, precioCompra: number, mermaPorcentaje: number) => void;
  onAddInsumo: (nuevoInsumo: InsumoMaestro) => void;
  onDeleteInsumo: (id: string) => void;
  onRestablecerInsumos: () => void;
}

export const MaestroInsumos: React.FC<MaestroInsumosProps> = ({
  insumos,
  onUpdateInsumo,
  onAddInsumo,
  onDeleteInsumo,
  onRestablecerInsumos
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [guardadoToast, setGuardadoToast] = useState(false);

  // Modal para nuevo insumo
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState<InsumoMaestro['categoria']>('carnes');
  const [nuevaUnidad, setNuevaUnidad] = useState<InsumoMaestro['unidadMedida']>('kg');
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(10000);
  const [nuevaMerma, setNuevaMerma] = useState<number>(5);
  const [nuevoProveedor, setNuevoProveedor] = useState('');

  const categorias = [
    { id: 'todas', label: 'Todas las Categorías' },
    { id: 'carnes', label: 'Carnes y Aves' },
    { id: 'pescados', label: 'Pescados y Mariscos' },
    { id: 'verduras_frutas', label: 'Frutas y Verduras' },
    { id: 'lacteos_huevos', label: 'Lácteos y Huevos' },
    { id: 'abarrotes', label: 'Abarrotes y Granos' },
    { id: 'licores_bebidas', label: 'Licores y Vinos' }
  ];

  const insumosFiltrados = insumos.filter(i => {
    const coincideTexto = i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (i.proveedor && i.proveedor.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideCat = categoriaFiltro === 'todas' || i.categoria === categoriaFiltro;
    return coincideTexto && coincideCat;
  });

  const handleCrearInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const nuevo: InsumoMaestro = {
      id: 'ins-' + Date.now(),
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
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

    setGuardadoToast(true);
    setTimeout(() => setGuardadoToast(false), 2500);
  };

  const handlePrecioChange = (id: string, nuevoValor: number, mermaActual: number) => {
    onUpdateInsumo(id, Math.max(0, nuevoValor), mermaActual);
    setGuardadoToast(true);
    setTimeout(() => setGuardadoToast(false), 2000);
  };

  const handleMermaChange = (id: string, nuevoPrecio: number, nuevaMerma: number) => {
    onUpdateInsumo(id, nuevoPrecio, Math.max(0, Math.min(90, nuevaMerma)));
    setGuardadoToast(true);
    setTimeout(() => setGuardadoToast(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {guardadoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Valor actualizado en el maestro y recetas vinculadas</span>
        </div>
      )}

      {/* Encabezado del Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest block">
              Gestión de Costos Base
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            Maestro de Insumos & Valores Reales de Compra
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingresa y actualiza los precios reales a los que compras tus materias primas. Toda receta y cotización se recalcula automáticamente con estos valores.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Explicación pedagógica para el administrador gastronómico */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/40 border border-blue-200/70 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed space-y-1">
          <p className="font-bold text-slate-900">
            ¿Cómo se conecta este maestro con tus cotizaciones?
          </p>
          <p>
            Cada insumo tiene su <strong>precio de compra</strong> y su <strong>factor de merma</strong> (la porción de grasa, hueso, cáscara o evaporación que se pierde al cocinar). Cuando actualizas el precio de un insumo (por ejemplo, si el kilo de filete sube a $18.000), la <strong>Calculadora de Recetas</strong> recalcula al segundo el costo de cada plato, y tu <strong>Cotizador</strong> muestra el costo real exacto del menú sin necesidad de fórmulas complejas.
          </p>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre de insumo o proveedor..."
            className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Selector de categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <div className="flex items-center gap-1">
            {categorias.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  categoriaFiltro === cat.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Insumo / Materia Prima</th>
                <th className="py-3 px-4">Categoría</th>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron insumos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((ins) => {
                  const factorRendimiento = 1 - ins.mermaPorcentaje / 100;
                  const costoConMerma = factorRendimiento > 0 ? ins.precioCompra / factorRendimiento : ins.precioCompra;

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ins.nombre}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4 text-slate-500 capitalize">
                        {ins.categoria.replace('_', ' ')}
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
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700">
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
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Mostrando {insumosFiltrados.length} de {insumos.length} insumos registrados</span>
          <span className="text-[11px] text-slate-400">Las modificaciones se guardan instantáneamente en tu navegador</span>
        </div>
      </div>

      {/* Modal para Crear Nuevo Insumo */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-blue-600" />
              Registrar Nuevo Insumo Maestro
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Agrega una nueva materia prima para utilizar en el costeo de recetas.
            </p>

            <form onSubmit={handleCrearInsumo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Salmón Ahumado en Láminas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value as InsumoMaestro['categoria'])}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="carnes">Carnes y Aves</option>
                    <option value="pescados">Pescados y Mariscos</option>
                    <option value="verduras_frutas">Frutas y Verduras</option>
                    <option value="lacteos_huevos">Lácteos y Huevos</option>
                    <option value="abarrotes">Abarrotes y Granos</option>
                    <option value="licores_bebidas">Licores y Vinos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad de Medida</label>
                  <select
                    value={nuevaUnidad}
                    onChange={(e) => setNuevaUnidad(e.target.value as InsumoMaestro['unidadMedida'])}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="unidad">Unidad (unidad)</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
