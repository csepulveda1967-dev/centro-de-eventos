import React, { useState, useMemo } from 'react';
import { CotizacionState, MenuOption, RecetaFichaTecnica, InsumoMaestro, EmpresaCliente } from '../types';
import {
  calcularExplosionInsumos,
  generarMensajePedidoProveedor,
  generarCSVExplosionCompras,
  ItemExplosionCompra
} from '../utils/explosionCompras';
import {
  PROVEEDORES_INSUMOS_INICIALES,
  obtenerContactoProveedor
} from '../config/proveedoresContactos';
import { formatMoneda } from '../utils/formatters';
import {
  ShoppingCart,
  ChefHat,
  Filter,
  Download,
  Printer,
  MessageCircle,
  Truck,
  Layers,
  Scale,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Building,
  CreditCard,
  BookOpen
} from 'lucide-react';

interface ModuloExplosionInsumosProps {
  cotizacion: CotizacionState;
  menus: MenuOption[];
  recetas: RecetaFichaTecnica[];
  insumos: InsumoMaestro[];
  empresaActiva: EmpresaCliente;
}

export const ModuloExplosionInsumos: React.FC<ModuloExplosionInsumosProps> = ({
  cotizacion,
  menus,
  recetas,
  insumos,
  empresaActiva
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [mostrarDirectorio, setMostrarDirectorio] = useState(false);

  // Estado para el modal de orden a proveedor individual
  const [proveedorSeleccionadoParaPedido, setProveedorSeleccionadoParaPedido] = useState<string | null>(null);
  const [telefonoProveedorManual, setTelefonoProveedorManual] = useState<string>('');
  const [copiadoPedido, setCopiadoPedido] = useState(false);

  const menuActual = menus.find(m => m.id === cotizacion.menuId) || menus[0];

  // Cálculo del resumen de insumos
  const resumenInsumos = useMemo(() => {
    return calcularExplosionInsumos(cotizacion, menus, recetas, insumos);
  }, [cotizacion, menus, recetas, insumos]);

  // Filtrado de ítems
  const itemsFiltrados = useMemo(() => {
    return resumenInsumos.items.filter(item => {
      const matchCat = categoriaFiltro === 'todas' || item.categoria === categoriaFiltro;
      const matchProv = proveedorFiltro === 'todos' || item.proveedor === proveedorFiltro;
      const matchTexto = busqueda.trim() === '' || 
        item.insumoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.proveedor.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchProv && matchTexto;
    });
  }, [resumenInsumos, categoriaFiltro, proveedorFiltro, busqueda]);

  const costoFiltrado = itemsFiltrados.reduce((s, it) => s + it.costoTotalCompra, 0);

  // Descarga CSV para Excel
  const handleDescargarCSV = () => {
    const csvContent = generarCSVExplosionCompras(
      resumenInsumos.items,
      cotizacion.nombreEvento,
      cotizacion.invitados
    );
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resumen_compras_cocina_${cotizacion.nombreEvento.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Preparar pedido para proveedor
  const itemsDelProveedorSeleccionado = useMemo(() => {
    if (!proveedorSeleccionadoParaPedido) return [];
    return resumenInsumos.itemsPorProveedor[proveedorSeleccionadoParaPedido] || [];
  }, [proveedorSeleccionadoParaPedido, resumenInsumos]);

  // Contacto oficial del proveedor seleccionado
  const contactoProveedorSeleccionado = useMemo(() => {
    if (!proveedorSeleccionadoParaPedido) return null;
    return obtenerContactoProveedor(proveedorSeleccionadoParaPedido);
  }, [proveedorSeleccionadoParaPedido]);

  const mensajeWhatsAppProveedor = useMemo(() => {
    if (!proveedorSeleccionadoParaPedido) return '';
    return generarMensajePedidoProveedor(
      proveedorSeleccionadoParaPedido,
      itemsDelProveedorSeleccionado,
      cotizacion.nombreEvento,
      cotizacion.invitados,
      cotizacion.fechaEvento,
      empresaActiva.nombre
    );
  }, [proveedorSeleccionadoParaPedido, itemsDelProveedorSeleccionado, cotizacion, empresaActiva]);

  const handleAbrirPedidoProveedor = (nombreProv: string) => {
    setProveedorSeleccionadoParaPedido(nombreProv);
    const contacto = obtenerContactoProveedor(nombreProv);
    setTelefonoProveedorManual(contacto.telefonoPedidos || '');
    setCopiadoPedido(false);
  };

  const handleCopiarPedido = async () => {
    try {
      await navigator.clipboard.writeText(mensajeWhatsAppProveedor);
      setCopiadoPedido(true);
      setTimeout(() => setCopiadoPedido(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = mensajeWhatsAppProveedor;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiadoPedido(true);
      setTimeout(() => setCopiadoPedido(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Métricas de Cocina */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-900 text-xs font-bold mb-2">
              <ChefHat className="w-3.5 h-3.5" />
              <span>Resumen Gastronómico de Insumos & Compras</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Resumen de Compras de Materia Prima para Cocina
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Calcula con precisión milimétrica los kilos brutos requeridos considerando la merma de cada ingrediente para{' '}
              <strong className="text-slate-900">{cotizacion.invitados} comensales</strong> con el menú{' '}
              <strong className="text-amber-800">&ldquo;{menuActual.nombre}&rdquo;</strong>.
            </p>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={() => setMostrarDirectorio(!mostrarDirectorio)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 border ${
                mostrarDirectorio 
                  ? 'bg-amber-600 text-white border-amber-600' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Ver datos de contacto, teléfonos y horarios de despacho de proveedores"
            >
              <BookOpen className="w-4 h-4" />
              <span>{mostrarDirectorio ? 'Ocultar Contactos' : 'Directorio de Proveedores'}</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              title="Descargar planilla para Microsoft Excel o Google Sheets"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs"
              title="Imprimir hoja para el Chef y Bodeguero"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir Resumen</span>
            </button>
          </div>
        </div>

        {/* 4 Tarjetas de Métricas Clave */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
              <span>Costo Total Insumos</span>
              <ShoppingCart className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1 tabular-nums">
              {formatMoneda(resumenInsumos.costoTotalInsumos)}
            </div>
            <span className="text-[11px] text-amber-800/80 mt-0.5 block">
              {formatMoneda(resumenInsumos.costoTotalInsumos / Math.max(1, cotizacion.invitados))} / comensal
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70">
            <div className="flex items-center justify-between text-rose-900 text-xs font-semibold">
              <span>Carnes Brutas a Comprar</span>
              <Scale className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1 tabular-nums">
              {resumenInsumos.totalKilosCarnes} kg
            </div>
            <span className="text-[11px] text-rose-800/80 mt-0.5 block">
              Vacuno, cerdo, cordero y pollo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
              <span>Verduras & La Vega</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 tabular-nums">
              {resumenInsumos.totalKilosVerduras} kg
            </div>
            <span className="text-[11px] text-emerald-800/80 mt-0.5 block">
              Hortalizas y vegetales frescos
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70">
            <div className="flex items-center justify-between text-blue-900 text-xs font-semibold">
              <span>Proveedores a Despachar</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-950 mt-1 tabular-nums">
              {resumenInsumos.proveedoresUnicos.length} Distribuidores
            </div>
            <span className="text-[11px] text-blue-800/80 mt-0.5 block">
              Con datos de pedidos listos
            </span>
          </div>
        </div>

      </div>

      {/* SECCIÓN EXPANDIBLE: DIRECTORIO OFICIAL DE CONTACTO DE PROVEEDORES */}
      {mostrarDirectorio && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Agenda Comercial Dominga Eventos
              </span>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Directorio Oficial de Proveedores & Contacto de Pedidos</span>
              </h3>
              <p className="text-xs text-slate-300">
                Teléfonos directos, ejecutivos de cuenta, horarios de corte y direcciones de despacho de insumos para este evento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarDirectorio(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              Cerrar Directorio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {PROVEEDORES_INSUMOS_INICIALES.map((prov) => {
              const telLimpio = prov.telefonoPedidos.replace(/\D/g, '');
              const esParteDelEvento = resumenInsumos.proveedoresUnicos.includes(prov.nombre);

              return (
                <div
                  key={prov.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    esParteDelEvento
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{prov.nombre}</span>
                        {esParteDelEvento && (
                          <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                            REQUERIDO
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-amber-300 font-medium block">
                        {prov.categoriaPrincipal}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-white truncate">
                        {prov.contactoNombre}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono">{prov.telefonoPedidos}</span>
                      </div>
                      <a
                        href={`https://wa.me/${telLimpio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#25D366] hover:bg-[#20ba59] text-white px-2 py-0.5 rounded-lg"
                        title="Abrir chat de WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 fill-white" />
                        <span>Chat</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <a
                        href={`mailto:${prov.emailPedidos}`}
                        className="text-blue-300 hover:underline truncate"
                      >
                        {prov.emailPedidos}
                      </a>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{prov.horarioCortePedido}</span>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span className="truncate">{prov.direccion}</span>
                    </div>
                  </div>

                  {esParteDelEvento && (
                    <button
                      type="button"
                      onClick={() => handleAbrirPedidoProveedor(prov.nombre)}
                      className="mt-3 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Generar Pedido del Evento</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acceso Rápido: Botones de Pedido por WhatsApp a Proveedores */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white no-print shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              <span>Enviar Pedido Directo a Proveedores por WhatsApp</span>
            </h3>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Haz clic en cualquier proveedor para ver sus datos de contacto y generar su orden de compra con cantidades exactas y mermas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-4">
          {resumenInsumos.proveedoresUnicos.map((prov) => {
            const itemsProv = resumenInsumos.itemsPorProveedor[prov] || [];
            const subtotalProv = itemsProv.reduce((s, it) => s + it.costoTotalCompra, 0);
            const contacto = obtenerContactoProveedor(prov);

            return (
              <button
                key={prov}
                type="button"
                onClick={() => handleAbrirPedidoProveedor(prov)}
                className="group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-emerald-600 active:scale-95 border border-white/15 text-xs font-semibold transition-all cursor-pointer"
                title={`Coordinar con ${contacto.contactoNombre} (${contacto.telefonoPedidos})`}
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                <span>{prov}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold tabular-nums">
                  {itemsProv.length} ítems · {formatMoneda(subtotalProv)}
                </span>
                <span className="text-[10px] text-emerald-300 group-hover:text-white">
                  📞 {contacto.telefonoPedidos}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Búsqueda */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar insumo o proveedor..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>

          {/* Filtro Categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="todas">Todas las categorías</option>
            <option value="carnes">Carnes y Aves</option>
            <option value="pescados">Pescados y Mariscos</option>
            <option value="verduras_frutas">Verduras y Frutas</option>
            <option value="lacteos_huevos">Lácteos y Huevos</option>
            <option value="abarrotes">Abarrotes</option>
            <option value="licores_bebidas">Licores y Bebidas</option>
            <option value="panaderia_pasteleria">Panadería y Pastelería</option>
          </select>

          {/* Filtro Proveedor */}
          <select
            value={proveedorFiltro}
            onChange={(e) => setProveedorFiltro(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="todos">Todos los proveedores</option>
            {resumenInsumos.proveedoresUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 shrink-0">
          Mostrando <strong className="text-slate-900">{itemsFiltrados.length}</strong> insumos · Subtotal:{' '}
          <strong className="text-amber-900 font-bold">{formatMoneda(costoFiltrado)}</strong>
        </div>
      </div>

      {/* Tabla Detallada de Insumos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Insumo Requerido</th>
                <th className="py-3.5 px-3">Categoría</th>
                <th className="py-3.5 px-3">Proveedor & Contacto</th>
                <th className="py-3.5 px-3 text-right">Cant. Neta</th>
                <th className="py-3.5 px-3 text-right">Merma (%)</th>
                <th className="py-3.5 px-3 text-right bg-amber-50/60 text-amber-950 font-extrabold">A Comprar (Bruto)</th>
                <th className="py-3.5 px-3 text-right">Precio Ref.</th>
                <th className="py-3.5 px-4 text-right bg-slate-100/60 font-black">Subtotal CLP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.map((item) => {
                const contacto = obtenerContactoProveedor(item.proveedor);

                return (
                  <tr key={item.insumoId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.insumoNombre}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Recetas: {item.recetasDondeAparece.join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {item.categoria.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.proveedor}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span>📞 {contacto.telefonoPedidos}</span>
                        <span>·</span>
                        <span className="truncate max-w-[140px]">{contacto.contactoNombre.split('(')[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                      {item.cantidadNetaTotal} {item.unidadMedida}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-rose-600 font-bold">
                      +{item.mermaPromedio}%
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-black text-amber-900 bg-amber-50/30 text-sm">
                      {item.cantidadBrutaAComprar} {item.unidadMedida}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                      {formatMoneda(item.precioUnitarioCompra)} / {item.unidadMedida}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 bg-slate-50/40 text-sm">
                      {formatMoneda(item.costoTotalCompra)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td colSpan={5} className="py-4 px-4 text-right uppercase tracking-wider">
                  Total Resumen de Insumos ({cotizacion.invitados} pax):
                </td>
                <td colSpan={3} className="py-4 px-4 text-right text-base text-amber-400 tabular-nums font-black">
                  {formatMoneda(resumenInsumos.costoTotalInsumos)} CLP
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal / Popup de Pedido de WhatsApp al Proveedor con Datos de Contacto */}
      {proveedorSeleccionadoParaPedido && contactoProveedorSeleccionado && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 fill-white text-emerald-800" />
                <h3 className="font-bold text-sm">
                  Orden de Pedido: {proveedorSeleccionadoParaPedido}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProveedorSeleccionadoParaPedido(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Ficha Completa del Proveedor de Contacto */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{contactoProveedorSeleccionado.nombre}</h4>
                  <p className="text-[11px] text-emerald-700 font-semibold">{contactoProveedorSeleccionado.categoriaPrincipal}</p>
                </div>
                {contactoProveedorSeleccionado.rut && (
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                    RUT {contactoProveedorSeleccionado.rut}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate"><strong>Contacto:</strong> {contactoProveedorSeleccionado.contactoNombre}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Teléfono:</strong> {contactoProveedorSeleccionado.telefonoPedidos}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <a href={`mailto:${contactoProveedorSeleccionado.emailPedidos}`} className="text-blue-600 hover:underline truncate">
                    {contactoProveedorSeleccionado.emailPedidos}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate"><strong>Corte:</strong> {contactoProveedorSeleccionado.horarioCortePedido}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="truncate">{contactoProveedorSeleccionado.direccion}</span>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Número de WhatsApp de Despacho (detectado del directorio):
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={telefonoProveedorManual}
                    onChange={(e) => setTelefonoProveedorManual(e.target.value)}
                    placeholder="Ej: +56 9 1234 5678"
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setTelefonoProveedorManual(contactoProveedorSeleccionado.telefonoPedidos)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200"
                    title="Restablecer al número oficial del directorio"
                  >
                    Restablecer
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Vista Previa del Pedido Formateado:
                </label>
                <div className="bg-[#ECE5DD] p-3.5 rounded-xl border border-[#DAD3CC] text-slate-800 font-sans whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed text-[11px]">
                  {mensajeWhatsAppProveedor}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarPedido}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
                >
                  {copiadoPedido ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">¡Copiado!</span>
                    </>
                  ) : (
                    <span>Copiar Texto</span>
                  )}
                </button>

                <a
                  href={`mailto:${contactoProveedorSeleccionado.emailPedidos}?subject=${encodeURIComponent(`Orden de Insumos - ${empresaActiva.nombre} - ${cotizacion.nombreEvento}`)}&body=${encodeURIComponent(mensajeWhatsAppProveedor)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Enviar por Correo</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProveedorSeleccionadoParaPedido(null)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 font-medium text-xs"
                >
                  Cerrar
                </button>

                <a
                  href={`https://wa.me/${telefonoProveedorManual.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWhatsAppProveedor)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Abrir WhatsApp y Enviar</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
