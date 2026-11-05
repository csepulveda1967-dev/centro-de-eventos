import React, { useState, useMemo } from 'react';
import { MenuOption, MenuItemRatio, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { formatMoneda } from '../utils/formatters';
import { ModalCrearMenu } from './ModalCrearMenu';
import { calcularCostoReceta } from '../config/insumosYRecetas';
import { construirMinutaConFichas } from '../utils/minutaHelper';
import {
  Utensils,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Plus,
  FolderPlus,
  Wine,
  Trash2,
  GlassWater,
  Coffee,
  ExternalLink,
  Tag,
  Pencil,
  Download
} from 'lucide-react';

interface Modulo1MenuProps {
  menus: MenuOption[];
  menuSeleccionadoId: string;
  onSelectMenu: (id: string) => void;
  invitados: number;
  onChangeInvitados: (num: number) => void;
  onIrARecetas?: (menuId: string) => void;
  onAddMenu?: (nuevoMenu: MenuOption) => void;
  onUpdateMenu?: (menuActualizado: MenuOption) => void;
  costoFijoPorPersona?: number;
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  recetas?: RecetaFichaTecnica[];
  insumos?: InsumoMaestro[];
}

// Catálogo rápido de bebestibles sugeridos para activar en 1 clic.
// Los costos son referenciales en CLP y se pueden ajustar después en la tabla.
const BEBESTIBLES_SUGERIDOS_PRESET: MenuItemRatio[] = [
  { id: 'beb-pre-gaseosa', nombre: 'Gaseosa (Coca / Sprite)', cantidadPorPersona: 0.5, unidad: 'L', costoUnitario: 1500 },
  { id: 'beb-pre-agua', nombre: 'Agua Mineral', cantidadPorPersona: 0.5, unidad: 'L', costoUnitario: 900 },
  { id: 'beb-pre-cerveza', nombre: 'Cerveza (lata 330cc)', cantidadPorPersona: 1, unidad: 'lata', costoUnitario: 1200 },
  { id: 'beb-pre-vinotinto', nombre: 'Vino Tinto (botella)', cantidadPorPersona: 0.4, unidad: 'botella', costoUnitario: 6000 },
  { id: 'beb-pre-vinoblanco', nombre: 'Vino Blanco (botella)', cantidadPorPersona: 0.3, unidad: 'botella', costoUnitario: 5500 },
  { id: 'beb-pre-pisco', nombre: 'Pisco / Coctelería (copa)', cantidadPorPersona: 2, unidad: 'copa', costoUnitario: 1500 },
  { id: 'beb-pre-champagne', nombre: 'Champagne (brindis)', cantidadPorPersona: 0.2, unidad: 'botella', costoUnitario: 8000 },
  { id: 'beb-pre-jugo', nombre: 'Jugo Natural (vaso)', cantidadPorPersona: 1, unidad: 'vaso', costoUnitario: 700 }
];

export const Modulo1Menu: React.FC<Modulo1MenuProps> = ({
  menus,
  menuSeleccionadoId,
  onSelectMenu,
  invitados,
  onChangeInvitados,
  onIrARecetas,
  onAddMenu,
  onUpdateMenu,
  costoFijoPorPersona = 0,
  bebestibles = [],
  onUpdateBebestibles,
  recetas = [],
  insumos = []
}) => {
  const [menuExpandido, setMenuExpandido] = useState<string | null>(menuSeleccionadoId);
  const [ocultarTiemposVacios, setOcultarTiemposVacios] = useState(true); // por defecto, oculta los tiempos sin contenido
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);
  const [menuAEditar, setMenuAEditar] = useState<MenuOption | null>(null);
  const [nuevoBebNombre, setNuevoBebNombre] = useState('');
  const [nuevoBebRatio, setNuevoBebRatio] = useState<number | string>(2);
  const [nuevoBebUnidad, setNuevoBebUnidad] = useState('lata / vaso');
  const [nuevoBebCosto, setNuevoBebCosto] = useState<number | string>(900);
  const [nuevoBebRecetaId, setNuevoBebRecetaId] = useState('');

  // Bebestibles definidos en la ficha del menú seleccionado (ítems marcados como bebestible)
  const menuActual = menus.find(m => m.id === menuSeleccionadoId) || menus[0];
  const bebsDelMenuActual = useMemo(() => {
    if (!menuActual) return [];
    if (menuActual.bebestiblesPorPersona && menuActual.bebestiblesPorPersona.length > 0) {
      return menuActual.bebestiblesPorPersona;
    }
    return (menuActual.itemsPorPersona || []).filter(
      it => it.categoria === 'bebestible' || it.categoria === 'cocteleria'
    );
  }, [menuActual]);

  // Carga (reemplaza) la lista de bebestibles del cotizador con la ficha del menú
  const handleCargarBebestiblesDelMenu = () => {
    if (!onUpdateBebestibles || bebsDelMenuActual.length === 0) return;
    const nuevos: MenuItemRatio[] = bebsDelMenuActual.map((it, idx) => ({
      ...it,
      id: 'beb-menu-' + Date.now() + '-' + idx,
      incluido: true
    }));
    onUpdateBebestibles(nuevos);
  };

  const costoTotalMenu = (menuActual?.costoPersona || 0) * invitados;
  const precioVentaTotalMenu = (menuActual?.precioSugeridoPersona || 0) * invitados;

  const presetsInvitados = [40, 60, 80, 100, 120, 150, 180, 200];

  const handleInvitadosInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onChangeInvitados(val);
    } else if (e.target.value === '') {
      onChangeInvitados(0);
    }
  };

  // Bebestibles con cálculo de costo dinámico (insumo maestro / receta técnica / libre)
  const bebestiblesConCostoDinamico = useMemo(() => {
    return bebestibles.map(it => {
      let costoUnitarioReal = it.costoUnitario || 0;
      let detalleOrigen = 'Opción Libre';
      let tagColor = 'bg-amber-100 text-amber-800 border-amber-200';
      let iconoTipo = 'libre';

      if (it.insumoId) {
        const ins = insumos.find(i => i.id === it.insumoId);
        if (ins) {
          costoUnitarioReal = ins.precioCompra;
          detalleOrigen = `Insumo (${ins.proveedor || 'Sin proveedor'})`;
          tagColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          iconoTipo = 'insumo';
        }
      } else if (it.recetaId) {
        const rec = recetas.find(r => r.id === it.recetaId);
        if (rec) {
          const calc = calcularCostoReceta(rec, insumos);
          costoUnitarioReal = calc.costoPorPorcion;
          detalleOrigen = `Ficha Técnica (${rec.tiempoMenu || 'coctel'})`;
          tagColor = 'bg-purple-100 text-purple-800 border-purple-200';
          iconoTipo = 'receta';
        }
      }

      const ratio = Number(it.cantidadPorPersona) || 0;
      const subtotalPP = ratio * costoUnitarioReal;
      const totalCompra = Math.round(ratio * invitados * 10) / 10;
      const totalEvento = subtotalPP * invitados;

      return {
        ...it,
        costoReal: costoUnitarioReal,
        detalleOrigen,
        tagColor,
        iconoTipo,
        subtotalPP,
        totalCompra,
        totalEvento
      };
    });
  }, [bebestibles, insumos, recetas, invitados]);

  const costoTotalBebestiblesPorPersona = useMemo(() => {
    return bebestiblesConCostoDinamico
      .filter(it => it.incluido !== false)
      .reduce((acc, b) => acc + b.subtotalPP, 0);
  }, [bebestiblesConCostoDinamico]);

  const costoTotalBebestiblesEvento = costoTotalBebestiblesPorPersona * invitados;

  // Presets Rápidos Vinculados Dinámicamente a Insumos y Recetas
  const presetsDinamicos = useMemo(() => {
    const lista: Array<{
      id: string;
      nombre: string;
      cantidadPorPersona: number;
      unidad: string;
      costoUnitario: number;
      tipoOrigen: 'insumo' | 'receta';
      insumoId?: string;
      recetaId?: string;
      subtitulo: string;
      iconoTipo: 'vino' | 'cerveza' | 'gaseosa' | 'coctel';
    }> = [];

    // Vino
    const vinoInsumo = insumos.find(i => i.id === 'ins-vino-reserva-tinto') || insumos.find(i => (i.categoria || '').includes('licor') || i.nombre.toLowerCase().includes('vino'));
    if (vinoInsumo) {
      lista.push({
        id: 'beb-preset-vino',
        nombre: vinoInsumo.nombre,
        cantidadPorPersona: 0.5,
        unidad: 'botella',
        costoUnitario: vinoInsumo.precioCompra,
        tipoOrigen: 'insumo',
        insumoId: vinoInsumo.id,
        subtitulo: `Insumo: ${formatMoneda(vinoInsumo.precioCompra)}`,
        iconoTipo: 'vino'
      });
    }

    // Cerveza
    const cervezaInsumo = insumos.find(i => i.id === 'ins-cerveza-lager') || insumos.find(i => i.nombre.toLowerCase().includes('cerveza'));
    if (cervezaInsumo) {
      lista.push({
        id: 'beb-preset-cerveza',
        nombre: cervezaInsumo.nombre,
        cantidadPorPersona: 2,
        unidad: 'botella',
        costoUnitario: cervezaInsumo.precioCompra,
        tipoOrigen: 'insumo',
        insumoId: cervezaInsumo.id,
        subtitulo: `Insumo: ${formatMoneda(cervezaInsumo.precioCompra)}`,
        iconoTipo: 'cerveza'
      });
    }

    // Gaseosas
    const gaseosaInsumo = insumos.find(i => i.id === 'ins-gaseosa-15') || insumos.find(i => i.nombre.toLowerCase().includes('gaseosa') || i.nombre.toLowerCase().includes('bebida'));
    if (gaseosaInsumo) {
      lista.push({
        id: 'beb-preset-gaseosa',
        nombre: gaseosaInsumo.nombre,
        cantidadPorPersona: 0.8,
        unidad: 'botella',
        costoUnitario: gaseosaInsumo.precioCompra,
        tipoOrigen: 'insumo',
        insumoId: gaseosaInsumo.id,
        subtitulo: `Insumo: ${formatMoneda(gaseosaInsumo.precioCompra)}`,
        iconoTipo: 'gaseosa'
      });
    }

    // Pisco Sour
    const piscoReceta = recetas.find(r => r.id === 'rec-pisco-sour-catedral') || recetas.find(r => r.nombre.toLowerCase().includes('pisco'));
    if (piscoReceta) {
      const calc = calcularCostoReceta(piscoReceta, insumos);
      lista.push({
        id: 'beb-preset-pisco',
        nombre: piscoReceta.nombre,
        cantidadPorPersona: 2,
        unidad: 'trago',
        costoUnitario: calc.costoPorPorcion,
        tipoOrigen: 'receta',
        recetaId: piscoReceta.id,
        subtitulo: `Ficha: ${formatMoneda(calc.costoPorPorcion)}/porc.`,
        iconoTipo: 'coctel'
      });
    }

    // Mojito
    const mojitoReceta = recetas.find(r => r.id === 'rec-mojito-cubano') || recetas.find(r => r.nombre.toLowerCase().includes('mojito'));
    if (mojitoReceta) {
      const calc = calcularCostoReceta(mojitoReceta, insumos);
      lista.push({
        id: 'beb-preset-mojito',
        nombre: mojitoReceta.nombre,
        cantidadPorPersona: 2,
        unidad: 'trago',
        costoUnitario: calc.costoPorPorcion,
        tipoOrigen: 'receta',
        recetaId: mojitoReceta.id,
        subtitulo: `Ficha: ${formatMoneda(calc.costoPorPorcion)}/porc.`,
        iconoTipo: 'coctel'
      });
    }

    // Aperol Spritz
    const aperolReceta = recetas.find(r => r.id === 'rec-aperol-spritz') || recetas.find(r => r.nombre.toLowerCase().includes('aperol'));
    if (aperolReceta) {
      const calc = calcularCostoReceta(aperolReceta, insumos);
      lista.push({
        id: 'beb-preset-aperol',
        nombre: aperolReceta.nombre,
        cantidadPorPersona: 1.5,
        unidad: 'copa',
        costoUnitario: calc.costoPorPorcion,
        tipoOrigen: 'receta',
        recetaId: aperolReceta.id,
        subtitulo: `Ficha: ${formatMoneda(calc.costoPorPorcion)}/porc.`,
        iconoTipo: 'coctel'
      });
    }

    return lista;
  }, [insumos, recetas]);

  // Manejadores de Bebestibles por Persona (p.p.)
  const handleTogglePresetDinamico = (preset: typeof presetsDinamicos[0]) => {
    if (!onUpdateBebestibles) return;
    const existente = bebestibles.find(b =>
      (preset.insumoId && b.insumoId === preset.insumoId) ||
      (preset.recetaId && b.recetaId === preset.recetaId) ||
      b.nombre.toLowerCase().includes(preset.nombre.toLowerCase().slice(0, 10))
    );

    if (existente) {
      onUpdateBebestibles(
        bebestibles.map(b => b.id === existente.id ? { ...b, incluido: b.incluido === false ? true : false } : b)
      );
    } else {
      const nuevo: MenuItemRatio = {
        id: 'beb-' + Date.now(),
        nombre: preset.nombre,
        cantidadPorPersona: preset.cantidadPorPersona,
        unidad: preset.unidad,
        costoUnitario: preset.costoUnitario,
        insumoId: preset.insumoId,
        recetaId: preset.recetaId,
        tipoOrigen: preset.tipoOrigen,
        categoria: 'bebestible',
        incluido: true
      };
      onUpdateBebestibles([...bebestibles, nuevo]);
    }
  };

  const handleToggleBebestible = (id: string) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(
      bebestibles.map(b => b.id === id ? { ...b, incluido: b.incluido === false ? true : false } : b)
    );
  };

  // Activa o desactiva un bebestible sugerido del catálogo rápido (por nombre)
  const handleToggleBebestibleSugerido = (preset: MenuItemRatio) => {
    if (!onUpdateBebestibles) return;
    const clave = preset.nombre.toLowerCase().slice(0, 10);
    const yaEsta = bebestibles.some(it => it.nombre.toLowerCase().includes(clave));
    if (yaEsta) {
      // Ya está en la lista: lo quitamos
      onUpdateBebestibles(bebestibles.filter(it => !it.nombre.toLowerCase().includes(clave)));
    } else {
      // No está: lo agregamos. Si el menú tiene ese bebestible en su ficha,
      // se usan los valores del menú (vinculado); si no, los referenciales.
      const delMenu = bebsDelMenuActual.find(it => it.nombre.toLowerCase().includes(clave));
      const fuente = delMenu || preset;
      const nuevo: MenuItemRatio = {
        ...fuente,
        id: 'beb-preset-' + Date.now(),
        incluido: true,
        tipoOrigen: delMenu ? (delMenu.tipoOrigen || 'libre') : 'libre',
        categoria: 'bebestible'
      };
      onUpdateBebestibles([...bebestibles, nuevo]);
    }
  };

  const handleUpdateCantidadBeb = (id: string, cant: number) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(
      bebestibles.map(b => b.id === id ? { ...b, cantidadPorPersona: Math.max(0, cant) } : b)
    );
  };

  const handleRemoveBeb = (id: string) => {
    if (!onUpdateBebestibles) return;
    onUpdateBebestibles(bebestibles.filter(b => b.id !== id));
  };

  const handleAddCustomBeb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBebestibles) return;
    const recetaElegida = recetas.find(r => r.id === nuevoBebRecetaId);
    const nombreFinal = recetaElegida ? recetaElegida.nombre : nuevoBebNombre.trim();
    if (!nombreFinal) return;
    const cantNum = typeof nuevoBebRatio === 'number' ? nuevoBebRatio : parseFloat(String(nuevoBebRatio).replace(',', '.')) || 1;
    const costoBase = typeof nuevoBebCosto === 'number' ? nuevoBebCosto : parseFloat(String(nuevoBebCosto).replace(',', '.')) || 0;
    // Si viene de una receta, el costo real se calcula dinámicamente desde la ficha técnica
    const costoNum = recetaElegida ? calcularCostoReceta(recetaElegida, insumos).costoPorPorcion : costoBase;
    const nuevo: MenuItemRatio = {
      id: 'beb-cust-' + Date.now(),
      nombre: nombreFinal,
      cantidadPorPersona: Math.max(0.01, cantNum),
      unidad: nuevoBebUnidad,
      costoUnitario: Math.max(0, costoNum),
      categoria: 'bebestible',
      tipoOrigen: recetaElegida ? 'receta' : 'libre',
      recetaId: recetaElegida ? recetaElegida.id : undefined,
      recetaNombre: recetaElegida ? recetaElegida.nombre : undefined,
      incluido: true
    };
    onUpdateBebestibles([...bebestibles, nuevo]);
    setNuevoBebNombre('');
    setNuevoBebRatio(2);
    setNuevoBebCosto(900);
    setNuevoBebRecetaId('');
  };

  // Al elegir una receta para el bebestible personalizado, nombre y costo se llenan solos
  const handleSeleccionarRecetaBeb = (recetaId: string) => {
    setNuevoBebRecetaId(recetaId);
    if (!recetaId) return;
    const receta = recetas.find(r => r.id === recetaId);
    if (!receta) return;
    const { costoPorPorcion } = calcularCostoReceta(receta, insumos);
    setNuevoBebNombre(receta.nombre);
    setNuevoBebUnidad('copa');
    if (costoPorPorcion > 0) setNuevoBebCosto(Math.round(costoPorPorcion));
  };

  return (
    <div className="space-y-6">
      {/* TARJETA 01: PROPUESTA GASTRONÓMICA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs transition-all">
        {/* Encabezado del Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                Propuesta Gastronómica & Comensales
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona el formato de menú e ingresa la cantidad de invitados para calcular costos automáticos.
              </p>
            </div>
          </div>

          {/* Resumen en vivo del módulo */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl px-4 py-2 text-right shrink-0">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Costo Insumos Menú
            </div>
            <div className="text-lg font-extrabold text-amber-950 tabular-nums">
              {formatMoneda(costoTotalMenu)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              {invitados} invitados × {formatMoneda(menuActual?.costoPersona || 0)}/pax
            </div>
          </div>
        </div>

        {/* Control de Invitados */}
        <div className="my-6 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Número de Invitados / Comensales Confirmados
              </label>
              <p className="text-xs text-slate-500">
                Este número alimenta automáticamente las porciones de comida, vajilla y cálculo de garzones recomendados.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => onChangeInvitados(Math.max(10, invitados - 10))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Restar 10 invitados"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => onChangeInvitados(Math.max(1, invitados - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Restar 1 invitado"
              >
                -1
              </button>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={1500}
                  value={invitados === 0 ? '' : invitados}
                  onChange={handleInvitadosInputChange}
                  className="w-24 h-10 px-2 text-center text-xl font-extrabold text-slate-900 bg-white border-2 border-amber-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 tabular-nums shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => onChangeInvitados(invitados + 1)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Sumar 1 invitado"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onChangeInvitados(invitados + 10)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
                title="Sumar 10 invitados"
              >
                +10
              </button>
            </div>
          </div>

          {/* Presets Rápidos */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Rápidos:</span>
            {presetsInvitados.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeInvitados(preset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  invitados === preset
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset} pax
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Menús */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Formatos de Banquete Disponibles ({menus.length} opciones)
            </span>
            {onAddMenu && (
              <button
                type="button"
                onClick={() => {
                  setMenuAEditar(null);
                  setModalNuevoMenuOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>+ Crear Menú Gastronómico</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menus.map((menu) => {
              const isSelected = menu.id === menuSeleccionadoId;
              const isExpanded = menuExpandido === menu.id;

              return (
                <div
                  key={menu.id}
                  onClick={() => onSelectMenu(menu.id)}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                            {menu.categoria}
                          </span>
                          {menu.destacado && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Recomendado
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                          {menu.nombre}
                        </h3>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-amber-600 text-white shadow-xs' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {menu.descripcion}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Costo Insumos</span>
                        <strong className="text-slate-800 font-bold tabular-nums">
                          {formatMoneda(menu.costoPersona)}/pax
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Precio Venta Sugerido</span>
                        <strong className="text-amber-900 font-extrabold text-sm tabular-nums">
                          {formatMoneda(menu.precioSugeridoPersona)}/pax
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuExpandido(isExpanded ? null : menu.id);
                      }}
                      className="mt-3 w-full py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Ocultar minuta detallada' : 'Ver minuta de los 5 tiempos'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {onUpdateMenu && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAEditar(menu);
                          setModalNuevoMenuOpen(true);
                        }}
                        className="mt-1.5 w-full py-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Editar nombre, descripción, tiempos, ítems p.p. y costos de este menú"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>✏️ Editar este menú</span>
                      </button>
                    )}

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs space-y-2 bg-slate-50/70 -mx-4 -mb-4 p-4 rounded-b-xl">
                        {/* Toggle: ocultar/mostrar tiempos vacíos */}
                        <div className="flex items-center justify-end mb-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOcultarTiemposVacios(!ocultarTiemposVacios);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                              ocultarTiemposVacios
                                ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                            title="Ocultar/mostrar los tiempos que no tienen contenido en este menú"
                          >
                            {ocultarTiemposVacios ? '🔲 Tiempos vacíos ocultos · Mostrar' : '✓ Mostrando todos los tiempos · Ocultar vacíos'}
                          </button>
                        </div>

                        {/* Minuta con tiempos + fichas vinculadas */}
                        {(() => {
                          const tiempos = construirMinutaConFichas(menu, recetas, insumos);
                          // Filtrar: si el usuario ocultó manualmente el tiempo → NO se muestra nunca
                          // Si no lo ocultó manualmente y tiene contenido → se muestra
                          // Si "ocultarTiemposVacios" está ON → los sin contenido tampoco se muestran
                          const visibles = tiempos
                            .filter(t => !t.ocultoManual)
                            .filter(t => !ocultarTiemposVacios || t.tieneContenido);

                          if (visibles.length === 0) {
                            const ocultosManual = tiempos.filter(t => t.ocultoManual);
                            return (
                              <div className="text-center text-slate-400 py-3 italic">
                                {ocultosManual.length > 0 ? (
                                  <>
                                    Este menú tiene {ocultosManual.length} tiempo(s) oculto(s) manualmente
                                    ({ocultosManual.map(t => t.tiempoLabel).join(', ')}).{ocultarTiemposVacios ? '' : ' Los demás tiempos están vacíos.'}
                                  </>
                                ) : (
                                  <>Este menú no tiene tiempos cargados todavía. Agrega fichas desde la Calculadora de Recetas o escribe los platos en "Editar este menú".</>
                                )}
                              </div>
                            );
                          }

                          return visibles.map(t => {
                            const fichasConCosto = t.fichas.map(f => ({
                              ficha: f,
                              costo: calcularCostoReceta(f, insumos).costoPorPorcion
                            }));
                            // Detectar duplicación: si el texto manual = nombre de la(s) ficha(s)
                            const textoNorm = t.textoManual.trim().toLowerCase();
                            const fichasIguales = fichasConCosto.filter(fc => fc.ficha.nombre.trim().toLowerCase() === textoNorm);
                            const fichasDiferentes = fichasConCosto.filter(fc => fc.ficha.nombre.trim().toLowerCase() !== textoNorm);

                            return (
                              <div key={t.tiempoId}>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-700">{t.tiempoLabel}:</span>
                                  {t.textoManual && fichasIguales.length > 0 && fichasDiferentes.length === 0 ? (
                                    // Caso: el texto coincide con la ficha → mostrar UNA sola vez con su costo, sin etiqueta 📋 Ficha
                                    <>
                                      <span className="text-slate-600">{t.textoManual}</span>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-emerald-700 font-bold tabular-nums text-[11px]">{formatMoneda(fichasIguales[0].costo)}/pax</span>
                                    </>
                                  ) : t.textoManual ? (
                                    <span className="text-slate-600">{t.textoManual}</span>
                                  ) : fichasConCosto.length === 0 ? (
                                    <span className="text-slate-300 italic text-[11px]">(no incluido en este menú)</span>
                                  ) : null}
                                </div>
                                {/* Solo mostrar las fichas distintas al texto manual (si hay) */}
                                {fichasDiferentes.length > 0 && (
                                  <div className="ml-4 mt-1 space-y-0.5">
                                    {fichasDiferentes.map(({ ficha, costo }) => (
                                      <div key={ficha.id} className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                          📋 Ficha
                                        </span>
                                        <span className="text-slate-800 font-semibold">{ficha.nombre}</span>
                                        <span className="text-slate-400">·</span>
                                        <span className="text-emerald-700 font-bold tabular-nums text-[11px]">{formatMoneda(costo)}/pax</span>
                                        {ficha.tiempoMenu === 'cocteleria' && (
                                          <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">🍸 Trago</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}

                        {/* Consumos por persona (p.p.) */}
                        {menu.itemsPorPersona && menu.itemsPorPersona.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-200 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                              📦 Consumos por Persona & Compras Exactas ({invitados} Pax):
                            </span>
                            <div className="space-y-1">
                              {menu.itemsPorPersona.map((it) => {
                                const totalCompra = Math.round(it.cantidadPorPersona * invitados * 10) / 10;
                                return (
                                  <div key={it.id} className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-amber-200/70">
                                    <span className="font-semibold text-slate-800">
                                      • {it.nombre}: <strong className="text-amber-800">{it.cantidadPorPersona} pp</strong> ({it.unidad})
                                    </span>
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] tabular-nums">
                                      Total: {totalCompra} {it.unidad}s
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {onIrARecetas && (
                          <div className="pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onIrARecetas(menu.id);
                              }}
                              className="w-full py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold rounded-lg text-center transition-colors cursor-pointer"
                            >
                              Costear platos de este menú en la Calculadora de Recetas →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TARJETA 01.B: SERVICIO DE BEBESTIBLES & BARRA POR PERSONA (P.P.)
          Requerimiento: Incluir bebestibles y considerarlos por persona (pp)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              <Wine className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                  Consumos Exactos p.p.
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Servicio de Bebestibles, Vinos & Barra por Persona
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Calcula cuántas bebidas, copas de vino o tragos consume cada invitado ({invitados} Pax) para costeo y compras exactas.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-right shrink-0">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Costo Bebestibles ({invitados} Pax)
            </span>
            <div className="text-lg font-black text-purple-950 tabular-nums">
              {formatMoneda(costoTotalBebestiblesEvento)}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              {formatMoneda(costoTotalBebestiblesPorPersona)} /comensal
            </span>
          </div>
        </div>

        {/* Presets Rápidos de Bebestibles para Activar en 1 Clic */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catálogo Rápido: Activar o desactivar servicios de bebestibles
            </span>
            {onUpdateBebestibles && bebsDelMenuActual.length > 0 && (
              <button
                type="button"
                onClick={handleCargarBebestiblesDelMenu}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg border border-purple-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                title={`Reemplaza la lista de abajo con los ${bebsDelMenuActual.length} bebestibles definidos en la ficha del menú "${menuActual?.nombre || ''}"`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cargar los {bebsDelMenuActual.length} bebestibles del menú "{(menuActual?.nombre || '').slice(0, 22)}"</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            💡 Tip: los valores de estos botones son referenciales. Para usar los valores reales, márcalos como "bebestible" en la ficha del menú y pulsa "Cargar bebestibles del menú", o edita la cantidad y costo en la tabla de abajo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {BEBESTIBLES_SUGERIDOS_PRESET.map((b) => {
              const estaActivo = bebestibles.some(it => it.nombre.toLowerCase().includes(b.nombre.toLowerCase().slice(0, 10)));
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleToggleBebestibleSugerido(b)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    estaActivo
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-1 ring-purple-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs leading-tight pr-2">
                    <strong className="block text-[11px] font-bold truncate">{b.nombre}</strong>
                    <span className={estaActivo ? 'text-purple-200 text-[10px]' : 'text-slate-500 text-[10px]'}>
                      {b.cantidadPorPersona} {b.unidad} pp · {formatMoneda(b.costoUnitario || 0)} c/u
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    estaActivo ? 'bg-white text-purple-700' : 'border border-slate-300'
                  }`}>
                    {estaActivo && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de Bebestibles Configurados Activos */}
        {bebestibles.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bebestible / Líquido</th>
                  <th className="py-2.5 px-3 text-center">Ratio p.p. (Entero o Decimal)</th>
                  <th className="py-2.5 px-3 text-center">Total a Comprar ({invitados} Pax)</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal p.p.</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bebestiblesConCostoDinamico.map((item) => {
                  const totalCompra = Math.round(item.cantidadPorPersona * invitados * 10) / 10;

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.nombre}
                        {item.iconoTipo === 'receta' && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md align-middle whitespace-nowrap">
                            🍸 Desde receta
                          </span>
                        )}
                        {item.iconoTipo === 'insumo' && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md align-middle whitespace-nowrap">
                            📦 Desde insumo
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1 font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-300">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.cantidadPorPersona}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value.replace(',', '.'));
                              handleUpdateCantidadBeb(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-14 text-center bg-white font-black text-slate-900 rounded border border-slate-300 py-0.5 focus:outline-hidden text-xs"
                            title="Ingresa número entero (1, 2, 3) o decimal (0.5, 1.5)"
                          />
                          <span className="text-[10px] text-slate-600 font-medium">pp ({item.unidad})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800 tabular-nums">
                        {totalCompra} {item.unidad}s
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatMoneda(item.costoReal || 0)}
                        {item.iconoTipo !== 'libre' && item.costoReal !== (item.costoUnitario || 0) && (
                          <span className="block text-[9px] text-slate-400 line-through">{formatMoneda(item.costoUnitario || 0)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatMoneda(item.subtotalPP)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBeb(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Eliminar bebestible"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-slate-700 text-right">
                    Total Bebestibles por Persona:
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-purple-950 tabular-nums text-sm">
                    {formatMoneda(costoTotalBebestiblesPorPersona)}/pax
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
            No has incluido bebestibles por persona aún. Haz clic en cualquiera de las opciones rápidas de arriba para agregarlos con sus compras exactas calculadas.
          </div>
        )}

        {/* Formulario para añadir bebestible personalizado */}
        <form onSubmit={handleAddCustomBeb} className="p-3 bg-purple-50/40 border border-purple-200/80 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-purple-950 block">
            + Añadir Otro Bebestible o Barra Personalizada por Persona (p.p.)
          </span>
          {recetas.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-purple-800 mb-1">
                🍸 Trago con receta (cocteles, pisco sour, mojito...) — el costo sale solo de la ficha técnica
              </label>
              <select
                value={nuevoBebRecetaId}
                onChange={(e) => handleSeleccionarRecetaBeb(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-slate-800 focus:outline-hidden text-xs font-semibold"
              >
                <option value="">— Bebestible libre (ingresar nombre y costo a mano) —</option>
                {recetas.map((receta) => {
                  const { costoPorPorcion } = calcularCostoReceta(receta, insumos);
                  return (
                    <option key={receta.id} value={receta.id}>
                      {receta.nombre} · {formatMoneda(costoPorPorcion)} por porción
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={nuevoBebNombre}
                onChange={(e) => setNuevoBebNombre(e.target.value)}
                placeholder="Nombre del líquido (ej: Mojito Cubano, Pisco Sour, Agua Mineral...)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                step="any"
                value={nuevoBebRatio}
                onChange={(e) => setNuevoBebRatio(e.target.value)}
                placeholder="Ratio pp (ej: 2)"
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                title="Cantidad por comensal (admite enteros y decimales)"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={nuevoBebUnidad}
                onChange={(e) => setNuevoBebUnidad(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
              >
                <option value="lata / vaso">lata / vaso</option>
                <option value="copa">copa</option>
                <option value="botella">botella</option>
                <option value="vaso">vaso</option>
                <option value="taza">taza</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                step="any"
                value={nuevoBebCosto}
                onChange={(e) => setNuevoBebCosto(e.target.value)}
                placeholder="Costo unit."
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:outline-hidden tabular-nums"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-2xs h-[34px]"
                title="Agregar bebestible"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal para Crear Nuevo Menú directamente desde el Módulo 1 */}
      {onAddMenu && (
        <ModalCrearMenu
          isOpen={modalNuevoMenuOpen}
          onClose={() => {
            setModalNuevoMenuOpen(false);
            setMenuAEditar(null);
          }}
          menuAEditar={menuAEditar}
          onGuardarMenu={(menuGuardado) => {
            if (menuAEditar && onUpdateMenu) {
              onUpdateMenu(menuGuardado);
            } else {
              onAddMenu(menuGuardado);
              onSelectMenu(menuGuardado.id);
            }
            setMenuExpandido(menuGuardado.id);
            setMenuAEditar(null);
          }}
          recetasDisponibles={recetas}
          insumosDisponibles={insumos}
          invitadosReferencia={invitados}
        />
      )}
    </div>
  );
};


