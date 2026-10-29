import React, { useState, useEffect, useRef } from 'react';
import { MenuOption, StaffTarifas, ProveedorServicio, EstiloDecoracion, RecetaFichaTecnica } from '../types';
import { formatMoneda } from '../utils/formatters';
import {
  Settings,
  RotateCcw,
  Utensils,
  Users2,
  Users,
  Truck,
  Palette,
  HelpCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ListTree,
  AlertTriangle,
  ArrowDownRight,
  Layers,
  RefreshCw,
  Coffee,
  Disc,
  Flower2,
  Wine,
  Camera,
  Sparkles,
  Zap,
  UtensilsCrossed
} from 'lucide-react';

export interface DesgloseItem {
  id: string;
  concepto: string;
  cantidad: number;
  valorUnitario: number;
  escalaConPax?: boolean; // True si la cantidad hereda del número de invitados del cotizador
  multiplicadorPax?: number; // Factor por comensal (ej: 2 tapaditos/pax, 3 pasteles/pax)
  esManual?: boolean;     // True si el usuario sobreescribió manualmente este valor
}

export const DESGLOSES_INICIALES: Record<string, DesgloseItem[]> = {
  'coffee-break-cocteleria': [
    { id: 'cb-1', concepto: 'Café en grano / Té variado', cantidad: 100, valorUnitario: 1200, escalaConPax: true, multiplicadorPax: 1 },
    { id: 'cb-2', concepto: 'Tapaditos ave pimentón (2 un/pax)', cantidad: 200, valorUnitario: 850, escalaConPax: true, multiplicadorPax: 2 },
    { id: 'cb-3', concepto: 'Mini pastelería fina (3 un/pax)', cantidad: 300, valorUnitario: 600, escalaConPax: true, multiplicadorPax: 3 },
    { id: 'cb-4', concepto: 'Jugo natural / Bebidas', cantidad: 100, valorUnitario: 950, escalaConPax: true, multiplicadorPax: 1 }
  ],
  'vajilla-cristaleria': [
    { id: 'v-1', concepto: 'Plato base', cantidad: 100, valorUnitario: 1100, escalaConPax: true },
    { id: 'v-2', concepto: 'Plato de fondo', cantidad: 100, valorUnitario: 1000, escalaConPax: true },
    { id: 'v-3', concepto: 'Copa vino', cantidad: 100, valorUnitario: 650, escalaConPax: true },
    { id: 'v-4', concepto: 'Copa espumante', cantidad: 100, valorUnitario: 550, escalaConPax: true },
    { id: 'v-5', concepto: 'Cubiertos', cantidad: 100, valorUnitario: 450, escalaConPax: true },
    { id: 'v-6', concepto: 'Servilleta + anillo', cantidad: 100, valorUnitario: 150, escalaConPax: true }
  ],
  'dj-musica-iluminacion': [
    { id: 'dj-1', concepto: 'DJ profesional & operador técnico jornada completa', cantidad: 1, valorUnitario: 200000, escalaConPax: false },
    { id: 'dj-2', concepto: 'Sistema de audio Line-Array distribuido (jardín y salón)', cantidad: 1, valorUnitario: 180000, escalaConPax: false },
    { id: 'dj-3', concepto: 'Cabezas robóticas LED & consola DMX', cantidad: 1, valorUnitario: 90000, escalaConPax: false },
    { id: 'dj-4', concepto: 'Micrófonos inalámbricos y cableado estructurado', cantidad: 1, valorUnitario: 50000, escalaConPax: false }
  ],
  'flores-centros-mesa': [
    { id: 'fl-1', concepto: 'Arreglo floral arco y pérgola de ceremonia', cantidad: 1, valorUnitario: 180000, escalaConPax: false },
    { id: 'fl-2', concepto: 'Centros de mesa con flores de estación', cantidad: 10, valorUnitario: 16000, escalaConPax: false },
    { id: 'fl-3', concepto: 'Caminos de eucalipto fresco y follaje natural', cantidad: 1, valorUnitario: 50000, escalaConPax: false },
    { id: 'fl-4', concepto: 'Ramos de recepción y prendedor novio', cantidad: 1, valorUnitario: 30000, escalaConPax: false }
  ],
  'barra-libre-premium': [
    { id: 'bar-1', concepto: 'Destilados premium (Gin, Vodka, Whisky, Pisco)', cantidad: 100, valorUnitario: 6500, escalaConPax: true },
    { id: 'bar-2', concepto: 'Coctelería de autor, pulpas y macerados caseros', cantidad: 100, valorUnitario: 3500, escalaConPax: true },
    { id: 'bar-3', concepto: 'Hielo en cubos y hielo esfera purificado', cantidad: 100, valorUnitario: 1500, escalaConPax: true },
    { id: 'bar-4', concepto: 'Bartenders especialistas & cristalería bar', cantidad: 100, valorUnitario: 2000, escalaConPax: true }
  ],
  'fotografia-cinematografia': [
    { id: 'foto-1', concepto: 'Fotógrafo principal jornada completa', cantidad: 1, valorUnitario: 260000, escalaConPax: false },
    { id: 'foto-2', concepto: 'Segundo fotógrafo / asistente de cámara', cantidad: 1, valorUnitario: 150000, escalaConPax: false },
    { id: 'foto-3', concepto: 'Piloto de dron y tomas aéreas viñedos 4K', cantidad: 1, valorUnitario: 90000, escalaConPax: false },
    { id: 'foto-4', concepto: 'Edición, colorización y entrega de galería HD', cantidad: 1, valorUnitario: 80000, escalaConPax: false }
  ],
  'pista-baile-led': [
    { id: 'pis-1', concepto: 'Módulos de pista iluminada microled', cantidad: 1, valorUnitario: 220000, escalaConPax: false },
    { id: 'pis-2', concepto: 'Cielo estrellado con microguirnaldas aéreas', cantidad: 1, valorUnitario: 110000, escalaConPax: false },
    { id: 'pis-3', concepto: 'Estructura truss perimetral y montaje certificado', cantidad: 1, valorUnitario: 60000, escalaConPax: false }
  ],
  'generador-respaldo': [
    { id: 'gen-1', concepto: 'Arriendo generador insonorizado 120 kVA', cantidad: 1, valorUnitario: 150000, escalaConPax: false },
    { id: 'gen-2', concepto: 'Combustible diésel jornada completa y flete', cantidad: 1, valorUnitario: 50000, escalaConPax: false },
    { id: 'gen-3', concepto: 'Tablero de transferencia automática y técnico guardia', cantidad: 1, valorUnitario: 40000, escalaConPax: false }
  ]
};

const STORAGE_KEY_DESGLOSE = 'hlr_tarifas_desglose_servicios';

interface CatalogoTarifasModalProps {
  menus: MenuOption[];
  tarifasStaff: StaffTarifas;
  proveedores: ProveedorServicio[];
  estilosDecoracion: EstiloDecoracion[];
  recetas?: RecetaFichaTecnica[];
  invitados?: number;
  onChangeInvitados?: (num: number) => void;
  onUpdateMenuCost: (menuId: string, nuevoCosto: number, nuevoPrecioSugerido: number) => void;
  onUpdateStaffTarifas: (nuevasTarifas: StaffTarifas) => void;
  onUpdateProveedorCost: (proveedorId: string, nuevoCosto: number, nuevoPrecioVenta: number) => void;
  onUpdateDecoracionCost: (estiloId: string, nuevoCosto: number, nuevoPrecioVenta: number) => void;
  onRestablecerDefecto: () => void;
}

export const CatalogoTarifasModal: React.FC<CatalogoTarifasModalProps> = ({
  menus,
  tarifasStaff,
  proveedores,
  estilosDecoracion,
  recetas,
  invitados = 100,
  onChangeInvitados,
  onUpdateMenuCost,
  onUpdateStaffTarifas,
  onUpdateProveedorCost,
  onUpdateDecoracionCost,
  onRestablecerDefecto
}) => {
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  // Mapeo visual de iconos para proveedores
  const renderProveedorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-800" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5 text-amber-700" />;
      case 'Disc':
        return <Disc className="w-5 h-5 text-indigo-600" />;
      case 'Flower2':
        return <Flower2 className="w-5 h-5 text-rose-600" />;
      case 'Wine':
        return <Wine className="w-5 h-5 text-red-700" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-emerald-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-600" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      default:
        return <Truck className="w-5 h-5 text-slate-600" />;
    }
  };

  // Inicialización de desgloses con sincronización de pax
  const [desgloses, setDesgloses] = useState<Record<string, DesgloseItem[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DESGLOSE);
    let baseData: Record<string, DesgloseItem[]> = { ...DESGLOSES_INICIALES };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        baseData = { ...DESGLOSES_INICIALES, ...parsed };
        // Si el usuario tenía guardados los 7 servicios anteriores, inyectar el desglose de Coffee Break
        if (!parsed['coffee-break-cocteleria']) {
          baseData['coffee-break-cocteleria'] = DESGLOSES_INICIALES['coffee-break-cocteleria'];
        }
      } catch (e) {
        console.error('Error parseando desgloses de servicios:', e);
      }
    }

    // Inicializar vinculando al número de pax actual si no tiene sobreescritura manual
    const synced: Record<string, DesgloseItem[]> = {};
    for (const [key, items] of Object.entries(baseData)) {
      const prov = proveedores.find(p => p.id === key);
      const esPorPax = prov?.tipoCobro === 'por_persona';
      synced[key] = items.map(it => {
        const escala = it.escalaConPax !== undefined ? it.escalaConPax : esPorPax;
        const mult = it.multiplicadorPax || 1;
        return {
          ...it,
          escalaConPax: escala,
          multiplicadorPax: mult,
          cantidad: (escala && !it.esManual) ? invitados * mult : it.cantidad
        };
      });
    }
    return synced;
  });

  // Guardar en localStorage ante cualquier cambio
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DESGLOSE, JSON.stringify(desgloses));
  }, [desgloses]);

  // ════════════════════════════════════════════════════════════════════════
  // REGLA 1 & REGLA 3: VINCULACIÓN Y RE-VINCULACIÓN REACTIVA AL CAMBIAR DE PAX
  // ════════════════════════════════════════════════════════════════════════
  const prevPaxRef = useRef<number>(invitados);

  useEffect(() => {
    if (prevPaxRef.current !== invitados) {
      // Si el usuario cambia el pax rápido en el cotizador (ej. 180 pax o 200 pax),
      // se heredan automáticamente las cantidades con su multiplicador y se resetean las sobreescrituras manuales
      setDesgloses(prev => {
        const updated: Record<string, DesgloseItem[]> = {};
        for (const [key, items] of Object.entries(prev)) {
          const prov = proveedores.find(p => p.id === key);
          const esPorPax = prov?.tipoCobro === 'por_persona';
          updated[key] = items.map(it => {
            const escala = it.escalaConPax !== undefined ? it.escalaConPax : esPorPax;
            const mult = it.multiplicadorPax || 1;
            if (escala) {
              return {
                ...it,
                cantidad: invitados * mult,
                esManual: false // Reset de sobreescritura manual para escuchar el nuevo pax global
              };
            }
            return it;
          });
        }
        return updated;
      });
      prevPaxRef.current = invitados;
      notificarGuardado(`Cantidad de ítems sincronizada a ${invitados} pax`);
    }
  }, [invitados, proveedores]);

  // Sincronización reactiva del desglose para servicios vinculados a recetas (Coffee Break)
  // Garantiza que Total Desglosado = p.costo * invitados, evitando cualquier multiplicación errónea
  useEffect(() => {
    setDesgloses(prev => {
      let huboCambios = false;
      const next = { ...prev };

      proveedores.forEach(p => {
        const esCoffeeBreakVinculado = (p.id === 'coffee-break-cocteleria' || p.categoria === 'cocteleria') && (p.recetaVinculadaNombre || p.recetaVinculadaId);
        if (esCoffeeBreakVinculado || p.recetaVinculadaId) {
          const items = next[p.id] || [];
          const totalActual = items.reduce((sum, it) => sum + (it.cantidad * it.valorUnitario), 0);
          const totalEsperado = p.costo * invitados;

          if (totalActual !== totalEsperado && p.costo > 0) {
            huboCambios = true;
            if (items.length > 0) {
              const sumaUnitarios = items.reduce((s, it) => s + ((it.multiplicadorPax || 1) * it.valorUnitario), 0);
              if (sumaUnitarios > 0 && Math.abs(sumaUnitarios - p.costo) > 0.01) {
                const factor = p.costo / sumaUnitarios;
                next[p.id] = items.map(it => ({
                  ...it,
                  valorUnitario: Math.round(it.valorUnitario * factor),
                  cantidad: (it.multiplicadorPax || 1) * invitados,
                  escalaConPax: true
                }));
              } else {
                next[p.id] = items.map(it => ({
                  ...it,
                  cantidad: (it.multiplicadorPax || 1) * invitados,
                  escalaConPax: true
                }));
              }
            } else {
              next[p.id] = [
                {
                  id: `cb-vinc-${p.id}`,
                  concepto: `Ficha Técnica: ${p.recetaVinculadaNombre || p.nombre}`,
                  cantidad: invitados,
                  valorUnitario: p.costo,
                  escalaConPax: true,
                  multiplicadorPax: 1
                }
              ];
            }
          }
        }
      });

      return huboCambios ? next : prev;
    });
  }, [proveedores, invitados]);

  const notificarGuardado = (msg = 'Valores actualizados') => {
    setMensajeToast(msg);
    setGuardadoExito(true);
    setTimeout(() => {
      setGuardadoExito(false);
      setMensajeToast(null);
    }, 2500);
  };

  // Añadir fila
  const handleAddItem = (proveedorId: string) => {
    const prov = proveedores.find(p => p.id === proveedorId);
    const esPorPax = prov?.tipoCobro === 'por_persona';

    const nuevoItem: DesgloseItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      concepto: 'Nuevo componente o insumo',
      cantidad: esPorPax ? invitados : 1,
      valorUnitario: 1000,
      escalaConPax: esPorPax,
      multiplicadorPax: 1,
      esManual: false
    };

    setDesgloses(prev => ({
      ...prev,
      [proveedorId]: [...(prev[proveedorId] || []), nuevoItem]
    }));
    notificarGuardado('Fila añadida al desglose');
  };

  // ════════════════════════════════════════════════════════════════════════
  // REGLA 2: CRITERIO Y PERMISO MANUAL (SOBREESCRITURA)
  // ════════════════════════════════════════════════════════════════════════
  const handleUpdateItem = (
    proveedorId: string,
    itemId: string,
    campo: 'concepto' | 'cantidad' | 'valorUnitario',
    valor: string | number
  ) => {
    setDesgloses(prev => {
      const items = prev[proveedorId] || [];
      const updated = items.map(it => {
        if (it.id !== itemId) return it;
        if (campo === 'cantidad') {
          const nuevaCant = Math.max(0, Number(valor) || 0);
          return {
            ...it,
            cantidad: nuevaCant,
            esManual: true // Respeta el valor manual escrito por el usuario
          };
        }
        return {
          ...it,
          [campo]: campo === 'concepto' ? valor : Math.max(0, Number(valor) || 0)
        };
      });
      return { ...prev, [proveedorId]: updated };
    });
  };

  // Re-vincular manualmente una fila específica al pax global
  const handleReVincularFila = (proveedorId: string, itemId: string) => {
    setDesgloses(prev => {
      const items = prev[proveedorId] || [];
      const updated = items.map(it => {
        if (it.id !== itemId) return it;
        const mult = it.multiplicadorPax || 1;
        return {
          ...it,
          cantidad: invitados * mult,
          esManual: false
        };
      });
      return { ...prev, [proveedorId]: updated };
    });
    notificarGuardado(`Ítem re-vinculado a ${invitados} pax`);
  };

  // Eliminar fila
  const handleDeleteItem = (proveedorId: string, itemId: string) => {
    setDesgloses(prev => {
      const items = prev[proveedorId] || [];
      return {
        ...prev,
        [proveedorId]: items.filter(it => it.id !== itemId)
      };
    });
    notificarGuardado('Fila eliminada');
  };

  // Total de desglose en vivo
  const getTotalDesglose = (proveedorId: string): number => {
    const items = desgloses[proveedorId] || [];
    return items.reduce((sum, it) => sum + (it.cantidad * it.valorUnitario), 0);
  };

  // Botón: Aplicar al costo por persona
  const handleAplicarCostoPorPersona = (p: ProveedorServicio) => {
    const total = getTotalDesglose(p.id);
    const divisor = invitados > 0 ? invitados : 100;
    const unitarioPorPersona = Math.round(total / divisor);
    onUpdateProveedorCost(p.id, unitarioPorPersona, p.precioVentaSugerido);
    notificarGuardado(`Aplicado como costo por persona: ${formatMoneda(unitarioPorPersona)}/pax`);
  };

  // Botón: Aplicar como costo real global
  const handleAplicarCostoReal = (p: ProveedorServicio) => {
    const total = getTotalDesglose(p.id);
    onUpdateProveedorCost(p.id, total, p.precioVentaSugerido);
    notificarGuardado(`Aplicado como costo real: ${formatMoneda(total)}`);
  };

  // Restablecer valores de fábrica
  const handleRestablecerTodo = () => {
    if (window.confirm(`¿Deseas restablecer todos los precios y desgloses de los ${proveedores.length} servicios a sus valores predeterminados de fábrica?`)) {
      const resetConPax: Record<string, DesgloseItem[]> = {};
      for (const [key, items] of Object.entries(DESGLOSES_INICIALES)) {
        const prov = proveedores.find(p => p.id === key);
        const esPorPax = prov?.tipoCobro === 'por_persona';
        resetConPax[key] = items.map(it => {
          const mult = it.multiplicadorPax || 1;
          return {
            ...it,
            cantidad: (it.escalaConPax || esPorPax) ? invitados * mult : it.cantidad,
            esManual: false
          };
        });
      }
      setDesgloses(resetConPax);
      localStorage.setItem(STORAGE_KEY_DESGLOSE, JSON.stringify(resetConPax));
      onRestablecerDefecto();
      notificarGuardado('Valores y desgloses restablecidos');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest block">
              Administración de Precios & Costeo por Ítems
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Catálogo de Tarifas & Variables del Negocio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Costeo quirúrgico por ítem sincronizado en tiempo real con el cotizador global de eventos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {guardadoExito && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{mensajeToast || 'Valores actualizados'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRestablecerTodo}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Valores Iniciales
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SELECTOR RÁPIDO DE PAX ACTIVO EN TARIFAS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-900 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                Pax Activo en Cotizador
              </span>
              <span className="text-xs text-amber-900 font-extrabold font-mono">
                {invitados} comensales
              </span>
            </div>
            <p className="text-xs text-amber-950/80 mt-0.5">
              La columna <strong>CANTIDAD</strong> del desglose de vajilla y servicios por persona hereda automáticamente este valor.
            </p>
          </div>
        </div>

        {onChangeInvitados && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 mr-1 hidden sm:inline">Botones Rápidos:</span>
            {[40, 60, 80, 100, 120, 150, 180, 200].map(pax => (
              <button
                key={`pax-select-${pax}`}
                type="button"
                onClick={() => onChangeInvitados(pax)}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  invitados === pax
                    ? 'bg-amber-600 text-white shadow-xs scale-105 ring-2 ring-amber-400'
                    : 'bg-white hover:bg-amber-100 text-slate-800 border border-amber-300/80 shadow-2xs'
                }`}
              >
                {pax} pax
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          PARTE B.1: RESUMEN DE SERVICIOS POR ÍTEM (En la parte superior)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListTree className="w-5 h-5 text-indigo-600" />
              Resumen de Servicios por Ítem ({proveedores.length} Servicios Integrales)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría y cuadre entre el total desglosado en vivo y el costo asignado actualmente en el cotizador.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
            Cálculo dinámico con {invitados} comensales
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Proveedor / Servicio</th>
                <th className="py-3 px-3 text-center">Modalidad</th>
                <th className="py-3 px-3 text-center">Cant. Ítems</th>
                <th className="py-3 px-3 text-right">Total Desglosado ({invitados} pax)</th>
                <th className="py-3 px-3 text-right">Costo Actual en Sistema</th>
                <th className="py-3 px-3 text-center">Estado de Cuadre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map((p) => {
                const items = desgloses[p.id] || [];
                const totalDesglosado = getTotalDesglose(p.id);
                const divisor = invitados > 0 ? invitados : 100;
                const unitarioPorPersona = Math.round(totalDesglosado / divisor);

                // Cuadre dinámico con el número activo de invitados
                const costoEsperadoTotal = p.tipoCobro === 'por_persona' ? p.costo * invitados : p.costo;
                const cuadra = Math.abs(totalDesglosado - costoEsperadoTotal) === 0;

                return (
                  <tr key={`resumen-${p.id}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100/90 text-slate-700 shrink-0">
                          {renderProveedorIcon(p.iconName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.nombre}</div>
                          <div className="text-[11px] text-slate-500">{p.contactoNombre || p.categoria}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.tipoCobro === 'por_persona'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.tipoCobro === 'por_persona' ? 'Por persona' : 'Costo fijo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-mono">
                        {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div
                        className="font-extrabold text-xs sm:text-sm"
                        style={{ color: cuadra ? '#0f172a' : '#b45309' }}
                      >
                        {formatMoneda(totalDesglosado)}
                      </div>
                      {p.tipoCobro === 'por_persona' && (
                        <div
                          className="text-[10px] font-semibold"
                          style={{ color: cuadra ? '#64748b' : '#b45309' }}
                        >
                          ({formatMoneda(unitarioPorPersona)}/pax)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div
                        className="font-extrabold text-xs sm:text-sm"
                        style={{ color: cuadra ? '#0f172a' : '#b45309' }}
                      >
                        {formatMoneda(costoEsperadoTotal)}
                      </div>
                      {p.tipoCobro === 'por_persona' && (
                        <div
                          className="text-[10px] font-semibold"
                          style={{ color: cuadra ? '#64748b' : '#b45309' }}
                        >
                          ({formatMoneda(p.costo)}/pax para {invitados} pax)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {cuadra ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Cuadrado
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 border border-amber-300"
                          style={{ color: '#b45309' }}
                          title={`Diferencia de ${formatMoneda(Math.abs(totalDesglosado - costoEsperadoTotal))}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          Descuadrado ({formatMoneda(Math.abs(totalDesglosado - costoEsperadoTotal))})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          1. TARIFAS DE PERSONAL
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Users2 className="w-5 h-5 text-blue-600" />
          Tarifas de Personal (Pago por Jornada / Turno)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Garzón / Camarero
            </label>
            <span className="text-[10px] text-slate-400 block mb-2">Pago por turno completo</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={tarifasStaff.garzonJornada}
                onChange={(e) => {
                  onUpdateStaffTarifas({
                    ...tarifasStaff,
                    garzonJornada: Number(e.target.value) || 0
                  });
                  notificarGuardado();
                }}
                className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Ratio: 1 cada {tarifasStaff.ratioGarzon} invitados
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Cocinero / Parrillero
            </label>
            <span className="text-[10px] text-slate-400 block mb-2">Pago por turno completo</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={tarifasStaff.cocineroJornada}
                onChange={(e) => {
                  onUpdateStaffTarifas({
                    ...tarifasStaff,
                    cocineroJornada: Number(e.target.value) || 0
                  });
                  notificarGuardado();
                }}
                className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Ratio: 1 cada {tarifasStaff.ratioCocinero} invitados
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Personal de Aseo
            </label>
            <span className="text-[10px] text-slate-400 block mb-2">Pago por turno completo</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={tarifasStaff.aseoJornada}
                onChange={(e) => {
                  onUpdateStaffTarifas({
                    ...tarifasStaff,
                    aseoJornada: Number(e.target.value) || 0
                  });
                  notificarGuardado();
                }}
                className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Ratio: 1 cada {tarifasStaff.ratioAseo} invitados
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Maître / Supervisor
            </label>
            <span className="text-[10px] text-slate-400 block mb-2">Pago por turno completo</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={tarifasStaff.maitreJornada}
                onChange={(e) => {
                  onUpdateStaffTarifas({
                    ...tarifasStaff,
                    maitreJornada: Number(e.target.value) || 0
                  });
                  notificarGuardado();
                }}
                className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Coordinador del Salón
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          2. MENÚS GASTRONÓMICOS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Utensils className="w-5 h-5 text-amber-600" />
          Menús Gastronómicos (Costos e Insumos por Persona)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {menus.map((m) => (
            <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{m.nombre}</h3>
                  <p className="text-xs text-slate-500">{m.descripcion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/60">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Costo Real Insumo ($/pax)
                  </label>
                  <input
                    type="number"
                    value={m.costoPersona}
                    onChange={(e) => {
                      onUpdateMenuCost(m.id, Number(e.target.value) || 0, m.precioSugeridoPersona);
                      notificarGuardado();
                    }}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Precio Sugerido Venta ($/pax)
                  </label>
                  <input
                    type="number"
                    value={m.precioSugeridoPersona}
                    onChange={(e) => {
                      onUpdateMenuCost(m.id, m.costoPersona, Number(e.target.value) || 0);
                      notificarGuardado();
                    }}
                    className="w-full text-xs font-bold text-amber-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          PARTE B.2: 3. PROVEEDORES & SERVICIOS CON DESGLOSE POR ÍTEM QUIRÚRGICO
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Servicios de Proveedores & Desglose Reactivo por Ítem
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Las filas de vajilla y servicios por persona heredan automáticamente la cantidad de comensales activa ({invitados} pax). Puedes sobreescribir cualquier cantidad manualmente.
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-5">
          {proveedores.map((p) => {
            const items = desgloses[p.id] || [];
            const totalDesglosado = getTotalDesglose(p.id);
            const divisor = invitados > 0 ? invitados : 100;
            const unitarioPorPersona = Math.round(totalDesglosado / divisor);

            // Verificación si cuadra con la tarifa actual
            const costoEsperadoTotal = p.tipoCobro === 'por_persona' ? p.costo * invitados : p.costo;
            const cuadra = Math.abs(totalDesglosado - costoEsperadoTotal) === 0;

            return (
              <div
                key={p.id}
                className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/40 hover:bg-slate-50/70 transition-all shadow-xs"
              >
                {/* Cabecera de la tarjeta del servicio */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                      {renderProveedorIcon(p.iconName)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          p.tipoCobro === 'por_persona'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {p.tipoCobro === 'por_persona' ? `Tarifa Por Persona (${invitados} pax)` : 'Costo Fijo Global'}
                        </span>
                        {p.recetaVinculadaNombre && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <Coffee className="w-3 h-3 text-amber-800" />
                            Ficha: {p.recetaVinculadaNombre}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {p.contactoNombre || p.categoria}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{p.nombre}</h3>
                      <p className="text-xs text-slate-500">{p.descripcion}</p>
                    </div>
                  </div>

                  {/* Inputs de Costo Real y Precio de Venta */}
                  <div className="grid grid-cols-2 gap-3 shrink-0 sm:w-80">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">
                        {p.tipoCobro === 'por_persona' ? 'Costo Actual ($/pax)' : 'Costo Actual ($ Fijo)'}
                      </label>
                      <input
                        type="number"
                        value={p.costo}
                        onChange={(e) => {
                          onUpdateProveedorCost(p.id, Number(e.target.value) || 0, p.precioVentaSugerido);
                          notificarGuardado();
                        }}
                        className="w-full text-xs sm:text-sm font-extrabold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 focus:outline-hidden"
                      />
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">
                        {p.tipoCobro === 'por_persona' ? 'Venta Sugerida ($/pax)' : 'Venta Sugerida ($)'}
                      </label>
                      <input
                        type="number"
                        value={p.precioVentaSugerido}
                        onChange={(e) => {
                          onUpdateProveedorCost(p.id, p.costo, Number(e.target.value) || 0);
                          notificarGuardado();
                        }}
                        className="w-full text-xs sm:text-sm font-extrabold text-indigo-900 bg-transparent border-0 focus:ring-0 p-0 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* ── CONTENEDOR DE DESGLOSE POR ÍTEM ── */}
                <div className="mt-4 bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Desglose de Componentes ({items.length} ítems) · <span className="text-indigo-600">Base {invitados} pax</span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddItem(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer w-fit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir Ítem
                    </button>
                  </div>

                  {/* Tabla / Lista de Ítems */}
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase">
                          <th className="py-2 px-2">Concepto / Componente</th>
                          <th className="py-2 px-2 w-36 text-center">Cantidad</th>
                          <th className="py-2 px-2 w-32 text-right">Valor Unit. ($)</th>
                          <th className="py-2 px-2 w-32 text-right">Subtotal</th>
                          <th className="py-2 px-1 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-400 text-xs italic">
                              No hay ítems en este desglose. Haz clic en "Añadir Ítem" para comenzar.
                            </td>
                          </tr>
                        ) : (
                          items.map((it) => {
                            const subtotal = it.cantidad * it.valorUnitario;
                            const esServicioPorPersona = p.tipoCobro === 'por_persona';
                            const vinculableAPax = it.escalaConPax !== undefined ? it.escalaConPax : esServicioPorPersona;

                            return (
                              <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-1.5 px-2">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={it.concepto}
                                      onChange={(e) => handleUpdateItem(p.id, it.id, 'concepto', e.target.value)}
                                      placeholder="Nombre del componente..."
                                      className="w-full text-xs text-slate-800 font-medium bg-slate-50/50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 focus:outline-hidden"
                                    />
                                    {it.multiplicadorPax && it.multiplicadorPax > 1 && (
                                      <span
                                        className="text-[10px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap"
                                        title={`${it.multiplicadorPax} unidades requeridas por cada comensal`}
                                      >
                                        ×{it.multiplicadorPax} un/pax
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={it.cantidad}
                                      onChange={(e) => handleUpdateItem(p.id, it.id, 'cantidad', e.target.value)}
                                      className={`w-20 text-center text-xs font-bold rounded px-1.5 py-1 focus:outline-hidden border ${
                                        it.esManual
                                          ? 'border-amber-400 bg-amber-50/60 text-amber-950 ring-1 ring-amber-300'
                                          : 'border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:border-indigo-500'
                                      }`}
                                      title={
                                        it.esManual
                                          ? 'Valor editado manualmente'
                                          : it.multiplicadorPax && it.multiplicadorPax > 1
                                            ? `Auto: ${invitados} pax × ${it.multiplicadorPax} = ${invitados * it.multiplicadorPax} unidades`
                                            : `Auto: hereda los ${invitados} pax activos`
                                      }
                                    />
                                    {vinculableAPax && (
                                      it.esManual ? (
                                        <button
                                          type="button"
                                          onClick={() => handleReVincularFila(p.id, it.id)}
                                          className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                          title={`Restablecer a ${invitados * (it.multiplicadorPax || 1)} unidades automáticas`}
                                        >
                                          Re-vincular
                                        </button>
                                      ) : (
                                        <span
                                          className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded uppercase tracking-wider"
                                          title={it.multiplicadorPax && it.multiplicadorPax > 1 ? `Calculado: ${invitados} pax × ${it.multiplicadorPax}` : 'Sincronizado con el cotizador'}
                                        >
                                          Auto{it.multiplicadorPax && it.multiplicadorPax > 1 ? ` (×${it.multiplicadorPax})` : ''}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-slate-400 text-xs">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={it.valorUnitario}
                                      onChange={(e) => handleUpdateItem(p.id, it.id, 'valorUnitario', e.target.value)}
                                      className="w-24 text-right text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:outline-hidden"
                                    />
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-right font-extrabold text-slate-900 font-mono text-xs">
                                  {formatMoneda(subtotal)}
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(p.id, it.id)}
                                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    title="Eliminar fila"
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

                  {/* Barra inferior de totalización en vivo y sincronización */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4 p-3 sm:p-4 rounded-b-xl">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Total Desglosado en Vivo ({invitados} pax)
                        </span>
                        <div
                          className="text-base sm:text-lg font-extrabold"
                          style={{ color: cuadra ? '#0f172a' : '#b45309' }}
                        >
                          {formatMoneda(totalDesglosado)}
                        </div>
                      </div>

                      {p.tipoCobro === 'por_persona' && (
                        <div className="border-l border-slate-200 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Equivalente por Persona ({invitados} pax)
                          </span>
                          <div
                            className="text-base sm:text-lg font-extrabold"
                            style={{ color: cuadra ? '#0f172a' : '#b45309' }}
                          >
                            {formatMoneda(unitarioPorPersona)} / pax
                          </div>
                        </div>
                      )}

                      {!cuadra && (
                        <div
                          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100/90 border border-amber-300"
                          style={{ color: '#b45309' }}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                          <span>Difiere del costo en cotizador ({formatMoneda(costoEsperadoTotal)})</span>
                        </div>
                      )}
                    </div>

                    {/* BOTONES DE APLICACIÓN DINÁMICA */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAplicarCostoPorPersona(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
                        title="Divide el total desglosado entre los invitados activos y lo aplica como costo por persona"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Aplicar al costo por persona ({formatMoneda(unitarioPorPersona)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAplicarCostoReal(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
                        title="Aplica la suma total desglosada directamente como costo real global de este servicio"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aplicar como costo real ({formatMoneda(totalDesglosado)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. ESTILOS DE DECORACIÓN
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Palette className="w-5 h-5 text-rose-600" />
          Estilos de Decoración (Costo Fijo de Montaje)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {estilosDecoracion.map((est) => (
            <div key={est.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
              <h3 className="text-sm font-bold text-slate-900">{est.nombre}</h3>
              <p className="text-xs text-slate-500 mb-2">{est.subtitulo}</p>

              <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Costo Real Montaje ($)
                  </label>
                  <input
                    type="number"
                    value={est.costoFijo}
                    onChange={(e) => {
                      onUpdateDecoracionCost(est.id, Number(e.target.value) || 0, est.precioVentaSugerido);
                      notificarGuardado();
                    }}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Precio Sugerido Venta ($)
                  </label>
                  <input
                    type="number"
                    value={est.precioVentaSugerido}
                    onChange={(e) => {
                      onUpdateDecoracionCost(est.id, est.costoFijo, Number(e.target.value) || 0);
                      notificarGuardado();
                    }}
                    className="w-full text-xs font-bold text-rose-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
