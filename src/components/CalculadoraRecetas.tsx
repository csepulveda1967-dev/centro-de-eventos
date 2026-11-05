import React, { useState, useMemo, useEffect } from 'react';
import { RecetaFichaTecnica, InsumoMaestro, MenuOption, IngredienteReceta, MenuItemRatio } from '../types';
import {
  calcularCostoReceta,
  calcularCostoIngrediente,
  calcularCostoMenuDesdeRecetas,
  calcularDesglosePorCategoria,
  formatearNombreCategoria,
  obtenerColorCategoria,
  TIEMPOS_MENU_DEFAULT,
  formatearNombreTiempoMenu
} from '../config/insumosYRecetas';
import { formatMoneda, formatPorcentaje, formatPrecioUnitario } from '../utils/formatters';
import { ModalCrearMenu } from './ModalCrearMenu';
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  Info,
  Scale,
  Coffee,
  Link as LinkIcon,
  Tag,
  Filter,
  PieChart,
  FolderPlus,
  Wine,
  GlassWater,
  Beer,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { Modulo2Personal } from './Modulo2Personal';
import { StaffTarifas } from '../types';

interface CalculadoraRecetasProps {
  recetas: RecetaFichaTecnica[];
  insumos: InsumoMaestro[];
  menus: MenuOption[];
  invitados?: number;
  onUpdateReceta: (recetaActualizada: RecetaFichaTecnica) => void;
  onAddReceta: (nuevaReceta: RecetaFichaTecnica) => void;
  onDeleteReceta: (id: string) => void;
  onSincronizarCostosMenu: (menuId: string, nuevoCosto: number) => void;
  onVincularCoffeeBreak?: (receta: RecetaFichaTecnica, costoPorPorcion: number, precioSugerido: number) => void;
  onAddMenu?: (nuevoMenu: MenuOption) => void;
  onDeleteMenu?: (menuId: string) => void;
  // Brigada de Servicio & Personal de Operaciones
  tarifasStaff?: StaffTarifas;
  personal?: {
    garzones: number;
    cocineros: number;
    aseo: number;
    maitre: number;
  };
  onChangePersonal?: (nuevoPersonal: {
    garzones: number;
    cocineros: number;
    aseo: number;
    maitre: number;
  }) => void;
  // Servicio de Bebestibles, Vinos & Barra por Persona
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  // Vinculación e incorporación automática al Cotizador (Pantalla Principal)
  menuSeleccionadoId?: string;
  onSelectMenu?: (menuId: string) => void;
  onUpdateMenu?: (menuActualizado: MenuOption) => void;
  onIrACotizador?: () => void;
}

interface InputNumeroCeldaRecetasProps {
  valorInicial: number;
  onCambioConfirmado: (nuevoValor: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}

const InputNumeroCeldaRecetas: React.FC<InputNumeroCeldaRecetasProps> = ({
  valorInicial,
  onCambioConfirmado,
  className,
  min = 0,
  max,
  step = 'any',
  placeholder = '0'
}) => {
  const [texto, setTexto] = useState<string>(String(valorInicial));
  const [estaEnfocado, setEstaEnfocado] = useState(false);

  useEffect(() => {
    if (!estaEnfocado) {
      setTexto(String(valorInicial));
    }
  }, [valorInicial, estaEnfocado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTexto(val);
    if (val !== '' && !isNaN(Number(val))) {
      onCambioConfirmado(Number(val));
    }
  };

  const handleBlur = () => {
    setEstaEnfocado(false);
    if (texto.trim() === '' || isNaN(Number(texto))) {
      setTexto('0');
      onCambioConfirmado(0);
    } else {
      let num = Number(texto);
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      setTexto(String(num));
      onCambioConfirmado(num);
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={texto}
      onFocus={(e) => {
        setEstaEnfocado(true);
        e.target.select();
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export const CalculadoraRecetas: React.FC<CalculadoraRecetasProps> = ({
  recetas,
  insumos,
  menus,
  invitados = 100,
  onUpdateReceta,
  onAddReceta,
  onDeleteReceta,
  onSincronizarCostosMenu,
  onVincularCoffeeBreak,
  onAddMenu,
  onDeleteMenu,
  tarifasStaff,
  personal,
  onChangePersonal,
  bebestibles = [],
  onUpdateBebestibles,
  menuSeleccionadoId,
  onSelectMenu,
  onUpdateMenu,
  onIrACotizador
}) => {
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string>(recetas[0]?.id || '');
  const [toastSync, setToastSync] = useState<string | null>(null);

  // Modal para Incorporar Receta al Cotizador (Pantalla Principal)
  const [recetaAIncorporar, setRecetaAIncorporar] = useState<RecetaFichaTecnica | null>(null);
  const [metodoIncorporar, setMetodoIncorporar] = useState<'nuevo-menu' | 'menu-existente'>('nuevo-menu');
  const [menuDestinoId, setMenuDestinoId] = useState<string>(menus[0]?.id || '');
  const [nombreNuevoMenuReceta, setNombreNuevoMenuReceta] = useState<string>('');
  const [categoriaNuevoMenuReceta, setCategoriaNuevoMenuReceta] = useState<'formal' | 'campestre' | 'cocktail' | 'premium'>('premium');
  const [tiempoAsignado, setTiempoAsignado] = useState<string>('fondo');
  const [establecerComoActivo, setEstablecerComoActivo] = useState<boolean>(true);
  const [irACotizadorAlTerminar, setIrACotizadorAlTerminar] = useState<boolean>(false);

  const abrirModalIncorporarReceta = (r: RecetaFichaTecnica) => {
    setRecetaAIncorporar(r);
    setNombreNuevoMenuReceta(r.nombre);

    const catRec = (r.categoria || '').toLowerCase();
    let catSugerida: 'formal' | 'campestre' | 'cocktail' | 'premium' = 'premium';
    if (catRec.includes('campestre')) catSugerida = 'campestre';
    else if (catRec.includes('cocktail') || catRec.includes('coctel')) catSugerida = 'cocktail';
    else if (catRec.includes('formal')) catSugerida = 'formal';
    setCategoriaNuevoMenuReceta(catSugerida);

    const tRec = (r.tiempoMenu || '').toLowerCase();
    if (['coctel', 'entrada', 'fondo', 'postre', 'trasnoche'].includes(tRec)) {
      setTiempoAsignado(tRec);
    } else {
      setTiempoAsignado('fondo');
    }

    setMenuDestinoId(menuSeleccionadoId || menus[0]?.id || '');
    setMetodoIncorporar('nuevo-menu');
  };

  const getMenusDeReceta = (rec: RecetaFichaTecnica) => {
    return menus.filter(m =>
      m.id === rec.menuAsociadoId || (m.recetasIds && m.recetasIds.includes(rec.id))
    );
  };

  const handleConfirmarIncorporacion = () => {
    if (!recetaAIncorporar) return;
    const r = recetaAIncorporar;
    const calc = calcularCostoReceta(r, insumos);

    if (metodoIncorporar === 'nuevo-menu') {
      const nombreFinal = nombreNuevoMenuReceta.trim() || r.nombre;
      const nuevoId = 'menu-' + Date.now();

      const tiemposFinales = {
        coctel: tiempoAsignado === 'coctel' ? r.nombre : 'Cóctel de bienvenida artesanal en jardín',
        entrada: tiempoAsignado === 'entrada' ? r.nombre : 'Entrada fresca de temporada según minuta',
        fondo: (tiempoAsignado === 'fondo' || (!['coctel', 'entrada', 'postre', 'trasnoche'].includes(tiempoAsignado))) ? r.nombre : 'Plato principal de autor con guarnición noble',
        postre: tiempoAsignado === 'postre' ? r.nombre : 'Postre artesanal de autor',
        trasnoche: tiempoAsignado === 'trasnoche' ? r.nombre : 'Estación de trasnoche'
      };

      const nuevoMenu: MenuOption = {
        id: nuevoId,
        nombre: nombreFinal,
        categoria: categoriaNuevoMenuReceta,
        costoPersona: calc.costoPorPorcion,
        precioSugeridoPersona: calc.precioSugeridoVenta,
        descripcion: `Propuesta gastronómica con la receta técnica "${r.nombre}"`,
        tiempos: tiemposFinales,
        destacado: categoriaNuevoMenuReceta === 'premium',
        recetasIds: [r.id],
        costoCalculadoDesdeRecetas: true
      };

      if (onAddMenu) {
        onAddMenu(nuevoMenu);
      }

      const recetaActualizada: RecetaFichaTecnica = {
        ...r,
        menuAsociadoId: nuevoId
      };
      onUpdateReceta(recetaActualizada);

      if (establecerComoActivo && onSelectMenu) {
        onSelectMenu(nuevoId);
      }

      notificar(`✓ Menú "${nombreFinal}" creado e incorporado al Cotizador (${formatMoneda(calc.costoPorPorcion)}/pax)`);
    } else {
      const menuTarget = menus.find(m => m.id === menuDestinoId);
      if (!menuTarget) return;

      const recetaActualizada: RecetaFichaTecnica = {
        ...r,
        menuAsociadoId: menuTarget.id
      };
      onUpdateReceta(recetaActualizada);

      const nuevasRecetasIds = Array.from(new Set([...(menuTarget.recetasIds || []), r.id]));

      const nuevosTiempos = { ...menuTarget.tiempos };
      if (tiempoAsignado === 'coctel') nuevosTiempos.coctel = r.nombre;
      else if (tiempoAsignado === 'entrada') nuevosTiempos.entrada = r.nombre;
      else if (tiempoAsignado === 'fondo') nuevosTiempos.fondo = r.nombre;
      else if (tiempoAsignado === 'postre') nuevosTiempos.postre = r.nombre;
      else if (tiempoAsignado === 'trasnoche') nuevosTiempos.trasnoche = r.nombre;

      const recetasDelMenu = recetas
        .map(rec => rec.id === r.id ? recetaActualizada : rec)
        .filter(rec => (rec.menuAsociadoId === menuTarget.id || nuevasRecetasIds.includes(rec.id)) && rec.tiempoMenu !== 'coffee-break');

      const nuevoCostoMenu = recetasDelMenu.reduce((sum, rec) => {
        const c = calcularCostoReceta(rec, insumos);
        return sum + c.costoPorPorcion;
      }, 0);

      const nuevoPrecioSugerido = Math.round(nuevoCostoMenu / 0.33);

      const menuActualizado: MenuOption = {
        ...menuTarget,
        costoPersona: nuevoCostoMenu > 0 ? nuevoCostoMenu : calc.costoPorPorcion,
        precioSugeridoPersona: nuevoPrecioSugerido > 0 ? nuevoPrecioSugerido : calc.precioSugeridoVenta,
        recetasIds: nuevasRecetasIds,
        tiempos: nuevosTiempos,
        costoCalculadoDesdeRecetas: true
      };

      if (onUpdateMenu) {
        onUpdateMenu(menuActualizado);
      } else if (onSincronizarCostosMenu) {
        onSincronizarCostosMenu(menuTarget.id, menuActualizado.costoPersona);
      }

      if (establecerComoActivo && onSelectMenu) {
        onSelectMenu(menuTarget.id);
      }

      notificar(`✓ Receta "${r.nombre}" vinculada a "${menuTarget.nombre}" en el Cotizador`);
    }

    setRecetaAIncorporar(null);

    if (irACotizadorAlTerminar && onIrACotizador) {
      onIrACotizador();
    }
  };

  // Insumo a añadir en la receta activa
  const insumosMap = new Map<string, InsumoMaestro>(insumos.map(i => [i.id, i]));
  const primerInsumo = insumos[0];
  const [insumoToAddId, setInsumoToAddId] = useState<string>(primerInsumo?.id || '');
  const [cantidadToAdd, setCantidadToAdd] = useState<number | string>(primerInsumo?.unidadMedida === 'kg' ? 200 : 1);
  const [unidadToAdd, setUnidadToAdd] = useState<'kg' | 'g' | 'L' | 'ml' | 'unidad'>(
    primerInsumo?.unidadMedida === 'kg' ? 'g' : (primerInsumo?.unidadMedida as any || 'g')
  );

  // Modal para nueva receta
  const [modalNuevaRecetaOpen, setModalNuevaRecetaOpen] = useState(false);
  const [nuevoNombreReceta, setNuevoNombreReceta] = useState('');
  const [nuevoTiempoReceta, setNuevoTiempoReceta] = useState<string>('fondo');
  const [esTiempoNuevoLibre, setEsTiempoNuevoLibre] = useState(false);
  const [tiempoLibreInput, setTiempoLibreInput] = useState('');
  const [nuevoMenuAsociadoId, setNuevoMenuAsociadoId] = useState<string>(menus[0]?.id || '');

  // ── Categoría libre para Nueva Ficha Técnica de Costeo ──
  const STORAGE_CATEGORIAS_RECETAS_KEY = 'hlr_categorias_recetas_personalizadas';
  const [categoriasRecetasPersonalizadas, setCategoriasRecetasPersonalizadas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATEGORIAS_RECETAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [nuevaCategoriaReceta, setNuevaCategoriaReceta] = useState<string>('Plato de Fondo Gourmet');
  const [esCategoriaRecetaLibre, setEsCategoriaRecetaLibre] = useState(false);
  const [categoriaRecetaLibreInput, setCategoriaRecetaLibreInput] = useState('');

  // Tiempos personalizados guardados en localStorage
  const STORAGE_TIEMPOS_KEY = 'hlr_tiempos_menu_personalizados';
  const [tiemposPersonalizados, setTiemposPersonalizados] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TIEMPOS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const guardarTiemposPersonalizados = (nuevos: string[]) => {
    setTiemposPersonalizados(nuevos);
    try {
      localStorage.setItem(STORAGE_TIEMPOS_KEY, JSON.stringify(nuevos));
    } catch (e) {
      console.error('Error guardando tiempos en localStorage:', e);
    }
  };

  // Consolidar todos los tiempos disponibles (predeterminados + personalizados + existentes en recetas)
  const todosLosTiempos = useMemo(() => {
    const lista: { id: string; label: string; count: number; esPersonalizado: boolean }[] = [];
    const setIds = new Set<string>();

    for (const def of TIEMPOS_MENU_DEFAULT) {
      setIds.add(def.id.toLowerCase());
      const count = recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === def.id.toLowerCase()).length;
      lista.push({ id: def.id, label: def.label, count, esPersonalizado: false });
    }

    for (const tPers of tiemposPersonalizados) {
      const tTrim = tPers.trim();
      const slug = tTrim.toLowerCase().replace(/\s+/g, '_');
      if (!setIds.has(slug) && !setIds.has(tTrim.toLowerCase())) {
        setIds.add(slug);
        const count = recetas.filter(r => {
          const t = (r.tiempoMenu || '').toLowerCase();
          return t === slug || t === tTrim.toLowerCase();
        }).length;
        lista.push({ id: slug, label: tTrim, count, esPersonalizado: true });
      }
    }

    for (const rec of recetas) {
      if (rec.tiempoMenu) {
        const tTrim = rec.tiempoMenu.trim();
        const slug = tTrim.toLowerCase().replace(/\s+/g, '_');
        if (!setIds.has(slug) && !setIds.has(tTrim.toLowerCase())) {
          setIds.add(slug);
          const count = recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === rec.tiempoMenu.toLowerCase()).length;
          lista.push({
            id: rec.tiempoMenu,
            label: formatearNombreTiempoMenu(rec.tiempoMenu),
            count,
            esPersonalizado: true
          });
        }
      }
    }

    return lista;
  }, [recetas, tiemposPersonalizados]);

  // Consolidar todas las categorías disponibles para recetas (predeterminadas + personalizadas + en recetas)
  const todasLasCategoriasRecetas = useMemo(() => {
    const defaultCats = [
      'Plato de Fondo Gourmet',
      'Entrada de Gala',
      'Cóctel de Apertura',
      'Postre de Autor',
      'Bajonativo / Trasnoche',
      'Coffee Break & Coctelería',
      'Guarniciones & Ensaladas',
      'Pastelería & Repostería',
      'Bebidas & Bar',
      'Servicio Alternativo',
      'Receta de Autor'
    ];
    const setCats = new Set<string>();
    const lista: string[] = [];

    const addCat = (c: string) => {
      const trim = c.trim();
      if (!trim) return;
      const lower = trim.toLowerCase();
      if (!setCats.has(lower)) {
        setCats.add(lower);
        lista.push(trim);
      }
    };

    defaultCats.forEach(addCat);
    categoriasRecetasPersonalizadas.forEach(addCat);
    recetas.forEach(r => {
      if (r.categoria) addCat(r.categoria);
    });

    return lista;
  }, [recetas, categoriasRecetasPersonalizadas]);

  // Estado para creación de nuevo menú dentro de la receta
  const [modoMenuReceta, setModoMenuReceta] = useState<'existente' | 'nuevo'>('existente');
  const [nombreNuevoMenu, setNombreNuevoMenu] = useState('');
  const [categoriaNuevoMenu, setCategoriaNuevoMenu] = useState<'formal' | 'campestre' | 'cocktail' | 'premium'>('formal');
  const [descripcionNuevoMenu, setDescripcionNuevoMenu] = useState('');

  // Modal independiente para crear nuevo menú
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);

  // Filtro de recetas por menú
  const [menuFiltroRecetas, setMenuFiltroRecetas] = useState<string>('todos');

  const recetaActiva = recetas.find(r => r.id === recetaSeleccionadaId) || recetas[0];

  const calculosReceta = recetaActiva
    ? calcularCostoReceta(recetaActiva, insumos)
    : {
        costoMateriaPrima: 0,
        costoAdicional: 0,
        costoTotalReceta: 0,
        costoPorPorcion: 0,
        precioSugeridoVenta: 0,
        utilidadPorPorcion: 0
      };

  // Menú vinculado a la receta activa
  const menuVinculado = menus.find(m => m.id === recetaActiva?.menuAsociadoId);
  const calculoMenuCompleto = menuVinculado
    ? calcularCostoMenuDesdeRecetas(menuVinculado.id, recetas, insumos)
    : { costoMenuCalculado: 0, recetasEncontradas: 0 };

  // Filtro de categorías para añadir ingredientes desde el maestro
  const [categoriaFiltroIngrediente, setCategoriaFiltroIngrediente] = useState<string>('todas');

  // Categorías presentes en los insumos (tanto predeterminadas como creadas en forma libre)
  const categoriasDisponibles = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const ins of insumos) {
      const cat = ins.categoria || 'otros';
      const catKey = cat.toLowerCase();
      if (!map.has(catKey)) {
        map.set(catKey, {
          id: cat,
          label: formatearNombreCategoria(cat),
          count: 0
        });
      }
      map.get(catKey)!.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [insumos]);

  // Insumos filtrados por la categoría seleccionada para agregar a la receta
  const insumosParaAgregar = useMemo(() => {
    if (categoriaFiltroIngrediente === 'todas') {
      return insumos;
    }
    return insumos.filter(i => (i.categoria || '').toLowerCase() === categoriaFiltroIngrediente.toLowerCase());
  }, [insumos, categoriaFiltroIngrediente]);

  // Si cambia el filtro y el insumo seleccionado ya no está en la lista filtrada, actualizarlo
  const handleCambioCategoriaFiltro = (nuevaCat: string) => {
    setCategoriaFiltroIngrediente(nuevaCat);
    const listaFiltrada = nuevaCat === 'todas'
      ? insumos
      : insumos.filter(i => (i.categoria || '').toLowerCase() === nuevaCat.toLowerCase());

    if (listaFiltrada.length > 0 && !listaFiltrada.some(i => i.id === insumoToAddId)) {
      const primerItem = listaFiltrada[0];
      setInsumoToAddId(primerItem.id);
      if (primerItem.unidadMedida === 'kg') {
        setUnidadToAdd('g');
        setCantidadToAdd(200);
      } else if (primerItem.unidadMedida === 'unidad') {
        setUnidadToAdd('unidad');
        setCantidadToAdd(2);
      } else {
        setUnidadToAdd(primerItem.unidadMedida as any || 'g');
        setCantidadToAdd(1);
      }
    }
  };

  // Desglose del costo de la receta activa según las categorías de sus insumos
  const desgloseCategorias = useMemo(() => {
    if (!recetaActiva) return [];
    return calcularDesglosePorCategoria(recetaActiva, insumos);
  }, [recetaActiva, insumos]);

  const notificar = (msg: string) => {
    setToastSync(msg);
    setTimeout(() => setToastSync(null), 3000);
  };

  // Agregar ingrediente a la receta activa
  const handleAddIngrediente = () => {
    if (!recetaActiva) return;
    const insumoElegido = insumosMap.get(insumoToAddId);
    if (!insumoElegido) return;

    const cantidadNumerica = typeof cantidadToAdd === 'number' ? cantidadToAdd : parseFloat(String(cantidadToAdd)) || 0;
    const esPeso = insumoElegido.unidadMedida === 'kg' || unidadToAdd === 'g' || unidadToAdd === 'kg';
    const unidadFinal = esPeso ? 'g' : unidadToAdd;
    const cantidadFinal = esPeso
      ? (unidadToAdd === 'kg' ? cantidadNumerica * 1000 : Math.max(0.001, cantidadNumerica))
      : Math.max(0.001, cantidadNumerica);

    const nuevoIngrediente: IngredienteReceta = {
      id: 'ing-' + Date.now(),
      insumoId: insumoToAddId,
      cantidad: cantidadFinal,
      unidad: unidadFinal
    };

    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: [...recetaActiva.ingredientes, nuevoIngrediente]
    };

    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
    notificar(`✓ Ingrediente "${insumoElegido.nombre}" agregado (${cantidadFinal} ${unidadFinal})`);
  };

  // Helper para mantener sincronizado Coffee Break en Tarifas Generales
  const syncSiEsCoffeeBreak = (recetaModificada: RecetaFichaTecnica) => {
    if (recetaModificada.tiempoMenu === 'coffee-break' && onVincularCoffeeBreak) {
      const calc = calcularCostoReceta(recetaModificada, insumos);
      onVincularCoffeeBreak(recetaModificada, calc.costoPorPorcion, calc.precioSugeridoVenta);
    }
  };

  // Quitar ingrediente
  const handleRemoveIngrediente = (ingId: string) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: recetaActiva.ingredientes.filter(i => i.id !== ingId)
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Cambiar cantidad de ingrediente existente
  const handleCantidadIngredienteChange = (ingId: string, nuevaCantidad: number) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      ingredientes: recetaActiva.ingredientes.map(i =>
        i.id === ingId ? { ...i, cantidad: Math.max(0, nuevaCantidad) } : i
      )
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Cambiar margen gastronómico de la receta activa
  const handleMargenChange = (nuevoMargen: number) => {
    if (!recetaActiva) return;
    const recetaActualizada: RecetaFichaTecnica = {
      ...recetaActiva,
      margenSugerido: Math.max(5, Math.min(80, nuevoMargen))
    };
    onUpdateReceta(recetaActualizada);
    syncSiEsCoffeeBreak(recetaActualizada);
  };

  // Sincronizar el costo resultante de las recetas al menú del cotizador
  const handleSincronizarAlCotizador = () => {
    if (!menuVinculado) return;
    const { costoMenuCalculado } = calcularCostoMenuDesdeRecetas(menuVinculado.id, recetas, insumos);
    onSincronizarCostosMenu(menuVinculado.id, costoMenuCalculado);
    notificar(`✓ Costo de "${menuVinculado.nombre}" actualizado a ${formatMoneda(costoMenuCalculado)} en el Cotizador`);
  };

  // Sincronizar explícitamente a Tarifas Generales
  const handleSincronizarCoffeeBreak = () => {
    if (!recetaActiva || recetaActiva.tiempoMenu !== 'coffee-break') return;
    if (onVincularCoffeeBreak) {
      onVincularCoffeeBreak(recetaActiva, calculosReceta.costoPorPorcion, calculosReceta.precioSugeridoVenta);
      notificar(`✓ Tarjeta de Coffee Break actualizada a ${formatMoneda(calculosReceta.costoPorPorcion)}/pax`);
    }
  };

  // Crear nueva receta
  const handleCrearReceta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreReceta.trim()) return;

    let tiempoFinal = nuevoTiempoReceta;

    // Si el usuario eligió escribir un tiempo nuevo y libre
    if (esTiempoNuevoLibre && tiempoLibreInput.trim()) {
      const nombreTiempoLimpio = tiempoLibreInput.trim();
      const slug = nombreTiempoLimpio.toLowerCase().replace(/\s+/g, '_');
      tiempoFinal = slug;

      if (!tiemposPersonalizados.some(t => t.toLowerCase() === nombreTiempoLimpio.toLowerCase())) {
        const actualizados = [...tiemposPersonalizados, nombreTiempoLimpio];
        guardarTiemposPersonalizados(actualizados);
      }
    }

    const esCoffeeBreak = tiempoFinal === 'coffee-break';
    let menuFinalId = nuevoMenuAsociadoId;

    // Si el usuario eligió crear un nuevo menú para esta receta
    let nuevoMenuCreado: MenuOption | null = null;
    if (!esCoffeeBreak && modoMenuReceta === 'nuevo') {
      const nombreLimpio = nombreNuevoMenu.trim() || `Menú ${nuevoNombreReceta.trim()}`;
      const nuevoId = 'menu-' + Date.now();
      nuevoMenuCreado = {
        id: nuevoId,
        nombre: nombreLimpio,
        categoria: categoriaNuevoMenu,
        costoPersona: 0,
        precioSugeridoPersona: 0,
        descripcion: descripcionNuevoMenu.trim() || `Propuesta gastronómica con la ficha técnica "${nuevoNombreReceta.trim()}"`,
        tiempos: {
          coctel: nuevoTiempoReceta === 'coctel' ? nuevoNombreReceta.trim() : 'Selección de bocados gourmet en jardín',
          entrada: nuevoTiempoReceta === 'entrada' ? nuevoNombreReceta.trim() : 'Entrada fresca de temporada según minuta del chef',
          fondo: nuevoTiempoReceta === 'fondo' ? nuevoNombreReceta.trim() : 'Plato de fondo noble con guarnición rústica',
          postre: nuevoTiempoReceta === 'postre' ? nuevoNombreReceta.trim() : 'Trilogía dulce artesanal de autor',
          trasnoche: nuevoTiempoReceta === 'trasnoche' ? nuevoNombreReceta.trim() : 'Estación de trasnoche: mini hamburguesas y consomé'
        },
        destacado: false,
        costoCalculadoDesdeRecetas: true
      };
      menuFinalId = nuevoId;
    }

    // Para Coffee Break: si existen en insumos, precargamos los insumos base para cálculo inmediato
    // de materia prima + merma en gramos
    let ingredientesIniciales: IngredienteReceta[] = [];
    let costoElaboracion = 500;

    if (esCoffeeBreak) {
      costoElaboracion = 824;
      const baseInsumos = [
        { insumoId: 'ins-tapaditos-ave', cantidad: 2, unidad: 'unidad' as const },
        { insumoId: 'ins-mini-pasteleria', cantidad: 3, unidad: 'unidad' as const },
        { insumoId: 'ins-cafe-grano', cantidad: 25, unidad: 'g' as const },
        { insumoId: 'ins-jugo-natural', cantidad: 0.25, unidad: 'L' as const }
      ];

      ingredientesIniciales = baseInsumos
        .filter(item => insumosMap.has(item.insumoId))
        .map((item, idx) => ({
          id: `ing-cb-${Date.now()}-${idx}`,
          insumoId: item.insumoId,
          cantidad: item.cantidad,
          unidad: item.unidad
        }));
    }

    // Determinar categoría final de la receta
    let categoriaFinal = nuevaCategoriaReceta;
    if (esCategoriaRecetaLibre && categoriaRecetaLibreInput.trim()) {
      categoriaFinal = categoriaRecetaLibreInput.trim();
      if (!categoriasRecetasPersonalizadas.some(c => c.toLowerCase() === categoriaFinal.toLowerCase())) {
        const actualizadas = [...categoriasRecetasPersonalizadas, categoriaFinal];
        setCategoriasRecetasPersonalizadas(actualizadas);
        try {
          localStorage.setItem(STORAGE_CATEGORIAS_RECETAS_KEY, JSON.stringify(actualizadas));
        } catch (err) {
          console.error(err);
        }
      }
    } else if (esCoffeeBreak && !esCategoriaRecetaLibre) {
      categoriaFinal = 'Servicio Alternativo';
    }

    const nueva: RecetaFichaTecnica = {
      id: 'rec-' + Date.now(),
      nombre: nuevoNombreReceta.trim(),
      tiempoMenu: tiempoFinal,
      categoria: categoriaFinal,
      rendimientoPorciones: 1,
      margenSugerido: 33, // 33% estándar de la industria
      costoAdicionalElaboracion: costoElaboracion,
      menuAsociadoId: esCoffeeBreak ? undefined : menuFinalId,
      servicioAsociadoId: esCoffeeBreak ? 'coffee-break-cocteleria' : undefined,
      ingredientes: ingredientesIniciales,
      descripcionProcedimiento: esCoffeeBreak
        ? 'Estación de Coffee Break / Coctelería con café en grano recién molido, bocados salados y pastelería fina.'
        : undefined
    };

    // Calcular costo real por persona (materia prima + merma en gramos + costo adicional)
    const calculo = calcularCostoReceta(nueva, insumos);

    // Si se creó un menú nuevo, registrarlo con el costo calculado
    if (nuevoMenuCreado) {
      nuevoMenuCreado.costoPersona = calculo.costoPorPorcion;
      nuevoMenuCreado.precioSugeridoPersona = calculo.precioSugeridoVenta;
      if (onAddMenu) {
        onAddMenu(nuevoMenuCreado);
      }
      if (onSincronizarCostosMenu) {
        onSincronizarCostosMenu(nuevoMenuCreado.id, calculo.costoPorPorcion);
      }
    }

    onAddReceta(nueva);
    setRecetaSeleccionadaId(nueva.id);
    setModalNuevaRecetaOpen(false);
    setNuevoNombreReceta('');
    setNombreNuevoMenu('');
    setDescripcionNuevoMenu('');
    setModoMenuReceta('existente');
    setEsTiempoNuevoLibre(false);
    setTiempoLibreInput('');
    setEsCategoriaRecetaLibre(false);
    setCategoriaRecetaLibreInput('');

    // Si es Coffee Break, inyectar directamente en la tarjeta de Tarifas Generales
    if (esCoffeeBreak && onVincularCoffeeBreak) {
      onVincularCoffeeBreak(nueva, calculo.costoPorPorcion, calculo.precioSugeridoVenta);
      notificar(`✓ Costo de ${formatMoneda(calculo.costoPorPorcion)}/pax inyectado directamente en Tarifas Generales`);
    } else if (nuevoMenuCreado) {
      notificar(`✓ ¡Menú "${nuevoMenuCreado.nombre}" creado y vinculado con la ficha "${nueva.nombre}"!`);
    } else {
      notificar(`✓ Ficha técnica "${nueva.nombre}" creada con éxito`);
    }
  };

  const handleGuardarMenuDirecto = (nuevoMenu: MenuOption) => {
    if (onAddMenu) {
      onAddMenu(nuevoMenu);
      setNuevoMenuAsociadoId(nuevoMenu.id);
      notificar(`✓ Menú "${nuevoMenu.nombre}" creado e integrado al cotizador`);
    }
  };

  const handleEliminarMenu = (menuId: string, menuNombre: string) => {
    if (!onDeleteMenu) return;
    if (menus.length <= 1) {
      notificar('⚠️ Debe existir al menos un menú en el catálogo');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el menú "${menuNombre}"? Esta acción no se puede deshacer.`)) {
      onDeleteMenu(menuId);
      notificar(`✓ Menú "${menuNombre}" eliminado`);
      if (menuFiltroRecetas === menuId) {
        setMenuFiltroRecetas('todos');
      }
    }
  };

  const presetsMargen = [25, 30, 33, 35, 40, 45, 50];

  // ── ESTADO & LÓGICA: SERVICIO DE BEBESTIBLES, VINOS & BARRA POR PERSONA ──
  const [tabAgregarBebestible, setTabAgregarBebestible] = useState<'insumo' | 'receta' | 'libre'>('insumo');

  // Filtrar insumos específicos de bar / bebidas o todos los disponibles
  const insumosBebidas = useMemo(() => {
    const list = insumos.filter(i => {
      const cat = (i.categoria || '').toLowerCase();
      return cat.includes('licor') || cat.includes('bebida') || cat.includes('vino') || cat.includes('bar');
    });
    return list.length > 0 ? list : insumos;
  }, [insumos]);

  const [selectedInsumoBebId, setSelectedInsumoBebId] = useState<string>(insumosBebidas[0]?.id || insumos[0]?.id || '');
  const [insumoBebRatio, setInsumoBebRatio] = useState<number | string>(1);
  const [insumoBebUnidad, setInsumoBebUnidad] = useState<string>('botella');

  // Filtrar recetas específicas de cócteles / bar o todas las fichas técnicas
  const recetasCocteleria = useMemo(() => {
    const list = recetas.filter(r => {
      const t = (r.tiempoMenu || '').toLowerCase();
      const c = (r.categoria || '').toLowerCase();
      return t === 'coctel' || c.includes('bar') || c.includes('coctel') || c.includes('bebida');
    });
    return list.length > 0 ? list : recetas;
  }, [recetas]);

  const [selectedRecetaBebId, setSelectedRecetaBebId] = useState<string>(recetasCocteleria[0]?.id || recetas[0]?.id || '');
  const [recetaBebRatio, setRecetaBebRatio] = useState<number | string>(2);
  const [recetaBebUnidad, setRecetaBebUnidad] = useState<string>('trago');

  // Opción Libre
  const [libreBebNombre, setLibreBebNombre] = useState<string>('');
  const [libreBebRatio, setLibreBebRatio] = useState<number | string>(1);
  const [libreBebUnidad, setLibreBebUnidad] = useState<string>('copa / vaso');
  const [libreBebCosto, setLibreBebCosto] = useState<number | string>(1500);

  // Handlers para Bebestibles
  const handleToggleBebestible = (id: string) => {
    if (!onUpdateBebestibles) return;
    const actualizados = bebestibles.map(it =>
      it.id === id ? { ...it, incluido: it.incluido === false ? true : false } : it
    );
    onUpdateBebestibles(actualizados);
  };

  const handleUpdateRatioBebestible = (id: string, nuevoRatio: number) => {
    if (!onUpdateBebestibles) return;
    const actualizados = bebestibles.map(it =>
      it.id === id ? { ...it, cantidadPorPersona: nuevoRatio } : it
    );
    onUpdateBebestibles(actualizados);
  };

  const handleRemoveBebestible = (id: string) => {
    if (!onUpdateBebestibles) return;
    const actualizados = bebestibles.filter(it => it.id !== id);
    onUpdateBebestibles(actualizados);
  };

  const handleAddBebestibleDesdeInsumo = (insumoIdParam?: string) => {
    if (!onUpdateBebestibles) return;
    const targetId = insumoIdParam || selectedInsumoBebId;
    const insumo = insumos.find(i => i.id === targetId);
    if (!insumo) return;

    // Si ya existe, activarlo o informar
    const existente = bebestibles.find(it => it.insumoId === insumo.id);
    if (existente) {
      if (existente.incluido === false) {
        handleToggleBebestible(existente.id);
      }
      notificar(`✓ Bebestible "${insumo.nombre}" ya está en la barra`);
      return;
    }

    const nuevoItem: MenuItemRatio = {
      id: 'beb-ins-' + Date.now(),
      nombre: insumo.nombre,
      cantidadPorPersona: Number(insumoBebRatio) || 1,
      unidad: insumoBebUnidad,
      insumoId: insumo.id,
      costoUnitario: insumo.precioCompra,
      categoria: 'bebestible',
      tipoOrigen: 'insumo',
      incluido: true
    };
    onUpdateBebestibles([...bebestibles, nuevoItem]);
    notificar(`✓ Insumo "${insumo.nombre}" vinculado a la barra`);
  };

  const handleAddBebestibleDesdeReceta = (recetaIdParam?: string) => {
    if (!onUpdateBebestibles) return;
    const targetId = recetaIdParam || selectedRecetaBebId;
    const receta = recetas.find(r => r.id === targetId);
    if (!receta) return;

    const existente = bebestibles.find(it => it.recetaId === receta.id);
    if (existente) {
      if (existente.incluido === false) {
        handleToggleBebestible(existente.id);
      }
      notificar(`✓ Cóctel "${receta.nombre}" ya está en la barra`);
      return;
    }

    const { costoPorPorcion } = calcularCostoReceta(receta, insumos);
    const nuevoItem: MenuItemRatio = {
      id: 'beb-rec-' + Date.now(),
      nombre: receta.nombre,
      cantidadPorPersona: Number(recetaBebRatio) || 1,
      unidad: recetaBebUnidad,
      recetaId: receta.id,
      costoUnitario: costoPorPorcion,
      categoria: 'cocteleria',
      tipoOrigen: 'receta',
      incluido: true
    };
    onUpdateBebestibles([...bebestibles, nuevoItem]);
    notificar(`✓ Cóctel "${receta.nombre}" vinculado desde Ficha Técnica`);
  };

  const handleAddBebestibleLibre = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateBebestibles || !libreBebNombre.trim()) return;

    const nuevoItem: MenuItemRatio = {
      id: 'beb-lib-' + Date.now(),
      nombre: libreBebNombre.trim(),
      cantidadPorPersona: Number(libreBebRatio) || 1,
      unidad: libreBebUnidad,
      costoUnitario: Number(libreBebCosto) || 0,
      categoria: 'bebestible',
      tipoOrigen: 'libre',
      incluido: true
    };
    onUpdateBebestibles([...bebestibles, nuevoItem]);
    setLibreBebNombre('');
    notificar(`✓ Bebestible personalizado "${nuevoItem.nombre}" agregado`);
  };

  // Cálculo en vivo y sincronizado de cada bebestible (resolviendo dinámicamente costos de insumo o receta)
  const bebestiblesConCostoDinamico = useMemo(() => {
    return bebestibles.map(it => {
      let costoUnitarioCalculado = it.costoUnitario || 0;
      let detalleOrigen = 'Opción Libre';
      let tagColor = 'bg-amber-100 text-amber-800 border-amber-300';
      let iconoTipo = 'libre';

      if (it.insumoId) {
        const ins = insumosMap.get(it.insumoId);
        if (ins) {
          costoUnitarioCalculado = ins.precioCompra;
          detalleOrigen = `Insumo Maestro: ${ins.proveedor || 'Sin proveedor'}`;
          tagColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          iconoTipo = 'insumo';
        }
      } else if (it.recetaId) {
        const rec = recetas.find(r => r.id === it.recetaId);
        if (rec) {
          const calc = calcularCostoReceta(rec, insumos);
          costoUnitarioCalculado = calc.costoPorPorcion;
          detalleOrigen = `Ficha Técnica (${rec.tiempoMenu || 'coctel'})`;
          tagColor = 'bg-purple-100 text-purple-800 border-purple-300';
          iconoTipo = 'receta';
        }
      }

      const ratio = Number(it.cantidadPorPersona) || 0;
      const subtotalPP = ratio * costoUnitarioCalculado;
      const totalComprarEvento = Math.round(ratio * invitados * 10) / 10;
      const totalCostoEvento = subtotalPP * invitados;

      return {
        ...it,
        costoReal: costoUnitarioCalculado,
        detalleOrigen,
        tagColor,
        iconoTipo,
        subtotalPP,
        totalComprarEvento,
        totalCostoEvento
      };
    });
  }, [bebestibles, insumos, recetas, invitados]);

  const costoTotalBebestiblesPP = useMemo(() => {
    return bebestiblesConCostoDinamico
      .filter(it => it.incluido !== false)
      .reduce((s, it) => s + it.subtotalPP, 0);
  }, [bebestiblesConCostoDinamico]);

  const costoTotalBebestiblesEvento = costoTotalBebestiblesPP * invitados;

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {toastSync && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastSync}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">
              Costeo de Recetas & Fichas Técnicas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-600" />
            Calculadora de Recetas & Costeo de Menús
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Costea cada plato a partir de las materias primas del maestro. El costo total alimenta automáticamente el cotizador y el panel financiero.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setModalNuevoMenuOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 active:scale-95 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-700" />
            <span>+ Crear Nuevo Menú</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModoMenuReceta('existente');
              setModalNuevaRecetaOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Ficha / Receta</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN DE MENÚS EN CARTA CON OPCIÓN DE CREACIÓN & ELIMINACIÓN ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Menús Gastronómicos en Carta ({menus.length} opciones disponibles)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Menús disponibles para cotizar. Puedes crear nuevos menús o eliminar los que no necesites.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNuevoMenuOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-800" />
            <span>+ Nuevo Menú</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {menus.map((m) => {
            const numRecetas = recetas.filter(r => r.menuAsociadoId === m.id).length;
            const esActivoFiltro = menuFiltroRecetas === m.id;

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  esActivoFiltro
                    ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {m.categoria}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {numRecetas} recetas asociadas
                      </span>
                    </div>

                    {/* Botón Eliminar Menú */}
                    {onDeleteMenu && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarMenu(m.id, m.nombre);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Eliminar menú "${m.nombre}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {m.nombre}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {m.descripcion}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Costo Insumos</span>
                    <strong className="text-slate-800 font-bold tabular-nums">
                      {formatMoneda(m.costoPersona)}/pax
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Precio Sugerido</span>
                    <strong className="text-amber-900 font-bold tabular-nums">
                      {formatMoneda(m.precioSugeridoPersona)}/pax
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuFiltroRecetas(menuFiltroRecetas === m.id ? 'todos' : m.id)}
                  className={`mt-2.5 w-full py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center ${
                    esActivoFiltro
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {esActivoFiltro ? '✓ Viendo Recetas de este Menú' : 'Ver Recetas de este Menú'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explicación del Margen Gastronómico del 33% */}
      <div className="p-4 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/40 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-amber-950 block text-sm">
              Regla de Oro en Gastronomía: El Estándar del 33% de Food Cost
            </span>
            <p className="text-slate-600 mt-0.5">
              En banquetes y centros de eventos de alta cocina, se sugiere que el <strong>costo de los ingredientes represente un 33%</strong> del valor de venta del plato. Esto permite que el 67% restante cubra personal, energía, equipamiento y la ganancia neta de tu empresa. Sin embargo, <strong>la empresa tiene total libertad para fijar el margen que estime conveniente</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Recetas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Fichas Técnicas ({recetas.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">· Haz clic para costearla</span>
          </div>
          <button
            type="button"
            onClick={() => setModalNuevoMenuOpen(true)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir nuevo menú a la carta</span>
          </button>
        </div>

        {/* Filtros por Menú */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Menú:
          </span>
          <button
            type="button"
            onClick={() => setMenuFiltroRecetas('todos')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              menuFiltroRecetas === 'todos'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({recetas.length})
          </button>
          {menus.map(m => {
            const count = recetas.filter(r => r.menuAsociadoId === m.id).length;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMenuFiltroRecetas(m.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  menuFiltroRecetas === m.id
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{m.nombre}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${menuFiltroRecetas === m.id ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuFiltroRecetas('coffee-break')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              menuFiltroRecetas === 'coffee-break'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Coffee Break</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {(() => {
            const lista = menuFiltroRecetas === 'todos'
              ? recetas
              : menuFiltroRecetas === 'coffee-break'
                ? recetas.filter(r => r.tiempoMenu === 'coffee-break')
                : recetas.filter(r => r.menuAsociadoId === menuFiltroRecetas);

            if (lista.length === 0) {
              return (
                <div className="col-span-full py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  No hay recetas creadas para este menú aún.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (menuFiltroRecetas !== 'todos' && menuFiltroRecetas !== 'coffee-break') {
                        setNuevoMenuAsociadoId(menuFiltroRecetas);
                      }
                      setModoMenuReceta('existente');
                      setModalNuevaRecetaOpen(true);
                    }}
                    className="text-amber-700 font-bold underline hover:text-amber-800 ml-1"
                  >
                    Crear primera receta para este menú →
                  </button>
                </div>
              );
            }

            return lista.map((r) => {
              const isSelected = r.id === recetaSeleccionadaId;
              const calculo = calcularCostoReceta(r, insumos);
              const menusConEstaReceta = getMenusDeReceta(r);

              return (
                <div
                  key={r.id}
                  onClick={() => setRecetaSeleccionadaId(r.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-400 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      {r.tiempoMenu === 'coffee-break' ? (
                        <span className="inline-flex items-center gap-1 text-amber-900 font-extrabold">
                          <Coffee className="w-3 h-3 text-amber-700" />
                          Coffee Break / Coctelería
                        </span>
                      ) : (
                        formatearNombreTiempoMenu(r.tiempoMenu)
                      )}
                    </span>
                    <span className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">
                      {r.nombre}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 font-medium">Costo/pax:</span>
                      <span className="font-extrabold text-slate-800 tabular-nums">
                        {formatMoneda(calculo.costoPorPorcion)}
                      </span>
                    </div>

                    {/* Botón de Acción de Incorporación Automática (Coincidente con la interfaz deseada) */}
                    {r.tiempoMenu === 'coffee-break' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecetaSeleccionadaId(r.id);
                          if (onVincularCoffeeBreak) {
                            onVincularCoffeeBreak(r, calculo.costoPorPorcion, calculo.precioSugeridoVenta);
                            notificar(`✓ "${r.nombre}" vinculada a Tarifas Generales (${formatMoneda(calculo.costoPorPorcion)}/pax)`);
                          }
                        }}
                        className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Vinculada directamente a Tarifas Generales en el cotizador"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">Vinculada a Tarifas Generales</span>
                      </button>
                    ) : menusConEstaReceta.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecetaSeleccionadaId(r.id);
                          abrirModalIncorporarReceta(r);
                        }}
                        className="w-full py-1.5 px-2 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200 rounded-lg text-blue-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title={`Receta vinculada a: ${menusConEstaReceta.map(m => m.nombre).join(', ')}. Haz clic para agregar a más o gestionar.`}
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5] shrink-0" />
                        <span className="truncate">
                          En {menusConEstaReceta.length} {menusConEstaReceta.length === 1 ? 'menú' : 'menús'} · Agregar a más
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecetaSeleccionadaId(r.id);
                          abrirModalIncorporarReceta(r);
                        }}
                        className="w-full py-1.5 px-2 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Incorporar automáticamente esta receta al cotizador"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">+ Agregar a Menú</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            });
        })()}
      </div>
    </div>

      {/* DETALLE Y COSTEO DE LA RECETA SELECCIONADA */}
      {recetaActiva && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (2 Col): Ingredientes y Costeo */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header del plato */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative inline-flex items-center">
                    <select
                      value={recetaActiva.tiempoMenu}
                      onChange={(e) => {
                        const nuevo = e.target.value;
                        onUpdateReceta({
                          ...recetaActiva,
                          tiempoMenu: nuevo
                        });
                        notificar(`✓ Tiempo del plato actualizado a "${formatearNombreTiempoMenu(nuevo)}"`);
                      }}
                      className="px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200/80 text-amber-950 font-bold text-[11px] uppercase border border-amber-300 focus:outline-hidden cursor-pointer transition-colors"
                      title="Cambiar tiempo de este plato"
                    >
                      {todosLosTiempos.map(t => (
                        <option key={t.id} value={t.id}>
                          Tiempo: {t.label} {t.esPersonalizado ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector y visualizador de Categoría de la Receta */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={recetaActiva.categoria || 'Receta de Autor'}
                      onChange={(e) => {
                        const nueva = e.target.value;
                        onUpdateReceta({
                          ...recetaActiva,
                          categoria: nueva
                        });
                        notificar(`✓ Categoría actualizada a "${nueva}"`);
                      }}
                      className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200/80 text-blue-950 font-bold text-[11px] border border-blue-300 focus:outline-hidden cursor-pointer transition-colors"
                      title="Cambiar categoría de esta receta"
                    >
                      {todasLasCategoriasRecetas.map(cat => (
                        <option key={cat} value={cat}>
                          Categoría: {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {recetaActiva.tiempoMenu === 'coffee-break' ? (
                    <span className="text-xs text-amber-900 flex items-center gap-1 font-bold bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
                      Vinculado a: <strong>Tarifas Generales (Coffee Break / Coctelería)</strong>
                    </span>
                  ) : (
                    menuVinculado && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                        Vinculado a: <strong>{menuVinculado.nombre}</strong>
                      </span>
                    )
                  )}
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  {recetaActiva.nombre}
                </h2>
                {recetaActiva.descripcionProcedimiento && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {recetaActiva.descripcionProcedimiento}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Deseas eliminar la receta "${recetaActiva.nombre}"?`)) {
                    onDeleteReceta(recetaActiva.id);
                  }
                }}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg text-xs flex items-center gap-1 self-start sm:self-auto"
                title="Eliminar receta"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar Ficha</span>
              </button>
            </div>

            {/* Tabla de Ingredientes y Costos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ingredientes & Materia Prima ({recetaActiva.ingredientes.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Porción costeada: {recetaActiva.rendimientoPorciones} comensal
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Materia Prima</th>
                      <th className="py-2.5 px-3 text-right">Cantidad</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-center">Merma</th>
                      <th className="py-2.5 px-3 text-right">Costo Real</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recetaActiva.ingredientes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Esta receta aún no tiene ingredientes. Agrega materias primas usando el formulario de abajo.
                        </td>
                      </tr>
                    ) : (
                      recetaActiva.ingredientes.map((ing) => {
                        const ins = insumosMap.get(ing.insumoId);

                        // Si el ingrediente o insumo es de peso, aseguramos visualización en gramos (g) sin decimales confusos
                        const esPeso = ins?.unidadMedida === 'kg' || ing.unidad === 'g' || ing.unidad === 'kg';
                        const esUnidadNatural = ins?.unidadMedida === 'unidad' || ing.unidad === 'unidad';

                        // Conversión automática de '0,2 kg' a '200 g' y '0,008 kg' a '8 g'
                        const unidadVisual = esPeso ? 'g' : ing.unidad;
                        const cantidadVisual = (ing.unidad === 'kg') ? Math.round(ing.cantidad * 1000) : ing.cantidad;

                        // Objeto normalizado para el cálculo exacto del costo real
                        const ingParaCalculo = (ing.unidad === 'kg')
                          ? { ...ing, cantidad: cantidadVisual, unidad: 'g' as const }
                          : ing;

                        const { costoReal } = calcularCostoIngrediente(ingParaCalculo, ins);
                        const precioPorGramo = ins?.unidadMedida === 'kg' ? (ins.precioCompra / 1000) : null;

                        return (
                          <tr key={ing.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900">{ins?.nombre || 'Insumo eliminado'}</span>
                                {ins?.categoria && (
                                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${obtenerColorCategoria(ins.categoria).badge}`}>
                                    {formatearNombreCategoria(ins.categoria)}
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                Base: {formatMoneda(ins?.precioCompra || 0)}/{ins?.unidadMedida}
                                {precioPorGramo !== null && (
                                  <span className="text-amber-800 font-medium"> ({formatPrecioUnitario(precioPorGramo)}/g)</span>
                                )}
                                {ins?.proveedor && ` · ${ins.proveedor}`}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <InputNumeroCeldaRecetas
                                valorInicial={cantidadVisual}
                                onCambioConfirmado={(val) => {
                                  if (ing.unidad === 'kg') {
                                    // Guardar directamente migrado a gramos
                                    const recetaActualizada: RecetaFichaTecnica = {
                                      ...recetaActiva,
                                      ingredientes: recetaActiva.ingredientes.map(i =>
                                        i.id === ing.id ? { ...i, cantidad: val, unidad: 'g' } : i
                                      )
                                    };
                                    onUpdateReceta(recetaActualizada);
                                  } else {
                                    handleCantidadIngredienteChange(ing.id, val);
                                  }
                                }}
                                min={0.001}
                                className="w-20 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums focus:outline-hidden"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px] font-bold">
                              {unidadVisual}
                            </td>

                            <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">
                              {ins?.mermaPorcentaje || 0}%
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                              {formatMoneda(costoReal)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngrediente(ing.id)}
                                className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                title="Quitar ingrediente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50/60 font-bold border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-slate-700">
                        Subtotal Materia Prima (Insumos Nivel Plato)
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-amber-950 tabular-nums">
                        {formatMoneda(calculosReceta.costoMateriaPrima)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Desglose de Costo por Categoría Vinculada */}
            {desgloseCategorias.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-amber-600" />
                    Desglose por Categoría de Insumos (Vinculación Directa)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {desgloseCategorias.length} {desgloseCategorias.length === 1 ? 'categoría presente' : 'categorías presentes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {desgloseCategorias.map(item => {
                    const estilo = obtenerColorCategoria(item.categoria);
                    return (
                      <div
                        key={item.categoria}
                        className={`p-2 rounded-lg border ${estilo.border} ${estilo.bg} flex items-center justify-between gap-2`}
                      >
                        <div className="min-w-0">
                          <span className={`font-bold block text-xs truncate ${estilo.text}`}>
                            {item.nombreCategoria}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.porcentaje}% del costo ingredientes
                          </span>
                        </div>
                        <span className="font-black text-slate-900 tabular-nums text-xs shrink-0">
                          {formatMoneda(item.costo)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agregar nuevo ingrediente con selector de categorías vinculadas */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  Añadir Ingrediente desde el Maestro de Insumos:
                </span>

                {/* Filtro por Categoría de Insumo */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-medium">Filtrar por categoría:</span>
                  <select
                    value={categoriaFiltroIngrediente}
                    onChange={(e) => handleCambioCategoriaFiltro(e.target.value)}
                    className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="todas">Todas ({insumos.length})</option>
                    {categoriasDisponibles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                {/* Selector de insumo filtrado */}
                <div className="sm:col-span-2">
                  <select
                    value={insumoToAddId}
                    onChange={(e) => {
                      setInsumoToAddId(e.target.value);
                      const ins = insumosMap.get(e.target.value);
                      if (ins) {
                        if (ins.unidadMedida === 'kg') {
                          setUnidadToAdd('g');
                          setCantidadToAdd(200);
                        } else if (ins.unidadMedida === 'unidad') {
                          setUnidadToAdd('unidad');
                          setCantidadToAdd(2);
                        } else {
                          setUnidadToAdd(ins.unidadMedida as any);
                          setCantidadToAdd(1);
                        }
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    {insumosParaAgregar.length === 0 ? (
                      <option value="">No hay insumos en esta categoría</option>
                    ) : (
                      insumosParaAgregar.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} [{formatearNombreCategoria(i.categoria)}] ({formatMoneda(i.precioCompra)}/{i.unidadMedida}
                          {i.unidadMedida === 'kg' ? ` · ${formatPrecioUnitario(i.precioCompra / 1000)}/g` : ''})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cantidad y Unidad */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={cantidadToAdd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCantidadToAdd(e.target.value)}
                    onBlur={() => {
                      if (cantidadToAdd === '') setCantidadToAdd(1);
                    }}
                    placeholder="Cantidad"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums focus:outline-hidden"
                  />
                  <select
                    value={unidadToAdd}
                    onChange={(e) => setUnidadToAdd(e.target.value as any)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-mono text-xs focus:outline-hidden font-bold"
                  >
                    <option value="g">g (gramos)</option>
                    <option value="unidad">unidad / uds</option>
                    <option value="L">L (litros)</option>
                    <option value="ml">ml</option>
                  </select>
                </div>

                {/* Botón agregar */}
                <div>
                  <button
                    type="button"
                    disabled={!insumoToAddId}
                    onClick={handleAddIngrediente}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Costos Indirectos de Elaboración / Condimentos nivel plato */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Condimentos Menores y Especias (Nivel Plato)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sal marina, pimienta, hierbas frescas, fondos de cocción y microgreens por porción.
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <span className="text-slate-400 font-bold">$</span>
                  <InputNumeroCeldaRecetas
                    valorInicial={recetaActiva.costoAdicionalElaboracion || 0}
                    onCambioConfirmado={(val) => {
                      onUpdateReceta({
                        ...recetaActiva,
                        costoAdicionalElaboracion: Math.max(0, val)
                      });
                    }}
                    min={0}
                    className="w-24 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 tabular-nums focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">/pax</span>
                </div>
              </div>

              {/* Aviso claro anti-duplicidad */}
              <div className="pt-2 border-t border-slate-200/70 flex items-start gap-1.5 text-[11px] text-teal-800 bg-teal-50/70 p-2 rounded-lg border border-teal-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Control Anti-Duplicidad:</strong> El <strong>Gas y la Electricidad</strong> ya están integrados en tus <strong>Costos Fijos Operacionales (Módulo 06)</strong>. No los sumes aquí para no cobrarlos dos veces en la cotización.
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (1 Col): Panel Financiero del Plato & Margen 33% */}
          <div className="space-y-5">
            
            {/* Tarjeta de Costo Real de la Porción */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  Costo Real Porción (Food Cost)
                </span>
                <span className="text-[10px] font-bold text-slate-400">1 pax</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Costo de Producción del Plato
                </span>
                <div className="text-3xl font-black text-amber-400 tabular-nums mt-0.5">
                  {formatMoneda(calculosReceta.costoPorPorcion)}
                </div>
                <div className="text-[11px] text-slate-300 mt-2 flex justify-between border-t border-slate-800 pt-2">
                  <span>Materia prima:</span>
                  <span className="font-semibold tabular-nums">{formatMoneda(calculosReceta.costoMateriaPrima)}</span>
                </div>
              </div>

              {/* Selector de Margen con el botón destacado 33% */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-500" />
                    Margen Comercial de la Receta
                  </label>
                  <span className="text-xs font-black text-amber-700 tabular-nums">
                    {recetaActiva.margenSugerido}%
                  </span>
                </div>

                {/* BOTÓN ESTRELLA: Margen Recomendado 33% */}
                <button
                  type="button"
                  onClick={() => handleMargenChange(33)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all mb-2.5 ${
                    recetaActiva.margenSugerido === 33
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs ring-1 ring-amber-400'
                      : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Margen Gastronómico Estándar (33%)</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-amber-200/80 px-1.5 py-0.5 rounded">
                    Recomendado
                  </span>
                </button>

                {/* Presets libres para que la empresa decida */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {presetsMargen.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMargenChange(m)}
                      className={`py-1 text-[10px] font-bold rounded transition-colors ${
                        recetaActiva.margenSugerido === m
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={recetaActiva.margenSugerido}
                  onChange={(e) => handleMargenChange(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Precio sugerido de venta de la porción */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Precio Sugerido Venta Porción
                </span>
                <div className="text-xl font-black text-amber-950 tabular-nums">
                  {formatMoneda(calculosReceta.precioSugeridoVenta)}
                </div>
                <div className="flex justify-between text-[11px] text-amber-900 pt-1 border-t border-amber-200/50">
                  <span>Margen Bruto de Utilidad:</span>
                  <span className="font-bold tabular-nums">+{formatMoneda(calculosReceta.utilidadPorPorcion)}</span>
                </div>
              </div>
            </div>

            {/* VINCULACIÓN: SI ES COFFEE BREAK SE VINCULA A TARIFAS GENERALES, SI NO AL MENÚ DE BANQUETE */}
            {recetaActiva.tiempoMenu === 'coffee-break' ? (
              <div className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 rounded-2xl border border-amber-300 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Impacto en Tarifas Generales & Cotizador
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Servicio Destino:</span>
                    <strong className="text-amber-950 font-bold">Coffee Break / Coctelería</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Costo Unitario Ficha:</span>
                    <span className="font-extrabold text-amber-900 text-sm tabular-nums">
                      {formatMoneda(calculosReceta.costoPorPorcion)}/pax
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Invitados (Pax) activos:</span>
                    <span className="font-bold text-slate-800 font-mono">{invitados} pax</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                    <span className="font-bold text-slate-800">Total Desglosado:</span>
                    <span className="font-black text-amber-950 text-base tabular-nums">
                      {formatMoneda(calculosReceta.costoPorPorcion * invitados)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSincronizarCoffeeBreak}
                  className="w-full mt-2 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                  <span>Sincronizar Costo a Tarifas Generales</span>
                </button>
              </div>
            ) : menuVinculado ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Impacto en el Menú de Cotización
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Menú vinculado:</span>
                    <strong className="text-slate-900">{menuVinculado.nombre}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Platos costeados en este menú:</span>
                    <span className="font-bold text-slate-900">{calculoMenuCompleto.recetasEncontradas} recetas</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span>Costo Sumado de Recetas:</span>
                    <span className="font-extrabold text-blue-900 text-sm tabular-nums">
                      {formatMoneda(calculoMenuCompleto.costoMenuCalculado)}/pax
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Costo actual en cotizador:</span>
                    <span className="tabular-nums">{formatMoneda(menuVinculado.costoPersona)}/pax</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSincronizarAlCotizador}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                    <span>Actualizar Costo al Menú en Cotizador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirModalIncorporarReceta(recetaActiva)}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>+ Vincular a Otro Menú del Cotizador</span>
                  </button>

                  {onIrACotizador && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectMenu && menuVinculado) {
                          onSelectMenu(menuVinculado.id);
                        }
                        onIrACotizador();
                      }}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ver en Pantalla Principal (Cotizador) →</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Incorporar al Cotizador
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta receta aún no está vinculada al cotizador. Incorpórala para que su costo aparezca automáticamente en la pantalla principal para tus clientes.
                </p>

                <div className="p-3 bg-white/80 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Costo de Producción:</span>
                    <strong className="text-slate-900 font-bold tabular-nums">{formatMoneda(calculosReceta.costoPorPorcion)}/pax</strong>
                  </div>
                  <div className="flex justify-between text-amber-950">
                    <span>Venta Sugerida ({recetaActiva.margenSugerido}%):</span>
                    <strong className="text-amber-900 font-bold tabular-nums">{formatMoneda(calculosReceta.precioSugeridoVenta)}/pax</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => abrirModalIncorporarReceta(recetaActiva)}
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Incorporar al Cotizador (Pantalla Principal)</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal para Incorporar Receta al Cotizador (Pantalla Principal) */}
      {recetaAIncorporar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-md">
                    {formatearNombreTiempoMenu(recetaAIncorporar.tiempoMenu)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Vinculación Automática al Cotizador</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  Incorporar Receta al Cotizador
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vincula <strong>&quot;{recetaAIncorporar.nombre}&quot;</strong> a la pantalla principal para cotizar automáticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecetaAIncorporar(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumen del Costo de la Ficha Técnica */}
            {(() => {
              const calc = calcularCostoReceta(recetaAIncorporar, insumos);
              return (
                <div className="my-4 p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Costo de Insumos (Food Cost)</span>
                    <strong className="text-xl font-black text-amber-400 tabular-nums">
                      {formatMoneda(calc.costoPorPorcion)} <span className="text-xs text-slate-300 font-normal">/pax</span>
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Precio Venta Sugerido ({recetaAIncorporar.margenSugerido}%)</span>
                    <strong className="text-xl font-black text-emerald-400 tabular-nums">
                      {formatMoneda(calc.precioSugeridoVenta)} <span className="text-xs text-slate-300 font-normal">/pax</span>
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Tabs de Selección: ¿Crear Nuevo Menú o Agregar a Existente? */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMetodoIncorporar('nuevo-menu')}
                className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
                  metodoIncorporar === 'nuevo-menu'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Crear Nuevo Menú
              </button>
              <button
                type="button"
                onClick={() => setMetodoIncorporar('menu-existente')}
                className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
                  metodoIncorporar === 'menu-existente'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agregar a Menú Existente ({menus.length})
              </button>
            </div>

            {metodoIncorporar === 'nuevo-menu' ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Menú en el Cotizador (Pantalla Principal)
                  </label>
                  <input
                    type="text"
                    value={nombreNuevoMenuReceta}
                    onChange={(e) => setNombreNuevoMenuReceta(e.target.value)}
                    placeholder="Ej: Menú Filete de Res Gourmet o Lomo a lo pobre Premium"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                    <select
                      value={categoriaNuevoMenuReceta}
                      onChange={(e) => setCategoriaNuevoMenuReceta(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:outline-hidden"
                    >
                      <option value="premium">Premium ★</option>
                      <option value="formal">Formal</option>
                      <option value="campestre">Campestre</option>
                      <option value="cocktail">Cocktail</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tiempo que ocupa</label>
                    <select
                      value={tiempoAsignado}
                      onChange={(e) => setTiempoAsignado(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:outline-hidden"
                    >
                      <option value="fondo">Plato de Fondo</option>
                      <option value="entrada">Entrada</option>
                      <option value="postre">Postre</option>
                      <option value="coctel">Cóctel de Bienvenida</option>
                      <option value="trasnoche">Bajonativo / Trasnoche</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-slate-600 space-y-1">
                  <span className="font-bold text-amber-950 block text-[11px]">
                    ✓ Visualización en la Pantalla Principal:
                  </span>
                  <p className="text-[11px]">
                    Aparecerá una nueva tarjeta gastronómica en el Cotizador con costo de <strong>{formatMoneda(calcularCostoReceta(recetaAIncorporar, insumos).costoPorPorcion)}/pax</strong> y precio de venta sugerido de <strong>{formatMoneda(calcularCostoReceta(recetaAIncorporar, insumos).precioSugeridoVenta)}/pax</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selecciona el Menú del Cotizador al que se Incorpora
                  </label>
                  <select
                    value={menuDestinoId}
                    onChange={(e) => setMenuDestinoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:outline-hidden focus:border-amber-500"
                  >
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} [{m.categoria.toUpperCase()}] · Costo actual: {formatMoneda(m.costoPersona)}/pax
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiempo a asignar o complementar en este menú
                  </label>
                  <select
                    value={tiempoAsignado}
                    onChange={(e) => setTiempoAsignado(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:outline-hidden"
                  >
                    <option value="fondo">Plato de Fondo</option>
                    <option value="entrada">Entrada</option>
                    <option value="postre">Postre</option>
                    <option value="coctel">Cóctel de Bienvenida</option>
                    <option value="trasnoche">Bajonativo / Trasnoche</option>
                  </select>
                </div>

                {(() => {
                  const m = menus.find(menu => menu.id === menuDestinoId);
                  const calc = calcularCostoReceta(recetaAIncorporar, insumos);
                  const costoEstimado = (m?.costoPersona || 0) + calc.costoPorPorcion;
                  return (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-slate-600 space-y-1">
                      <span className="font-bold text-blue-950 block text-[11px]">
                        ✓ Actualización de Costo en Pantalla Principal:
                      </span>
                      <p className="text-[11px]">
                        El costo de <strong>{m?.nombre}</strong> en el cotizador se actualizará automáticamente a <strong>{formatMoneda(costoEstimado)}/pax</strong> integrando esta receta técnica.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Opciones Adicionales de Sincronización */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={establecerComoActivo}
                  onChange={(e) => setEstablecerComoActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                />
                <span>Fijar inmediatamente como el Menú Activo en la Pantalla Principal (Cotizador)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={irACotizadorAlTerminar}
                  onChange={(e) => setIrACotizadorAlTerminar(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                />
                <span>Ir directamente a la Pantalla Principal para ver la cotización al terminar</span>
              </label>
            </div>

            {/* Botones de Acción */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecetaAIncorporar(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarIncorporacion}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>✓ Confirmar e Incorporar al Cotizador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Receta */}
      {modalNuevaRecetaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ChefHat className="w-5 h-5 text-amber-600" />
              Nueva Ficha Técnica de Costeo
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Crea un plato o servicio y conéctalo al cotizador para que su costo se traslade en tiempo real.
            </p>

            <form onSubmit={handleCrearReceta} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Plato / Servicio</label>
                <input
                  type="text"
                  required
                  value={nuevoNombreReceta}
                  onChange={(e) => setNuevoNombreReceta(e.target.value)}
                  placeholder="Ej: Coffee Break Ejecutivo o Lomo al Horno"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* ── Categoría Libre para la Ficha Técnica de Costeo ── */}
              <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-700" />
                    Categoría de la Receta / Ficha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEsCategoriaRecetaLibre(!esCategoriaRecetaLibre);
                      if (!esCategoriaRecetaLibre) {
                        setCategoriaRecetaLibreInput('');
                      }
                    }}
                    className="text-[11px] font-bold text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {esCategoriaRecetaLibre ? '← Elegir de la lista' : '+ Nueva categoría libre'}
                  </button>
                </div>

                {esCategoriaRecetaLibre ? (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <input
                      type="text"
                      required={esCategoriaRecetaLibre}
                      autoFocus
                      value={categoriaRecetaLibreInput}
                      onChange={(e) => setCategoriaRecetaLibreInput(e.target.value)}
                      placeholder="Escribe tu categoría (ej: Platos de Fondo, Tapas & Pintxos, Repostería...)"
                      className="w-full px-3 py-2 border-2 border-blue-500 bg-white rounded-xl focus:outline-hidden font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-blue-800 font-medium block">
                      ✓ Esta categoría quedará registrada libremente para organizar tus recetas.
                    </span>
                  </div>
                ) : (
                  <select
                    value={nuevaCategoriaReceta}
                    onChange={(e) => {
                      if (e.target.value === '__NUEVA_CAT_RECETA__') {
                        setEsCategoriaRecetaLibre(true);
                        setCategoriaRecetaLibreInput('');
                      } else {
                        setNuevaCategoriaReceta(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium bg-white text-slate-800"
                  >
                    {todasLasCategoriasRecetas.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NUEVA_CAT_RECETA__">+ Escribir nueva categoría libre...</option>
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Tiempo del Menú</label>
                  <button
                    type="button"
                    onClick={() => {
                      setEsTiempoNuevoLibre(!esTiempoNuevoLibre);
                      if (!esTiempoNuevoLibre) {
                        setTiempoLibreInput('');
                      }
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {esTiempoNuevoLibre ? '← Elegir de la lista' : '+ Crear nuevo tiempo libre'}
                  </button>
                </div>

                {esTiempoNuevoLibre ? (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={tiempoLibreInput}
                      onChange={(e) => setTiempoLibreInput(e.target.value)}
                      placeholder="Ej: Aperitivo, Mesa Dulce, Estación de Quesos, Tornaboda, Once Criolla..."
                      className="w-full px-3 py-2 border border-amber-400 bg-amber-50/40 rounded-xl focus:bg-white focus:border-amber-600 focus:outline-hidden font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Este nuevo tiempo se creará y quedará guardado para todas tus fichas de costeo.
                    </span>
                  </div>
                ) : (
                  <select
                    value={nuevoTiempoReceta}
                    onChange={(e) => {
                      if (e.target.value === '__NUEVO_TIEMPO__') {
                        setEsTiempoNuevoLibre(true);
                        setTiempoLibreInput('');
                      } else {
                        setNuevoTiempoReceta(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium bg-white"
                  >
                    {todosLosTiempos.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label} {t.esPersonalizado ? '★ (Personalizado)' : ''}
                      </option>
                    ))}
                    <option value="__NUEVO_TIEMPO__">+ Escribir nuevo tiempo libre...</option>
                  </select>
                )}
              </div>

              {nuevoTiempoReceta === 'coffee-break' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destino de Vinculación</label>
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-amber-950 block text-xs">
                          Tarifas Generales · Coffee Break
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Inyección automática del costo por persona en la tarjeta de Tarifas
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                      Automático
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Menú al que pertenece</label>
                    
                    {/* Botón para alternar entre menú existente o nuevo */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setModoMenuReceta('existente')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          modoMenuReceta === 'existente'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Existente
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoMenuReceta('nuevo')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 ${
                          modoMenuReceta === 'nuevo'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-800 hover:text-amber-900 font-extrabold'
                        }`}
                      >
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        + Crear Nuevo Menú
                      </button>
                    </div>
                  </div>

                  {modoMenuReceta === 'existente' ? (
                    <div>
                      <select
                        value={nuevoMenuAsociadoId}
                        onChange={(e) => setNuevoMenuAsociadoId(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium bg-white"
                      >
                        {menus.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre} ({m.categoria})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Esta receta se sumará al costo total por persona de este menú.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 border-t border-slate-200 animate-in fade-in">
                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                        ✨ ¡Crearás un <strong>nuevo menú</strong> directamente con esta receta como primer plato!
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Nombre del Nuevo Menú <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={modoMenuReceta === 'nuevo'}
                          value={nombreNuevoMenu}
                          onChange={(e) => setNombreNuevoMenu(e.target.value)}
                          placeholder="Ej: Menú Criollo Campestre, Menú Gala Marina..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-amber-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            Formato
                          </label>
                          <select
                            value={categoriaNuevoMenu}
                            onChange={(e) => setCategoriaNuevoMenu(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-[11px] focus:outline-hidden"
                          >
                            <option value="formal">Banquete Formal</option>
                            <option value="campestre">Asado Campestre</option>
                            <option value="cocktail">Cóctel Dinámico</option>
                            <option value="premium">Menú Premium</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            Breve Descripción
                          </label>
                          <input
                            type="text"
                            value={descripcionNuevoMenu}
                            onChange={(e) => setDescripcionNuevoMenu(e.target.value)}
                            placeholder="Ej: Menú campestre a las brasas"
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-[11px] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevaRecetaOpen(false);
                    setModoMenuReceta('existente');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {modoMenuReceta === 'nuevo' && nuevoTiempoReceta !== 'coffee-break'
                      ? 'Crear Menú y Receta'
                      : 'Crear Receta'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: SERVICIO DE BEBESTIBLES, VINOS & BARRA POR PERSONA (CONSUMOS EXACTOS P.P.) ── */}
      <div className="bg-white rounded-2xl border border-purple-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Consumos Exactos p.p.
              </span>
              <span className="text-xs text-purple-700 font-semibold">
                Fichas Técnicas & Maestro de Insumos
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Wine className="w-5 h-5 text-purple-600" />
              <span>Servicio de Bebestibles, Vinos & Barra por Persona</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Botellas y gaseosas vinculadas al Maestro de Insumos (precio de compra y proveedor). Cócteles y tragos vinculados a Fichas Técnicas (costeo exacto en ml/g).
            </p>
          </div>

          {/* Badges de totales */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Total Barra / Comensal
              </span>
              <div className="text-base font-black text-purple-950 tabular-nums">
                {formatMoneda(costoTotalBebestiblesPP)} <span className="text-xs font-semibold text-purple-700">p.p.</span>
              </div>
            </div>

            <div className="bg-purple-900 text-white rounded-xl px-4 py-2 text-right shadow-xs">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
                Total Evento ({invitados} Pax)
              </span>
              <div className="text-base font-black text-white tabular-nums">
                {formatMoneda(costoTotalBebestiblesEvento)}
              </div>
            </div>
          </div>
        </div>

        {/* Atajos Rápidos Vinculados Directamente a Insumos y Recetas */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              ⚡ Catálogo Rápido: Activar bebestibles vinculados en 1 clic
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Vinculados a Insumos y Recetas reales
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Vino Tinto Cabernet */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeInsumo('ins-vino-reserva-tinto')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.insumoId === 'ins-vino-reserva-tinto' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Vino Reserva 750cc</span>
                <span className="text-[9px] opacity-80">Insumo: $4.600/bot</span>
              </div>
              <Wine className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 2. Cerveza Artesanal */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeInsumo('ins-cerveza-lager')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.insumoId === 'ins-cerveza-lager' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Cerveza 330cc</span>
                <span className="text-[9px] opacity-80">Insumo: $990/un</span>
              </div>
              <Beer className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 3. Bebidas Gaseosas 1.5L */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeInsumo('ins-gaseosa-15')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.insumoId === 'ins-gaseosa-15' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Gaseosas 1.5L</span>
                <span className="text-[9px] opacity-80">Insumo: $1.650/un</span>
              </div>
              <GlassWater className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 4. Pisco Sour Catedral */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeReceta('rec-pisco-sour-catedral')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.recetaId === 'rec-pisco-sour-catedral' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Pisco Sour Catedral</span>
                <span className="text-[9px] opacity-80">Ficha: Costeo porción</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 5. Mojito Cubano */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeReceta('rec-mojito-cubano')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.recetaId === 'rec-mojito-cubano' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Mojito Cubano</span>
                <span className="text-[9px] opacity-80">Ficha: Costeo porción</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 6. Aperol Spritz */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeReceta('rec-aperol-spritz')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.recetaId === 'rec-aperol-spritz' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Aperol Spritz</span>
                <span className="text-[9px] opacity-80">Ficha: Costeo porción</span>
              </div>
              <Wine className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 7. Gin Tonic Botánico */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeReceta('rec-gin-tonic-botanico')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.recetaId === 'rec-gin-tonic-botanico' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Gin Tonic Autor</span>
                <span className="text-[9px] opacity-80">Ficha: Costeo porción</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* 8. Agua Mineral */}
            <button
              type="button"
              onClick={() => handleAddBebestibleDesdeInsumo('ins-agua-mineral')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                bebestibles.some(it => it.insumoId === 'ins-agua-mineral' && it.incluido !== false)
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-bold block truncate text-[11px]">Agua Mineral 1.5L</span>
                <span className="text-[9px] opacity-80">Insumo: $890/un</span>
              </div>
              <GlassWater className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Formulario con 3 Pestañas para Vincular Bebestible */}
        <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-purple-200/70 pb-2 text-xs font-bold flex-wrap">
            <span className="text-purple-950 mr-1">Vincular Nuevo Ítem:</span>
            <button
              type="button"
              onClick={() => setTabAgregarBebestible('insumo')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                tabAgregarBebestible === 'insumo'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              1. Desde Maestro de Insumos (Botellas, Vinos, Gaseosas)
            </button>
            <button
              type="button"
              onClick={() => setTabAgregarBebestible('receta')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                tabAgregarBebestible === 'receta'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              2. Desde Fichas de Recetas (Cócteles & Tragos)
            </button>
            <button
              type="button"
              onClick={() => setTabAgregarBebestible('libre')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                tabAgregarBebestible === 'libre'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              3. Opción Libre
            </button>
          </div>

          {/* Modo 1: Insumos */}
          {tabAgregarBebestible === 'insumo' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Insumo Maestro (Toma costo real de compra)
                </label>
                <select
                  value={selectedInsumoBebId}
                  onChange={(e) => setSelectedInsumoBebId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
                >
                  {insumosBebidas.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} — {formatMoneda(i.precioCompra)}/{i.unidadMedida} ({i.proveedor || 'Sin proveedor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Ratio p.p. (Entero/Dec)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={insumoBebRatio}
                  onChange={(e) => setInsumoBebRatio(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                  placeholder="Ej: 0.5 o 2"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Unidad
                </label>
                <select
                  value={insumoBebUnidad}
                  onChange={(e) => setInsumoBebUnidad(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="botella">botella</option>
                  <option value="lata">lata</option>
                  <option value="vaso">vaso</option>
                  <option value="copa">copa</option>
                  <option value="L">L</option>
                  <option value="unidad">unidad</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={() => handleAddBebestibleDesdeInsumo()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular Insumo a Barra</span>
                </button>
              </div>
            </div>
          )}

          {/* Modo 2: Recetas */}
          {tabAgregarBebestible === 'receta' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Ficha Técnica de Cóctel (Costo calculado de ingredientes)
                </label>
                <select
                  value={selectedRecetaBebId}
                  onChange={(e) => setSelectedRecetaBebId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
                >
                  {recetasCocteleria.map((r) => {
                    const c = calcularCostoReceta(r, insumos);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.nombre} — {formatMoneda(c.costoPorPorcion)}/porción ({r.ingredientes.length} ingredientes)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Ratio p.p. (Entero/Dec)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={recetaBebRatio}
                  onChange={(e) => setRecetaBebRatio(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                  placeholder="Ej: 2"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Unidad
                </label>
                <select
                  value={recetaBebUnidad}
                  onChange={(e) => setRecetaBebUnidad(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="trago">trago</option>
                  <option value="copa">copa</option>
                  <option value="vaso">vaso</option>
                  <option value="porción">porción</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={() => handleAddBebestibleDesdeReceta()}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular Receta a Barra</span>
                </button>
              </div>
            </div>
          )}

          {/* Modo 3: Libre */}
          {tabAgregarBebestible === 'libre' && (
            <form onSubmit={handleAddBebestibleLibre} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Nombre Personalizado (Opción Libre)
                </label>
                <input
                  type="text"
                  value={libreBebNombre}
                  onChange={(e) => setLibreBebNombre(e.target.value)}
                  placeholder="Ej: Coctelería temática especial, Whisky 12 Años..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Ratio p.p.
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={libreBebRatio}
                  onChange={(e) => setLibreBebRatio(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Unidad
                </label>
                <select
                  value={libreBebUnidad}
                  onChange={(e) => setLibreBebUnidad(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="copa / vaso">copa / vaso</option>
                  <option value="botella">botella</option>
                  <option value="trago">trago</option>
                  <option value="lata">lata</option>
                  <option value="unidad">unidad</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={libreBebCosto}
                  onChange={(e) => setLibreBebCosto(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:outline-hidden tabular-nums"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                  title="Añadir opción libre"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tabla de Bebestibles Activos & Ratios */}
        {bebestiblesConCostoDinamico.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">Activo</th>
                  <th className="py-2.5 px-3">Bebestible / Líquido</th>
                  <th className="py-2.5 px-3">Origen / Vinculación</th>
                  <th className="py-2.5 px-3 text-center">Ratio p.p. (Entero/Dec)</th>
                  <th className="py-2.5 px-3 text-center">Total Compras ({invitados} Pax)</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit. Real</th>
                  <th className="py-2.5 px-3 text-right">Subtotal p.p.</th>
                  <th className="py-2.5 px-3 text-right">Total Barra</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bebestiblesConCostoDinamico.map((item) => {
                  const estaActivo = item.incluido !== false;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${estaActivo ? 'hover:bg-purple-50/30' : 'bg-slate-50/70 opacity-60'}`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={estaActivo}
                          onChange={() => handleToggleBebestible(item.id)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          title={estaActivo ? 'Desactivar de esta cotización' : 'Activar en esta cotización'}
                        />
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.nombre}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                          {item.iconoTipo === 'insumo' && <Wine className="w-3 h-3 text-emerald-700" />}
                          {item.iconoTipo === 'receta' && <Sparkles className="w-3 h-3 text-purple-700" />}
                          {item.iconoTipo === 'libre' && <Tag className="w-3 h-3 text-amber-700" />}
                          <span>{item.detalleOrigen}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1 font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.cantidadPorPersona}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value.replace(',', '.'));
                              handleUpdateRatioBebestible(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-14 text-center bg-white font-black text-slate-900 rounded border border-slate-300 py-0.5 focus:outline-hidden text-xs"
                          />
                          <span className="text-[10px] text-slate-600 font-medium">{item.unidad}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800 tabular-nums">
                        {item.totalComprarEvento} {item.unidad}s
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                        {formatMoneda(item.costoReal)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatMoneda(item.subtotalPP)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-purple-950 tabular-nums">
                        {formatMoneda(item.totalCostoEvento)}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBebestible(item.id)}
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
                  <td colSpan={6} className="py-2.5 px-3 text-slate-700 text-right">
                    Subtotal Activo por Comensal:
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-purple-950 tabular-nums text-sm">
                    {formatMoneda(costoTotalBebestiblesPP)}/pax
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-purple-950 tabular-nums text-sm">
                    {formatMoneda(costoTotalBebestiblesEvento)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
            No has agregado bebestibles para este menú aún. Selecciona cualquiera de las opciones rápidas de arriba o vincula directamente insumos o recetas.
          </div>
        )}
      </div>

      {/* ── BRIGADA DE SERVICIO & PERSONAL DE OPERACIONES EN RECETA Y COSTEO ── */}
      {tarifasStaff && personal && onChangePersonal && (
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-3">
            <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest block">
              Costeo Operativo del Evento
            </span>
            <p className="text-xs text-slate-500">
              Planifica la dotación de garzones, cocineros, aseo y maître para la ejecución de los menús ({invitados} Pax).
            </p>
          </div>
          <Modulo2Personal
            tarifas={tarifasStaff}
            personal={personal}
            onChangePersonal={onChangePersonal}
            invitados={invitados}
          />
        </div>
      )}

      {/* Modal independiente para Crear Nuevo Menú Completo */}
      <ModalCrearMenu
        isOpen={modalNuevoMenuOpen}
        onClose={() => setModalNuevoMenuOpen(false)}
        onGuardarMenu={handleGuardarMenuDirecto}
        recetasDisponibles={recetas}
        insumosDisponibles={insumos}
        invitadosReferencia={invitados}
      />
    </div>
  );
};
