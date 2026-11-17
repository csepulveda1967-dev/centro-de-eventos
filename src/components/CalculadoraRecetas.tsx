import React, { useState, useMemo, useEffect } from 'react';
import { RecetaFichaTecnica, InsumoMaestro, MenuOption, IngredienteReceta, MenuItemRatio, Mesa } from '../types';
import {
  calcularCostoReceta,
  calcularCostoIngrediente,
  calcularCostoMenuDesdeRecetas,
  calcularDesglosePorCategoria,
  recetaPerteneceAMenu,
  formatearNombreCategoria,
  obtenerColorCategoria,
  CATEGORIAS_INSUMOS_DEFAULT,
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
  ChevronDown,
  Pencil,
  ListPlus,
  X,
  Check,
  Save,
  FileSpreadsheet,
  Boxes,
  PackagePlus,
  LayoutGrid,
  Users
} from 'lucide-react';
import { Modulo2Personal } from './Modulo2Personal';
import { StaffTarifas } from '../types';
import { ModalCargaMasivaRecetas } from './ModalCargaMasivaRecetas';

interface CalculadoraRecetasProps {
  recetas: RecetaFichaTecnica[];
  insumos: InsumoMaestro[];
  menus: MenuOption[];
  invitados?: number;
  mesas?: Mesa[];
  onUpdateReceta: (recetaActualizada: RecetaFichaTecnica) => void;
  onAddReceta: (nuevaReceta: RecetaFichaTecnica) => void;
  onDeleteReceta: (id: string) => void;
  onSincronizarCostosMenu: (menuId: string, nuevoCosto: number) => void;
  onVincularCoffeeBreak?: (receta: RecetaFichaTecnica, costoPorPorcion: number, precioSugerido: number) => void;
  onAddMenu?: (nuevoMenu: MenuOption) => void;
  onDeleteMenu?: (menuId: string) => void;
  onUpdateMenu?: (menuActualizado: MenuOption) => void;
  // Vinculación directa con Maestro de Insumos para crear productos libremente
  onAddInsumo?: (nuevoInsumo: InsumoMaestro) => void;
  onIrAMaestroInsumos?: () => void;
  // Vinculación de Costo de Mesa al cotizador (escala con invitados/pax)
  costoMesaVinculadoId?: string;
  incluirCostoMesa?: boolean;
  onVincularCostoMesa?: (receta: RecetaFichaTecnica) => void;
  onToggleIncluirCostoMesa?: (incluir: boolean) => void;
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
  // Bebestibles gestionados en el Módulo 1 (Menús); se reciben por compatibilidad
  bebestibles?: MenuItemRatio[];
  onUpdateBebestibles?: (nuevos: MenuItemRatio[]) => void;
  menuSeleccionadoId?: string;
  onSelectMenu?: (menuId: string) => void;
  onIrACotizador?: () => void;
  esDemoIsidora?: boolean;
  onImportarRecetas?: (nuevasRecetas: RecetaFichaTecnica[], modo: 'agregar' | 'reemplazar') => void;
  onRestablecerRecetas?: () => void;
  nombreEmpresa?: string;
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

// ── Fichas Técnicas: etiquetas y utilidades para agrupar por categoría ──
const SECCIONES_FICHAS_ETIQUETAS: Record<string, string> = {
  coctel: 'Bebestibles & Cócteles',
  entrada: 'Entradas',
  fondo: 'Platos de Fondo',
  postre: 'Postres',
  trasnoche: 'Trasnoche / Bajón',
  'coffee-break': 'Coffee Break / Coctelería',
  'costo-mesa': 'Costo de Mesa (Montaje por Mesa)',
  general: 'Sin categoría'
};

const slugCategoriaFicha = (valor: string) =>
  (valor || '').trim().toLowerCase().replace(/\s+/g, '_');

export const CalculadoraRecetas: React.FC<CalculadoraRecetasProps> = ({
  recetas,
  insumos,
  menus,
  invitados = 100,
  mesas = [],
  onUpdateReceta,
  onAddReceta,
  onDeleteReceta,
  onSincronizarCostosMenu,
  onVincularCoffeeBreak,
  onAddMenu,
  onDeleteMenu,
  onUpdateMenu,
  onAddInsumo,
  onIrAMaestroInsumos,
  costoMesaVinculadoId,
  incluirCostoMesa = true,
  onVincularCostoMesa,
  onToggleIncluirCostoMesa,
  tarifasStaff,
  personal,
  onChangePersonal,
  menuSeleccionadoId,
  onSelectMenu,
  onIrACotizador,
  esDemoIsidora = false,
  onImportarRecetas,
  onRestablecerRecetas,
  nombreEmpresa = 'Doña Isidora Eventos'
}) => {
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string>(recetas[0]?.id || '');
  const [toastSync, setToastSync] = useState<string | null>(null);
  const [isModalCargaRecetasOpen, setIsModalCargaRecetasOpen] = useState<boolean>(false);

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

  // Edición rápida de categoría libre en la ficha activa
  const [editandoCatLibreActiva, setEditandoCatLibreActiva] = useState(false);
  const [catLibreActivaInput, setCatLibreActivaInput] = useState('');

  // ── Creación libre de producto en Maestro de Insumos desde Recetas & Costeo ──
  const STORAGE_CATS_INSUMOS_KEY = 'hlr_categorias_personalizadas_insumos';
  const [categoriasInsumosPersonalizadas, setCategoriasInsumosPersonalizadas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATS_INSUMOS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [panelNuevoProductoOpen, setPanelNuevoProductoOpen] = useState(false);
  const [npNombre, setNpNombre] = useState('');
  const [npCategoria, setNpCategoria] = useState('montaje_mesa');
  const [npEsCategoriaLibre, setNpEsCategoriaLibre] = useState(false);
  const [npCategoriaLibreInput, setNpCategoriaLibreInput] = useState('');
  const [npUnidadCompra, setNpUnidadCompra] = useState<InsumoMaestro['unidadMedida']>('unidad');
  const [npPrecioCompra, setNpPrecioCompra] = useState<number | string>('');
  const [npMerma, setNpMerma] = useState<number | string>(0);
  const [npProveedor, setNpProveedor] = useState('');
  const [npCantidadReceta, setNpCantidadReceta] = useState<number | string>(10);
  const [npIncluirEnFicha, setNpIncluirEnFicha] = useState(true);
  const [npError, setNpError] = useState('');

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
      'Montaje & Servicio de Mesa',
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
  const [modoMenuReceta, setModoMenuReceta] = useState<'existente' | 'nuevo' | 'libre'>('existente');
  const [nombreNuevoMenu, setNombreNuevoMenu] = useState('');
  const [categoriaNuevoMenu, setCategoriaNuevoMenu] = useState<'formal' | 'campestre' | 'cocktail' | 'premium'>('formal');
  const [descripcionNuevoMenu, setDescripcionNuevoMenu] = useState('');

  // Modal independiente para crear nuevo menú
  const [modalNuevoMenuOpen, setModalNuevoMenuOpen] = useState(false);

  // Filtro de recetas por menú
  const [menuFiltroRecetas, setMenuFiltroRecetas] = useState<string>('todos');

  // ── Fichas Técnicas: secciones desplegables por categoría ──
  const STORAGE_SECCIONES_FICHAS_KEY = 'hlr_fichas_secciones_abiertas';
  const [seccionesFichasAbiertas, setSeccionesFichasAbiertas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SECCIONES_FICHAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mostrarNuevaCategoriaFicha, setMostrarNuevaCategoriaFicha] = useState(false);
  const [nuevaCategoriaFichaInput, setNuevaCategoriaFichaInput] = useState('');

  const guardarSeccionesFichasAbiertas = (nuevas: string[]) => {
    setSeccionesFichasAbiertas(nuevas);
    try {
      localStorage.setItem(STORAGE_SECCIONES_FICHAS_KEY, JSON.stringify(nuevas));
    } catch (e) {
      console.error('Error guardando secciones de fichas en localStorage:', e);
    }
  };

  const toggleSeccionFicha = (key: string) => {
    const nuevas = seccionesFichasAbiertas.includes(key)
      ? seccionesFichasAbiertas.filter(k => k !== key)
      : [...seccionesFichasAbiertas, key];
    guardarSeccionesFichasAbiertas(nuevas);
  };

  const abrirSeccionFicha = (key: string) => {
    if (!seccionesFichasAbiertas.includes(key)) {
      guardarSeccionesFichasAbiertas([...seccionesFichasAbiertas, key]);
    }
  };

  // Menú que se está editando en el ModalCrearMenu (modo edición)
  const [menuAEditar, setMenuAEditar] = useState<MenuOption | null>(null);

  // ── MODAL: AGREGAR FICHA TÉCNICA A MENÚS (creados o por crear) ──
  const [modalAgregarMenuOpen, setModalAgregarMenuOpen] = useState(false);
  const [fichaParaMenus, setFichaParaMenus] = useState<RecetaFichaTecnica | null>(null);
  const [menusElegidosModal, setMenusElegidosModal] = useState<string[]>([]);
  const [crearMenuDesdeModal, setCrearMenuDesdeModal] = useState(false);
  const [nombreMenuModal, setNombreMenuModal] = useState('');
  const [categoriaMenuModal, setCategoriaMenuModal] = useState<'formal' | 'campestre' | 'cocktail' | 'premium'>('formal');
  const [descripcionMenuModal, setDescripcionMenuModal] = useState('');

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

  // Menú vinculado a la receta activa (menú principal)
  const menuVinculado = menus.find(m => m.id === recetaActiva?.menuAsociadoId);
  const calculoMenuCompleto = menuVinculado
    ? calcularCostoMenuDesdeRecetas(menuVinculado.id, recetas, insumos)
    : { costoMenuCalculado: 0, recetasEncontradas: 0 };

  // TODOS los menús donde la ficha activa está vinculada (vinculación múltiple)
  const menusDeFichaActiva = useMemo(() => {
    if (!recetaActiva) return [];
    return menus.filter(m => recetaPerteneceAMenu(recetaActiva, m.id));
  }, [recetaActiva, menus]);

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

  // Consolidar TODAS las categorías del Maestro de Insumos (para crear productos libremente)
  const todasLasCategoriasInsumos = useMemo(() => {
    const lista: { id: string; label: string }[] = [];
    const vistos = new Set<string>();

    const agregar = (id: string, label: string) => {
      const slug = id.trim().toLowerCase().replace(/\s+/g, '_');
      if (!slug || vistos.has(slug)) return;
      vistos.add(slug);
      lista.push({ id: slug, label });
    };

    CATEGORIAS_INSUMOS_DEFAULT.forEach(c => agregar(c.id, c.label));
    categoriasInsumosPersonalizadas.forEach(c => agregar(c, c.trim()));
    insumos.forEach(i => {
      if (i.categoria) agregar(i.categoria, formatearNombreCategoria(i.categoria));
    });

    return lista;
  }, [insumos, categoriasInsumosPersonalizadas]);

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

  // Crear producto libremente en Maestro de Insumos e incluirlo de inmediato en la ficha activa
  const handleCrearProductoEnMaestro = () => {
    if (!onAddInsumo) return;
    if (!npNombre.trim()) {
      setNpError('⚠️ Escribe el nombre del producto (ej: Pan Amasado Mini, Servilletas Tela...)');
      return;
    }
    const precioNum = typeof npPrecioCompra === 'number'
      ? npPrecioCompra
      : parseFloat(String(npPrecioCompra).replace(/\./g, '').replace(',', '.')) || 0;
    if (precioNum <= 0) {
      setNpError('⚠️ Ingresa el precio de compra real (ej: 250 o 4500)');
      return;
    }

    let categoriaFinal = npCategoria;
    if (npEsCategoriaLibre && npCategoriaLibreInput.trim()) {
      const catNombre = npCategoriaLibreInput.trim();
      const slug = catNombre.toLowerCase().replace(/\s+/g, '_');
      categoriaFinal = slug;
      if (!categoriasInsumosPersonalizadas.some(c => c.toLowerCase() === catNombre.toLowerCase())) {
        const actualizadas = [...categoriasInsumosPersonalizadas, catNombre];
        setCategoriasInsumosPersonalizadas(actualizadas);
        try {
          localStorage.setItem(STORAGE_CATS_INSUMOS_KEY, JSON.stringify(actualizadas));
        } catch (err) {
          console.error(err);
        }
      }
    }

    const mermaNum = typeof npMerma === 'number' ? npMerma : parseFloat(String(npMerma)) || 0;
    const nuevoInsumo: InsumoMaestro = {
      id: 'ins-' + Date.now(),
      nombre: npNombre.trim(),
      categoria: categoriaFinal,
      unidadMedida: npUnidadCompra,
      precioCompra: Math.max(0, precioNum),
      mermaPorcentaje: Math.max(0, Math.min(99, mermaNum)),
      proveedor: npProveedor.trim() || 'Proveedor Local',
      ultimoCambio: new Date().toISOString().slice(0, 10)
    };

    onAddInsumo(nuevoInsumo);
    setInsumoToAddId(nuevoInsumo.id);
    setCategoriaFiltroIngrediente('todas');

    // Incluir inmediatamente en la ficha activa si está marcado y la cantidad es > 0
    if (npIncluirEnFicha && recetaActiva) {
      const cantNum = typeof npCantidadReceta === 'number'
        ? npCantidadReceta
        : parseFloat(String(npCantidadReceta).replace(',', '.')) || 0;
      if (cantNum > 0) {
        const unidadIngrediente: IngredienteReceta['unidad'] =
          npUnidadCompra === 'paquete'
            ? 'unidad'
            : (npUnidadCompra === 'kg' ? 'g' : npUnidadCompra);
        const cantidadFinal = npUnidadCompra === 'kg' ? cantNum : cantNum;
        const nuevoIng: IngredienteReceta = {
          id: 'ing-' + (Date.now() + 1),
          insumoId: nuevoInsumo.id,
          cantidad: cantidadFinal,
          unidad: unidadIngrediente
        };
        const recetaActualizada: RecetaFichaTecnica = {
          ...recetaActiva,
          ingredientes: [...recetaActiva.ingredientes, nuevoIng]
        };
        onUpdateReceta(recetaActualizada);
        syncSiEsCoffeeBreak(recetaActualizada);
      }
    }

    setNpError('');
    setNpNombre('');
    setNpPrecioCompra('');
    setNpMerma(0);
    setNpProveedor('');
    setNpEsCategoriaLibre(false);
    setNpCategoriaLibreInput('');
    setPanelNuevoProductoOpen(false);
    notificar(`✓ Producto "${nuevoInsumo.nombre}" creado en Maestro de Insumos e incluido en esta ficha`);
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
    const esCostoMesa = tiempoFinal === 'costo-mesa';
    const esServicioEspecial = esCoffeeBreak || esCostoMesa;
    const esRecetaLibre = !esServicioEspecial && (modoMenuReceta === 'libre' || (modoMenuReceta === 'existente' && !nuevoMenuAsociadoId));
    let menuFinalId = nuevoMenuAsociadoId;

    // Si el usuario eligió crear un nuevo menú para esta receta
    let nuevoMenuCreado: MenuOption | null = null;
    if (!esServicioEspecial && modoMenuReceta === 'nuevo') {
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

    // Para Coffee Break o Costo de Mesa: precargamos los insumos base si existen en Maestro
    let ingredientesIniciales: IngredienteReceta[] = [];
    let costoElaboracion = 500;
    let rendimientoPorcionesFinal = 1;

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
    } else if (esCostoMesa) {
      costoElaboracion = 0;
      rendimientoPorcionesFinal = 10; // Base 1 mesa de 10 comensales
      const baseMesaInsumos = [
        { insumoId: 'ins-pan-mesa', cantidad: 20, unidad: 'unidad' as const },
        { insumoId: 'ins-pebre-casero', cantidad: 350, unidad: 'g' as const },
        { insumoId: 'ins-mantequilla', cantidad: 150, unidad: 'g' as const },
        { insumoId: 'ins-servilletas-mesa', cantidad: 15, unidad: 'unidad' as const }
      ];

      ingredientesIniciales = baseMesaInsumos
        .filter(item => insumosMap.has(item.insumoId))
        .map((item, idx) => ({
          id: `ing-mesa-${Date.now()}-${idx}`,
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
    } else if (esCostoMesa && !esCategoriaRecetaLibre) {
      categoriaFinal = 'Montaje & Servicio de Mesa';
    }

    const nueva: RecetaFichaTecnica = {
      id: 'rec-' + Date.now(),
      nombre: nuevoNombreReceta.trim(),
      tiempoMenu: tiempoFinal,
      categoria: categoriaFinal,
      rendimientoPorciones: rendimientoPorcionesFinal,
      margenSugerido: 33, // 33% estándar de la industria
      costoAdicionalElaboracion: costoElaboracion,
      menuAsociadoId: (esServicioEspecial || esRecetaLibre) ? undefined : (menuFinalId || undefined),
      menusAsociadosIds: (esServicioEspecial || esRecetaLibre) ? undefined : (menuFinalId ? [menuFinalId] : undefined),
      servicioAsociadoId: esCoffeeBreak ? 'coffee-break-cocteleria' : (esCostoMesa ? 'costo-mesa' : undefined),
      ingredientes: ingredientesIniciales,
      descripcionProcedimiento: esCoffeeBreak
        ? 'Estación de Coffee Break / Coctelería con café en grano recién molido, bocados salados y pastelería fina.'
        : esCostoMesa
        ? 'Cálculo interno del costo de montaje por mesa (panera con pan, pebre, mantequilla y servilletas). Se actualiza con los pax cotizados.'
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
    if (esCostoMesa) {
      abrirSeccionFicha('costo-mesa');
    }
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
    } else if (esCostoMesa) {
      if (onVincularCostoMesa) {
        onVincularCostoMesa(nueva);
      }
      notificar(`✓ Ficha Costo de Mesa "${nueva.nombre}" creada y vinculada (${formatMoneda(calculo.costoTotalReceta)}/mesa)`);
    } else if (esRecetaLibre) {
      notificar(`✓ Ficha libre creada sin menú asignado: "${nueva.nombre}"`);
    } else if (nuevoMenuCreado) {
      notificar(`✓ ¡Menú "${nuevoMenuCreado.nombre}" creado y vinculado con la ficha "${nueva.nombre}"!`);
    } else {
      notificar(`✓ Ficha técnica "${nueva.nombre}" creada con éxito`);
    }
  };

  const handleGuardarMenuDirecto = (nuevoMenu: MenuOption) => {
    if (menuAEditar && onUpdateMenu) {
      onUpdateMenu(nuevoMenu);
      notificar(`✓ Menú "${nuevoMenu.nombre}" actualizado correctamente`);
      setMenuAEditar(null);
      return;
    }
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

  // ── VINCULACIÓN FICHA → MENÚS (creados o por crear) ──
  const abrirModalAgregarMenu = (receta: RecetaFichaTecnica) => {
    // Las fichas de Coffee Break tributan a Tarifas Generales y las de Costo de Mesa al montaje de mesas
    if (receta.tiempoMenu === 'coffee-break') {
      notificar('ℹ️ Las fichas de Coffee Break se vinculan automáticamente a Tarifas Generales (no a los menús)');
      return;
    }
    if (receta.tiempoMenu === 'costo-mesa') {
      notificar('ℹ️ Las fichas de Costo de Mesa se vinculan directamente al cálculo interno de mesas y pax en el panel derecho');
      return;
    }
    setFichaParaMenus(receta);
    // Solo precargar vinculaciones que apuntan a menús que EXISTEN hoy en la carta.
    // (Limpia enlaces "fantasma" a menús eliminados o de otra plantilla: es la causa
    //  de que las fichas aparecieran desvinculadas y los menús con 0 fichas.)
    const iniciales = new Set<string>(
      (receta.menusAsociadosIds || []).filter(id => menus.some(m => m.id === id))
    );
    if (receta.menuAsociadoId && menus.some(m => m.id === receta.menuAsociadoId)) {
      iniciales.add(receta.menuAsociadoId);
    }
    setMenusElegidosModal(Array.from(iniciales));
    setCrearMenuDesdeModal(false);
    setNombreMenuModal('');
    setDescripcionMenuModal('');
    setCategoriaMenuModal('formal');
    setModalAgregarMenuOpen(true);
  };

  const toggleMenuEnModal = (menuId: string) => {
    setMenusElegidosModal(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleConfirmarAgregarMenus = () => {
    if (!fichaParaMenus) return;

    const idsFinales = [...menusElegidosModal];
    let menuNuevoCreado: MenuOption | null = null;

    // Crear un menú nuevo al instante con esta ficha como primer plato
    if (crearMenuDesdeModal && nombreMenuModal.trim()) {
      const nuevoId = 'menu-' + Date.now();
      menuNuevoCreado = {
        id: nuevoId,
        nombre: nombreMenuModal.trim(),
        categoria: categoriaMenuModal,
        costoPersona: 0,
        precioSugeridoPersona: 0,
        descripcion: descripcionMenuModal.trim() || `Propuesta gastronómica con la ficha "${fichaParaMenus.nombre}"`,
        tiempos: {
          coctel: fichaParaMenus.tiempoMenu === 'coctel' ? fichaParaMenus.nombre : 'Selección de bocados gourmet en jardín',
          entrada: fichaParaMenus.tiempoMenu === 'entrada' ? fichaParaMenus.nombre : 'Entrada fresca de temporada según minuta del chef',
          fondo: fichaParaMenus.tiempoMenu === 'fondo' ? fichaParaMenus.nombre : 'Plato de fondo noble con guarnición rústica',
          postre: fichaParaMenus.tiempoMenu === 'postre' ? fichaParaMenus.nombre : 'Trilogía dulce artesanal de autor',
          trasnoche: fichaParaMenus.tiempoMenu === 'trasnoche' ? fichaParaMenus.nombre : 'Estación de trasnoche: mini hamburguesas y consomé'
        },
        destacado: false,
        costoCalculadoDesdeRecetas: true
      };
      if (onAddMenu) {
        onAddMenu(menuNuevoCreado);
      }
      idsFinales.push(nuevoId);
    }

    const recetaActualizada: RecetaFichaTecnica = {
      ...fichaParaMenus,
      menusAsociadosIds: idsFinales.length > 0 ? idsFinales : undefined,
      // Compatibilidad con explosión de compras y cotizador: menú principal = primero elegido
      menuAsociadoId: idsFinales[0],
      servicioAsociadoId: undefined
    };

    // onUpdateReceta dispara la sincronización automática del costo de TODOS los menús afectados
    onUpdateReceta(recetaActualizada);

    // Incorporar automáticamente la ficha a los ítems por persona (p.p.) de cada menú asociado
    if (onUpdateMenu && idsFinales.length > 0) {
      const calcFicha = calcularCostoReceta(fichaParaMenus, insumos);
      idsFinales.forEach(mId => {
        const targetMenu = menus.find(m => m.id === mId);
        if (!targetMenu) return;
        const items = targetMenu.itemsPorPersona ? [...targetMenu.itemsPorPersona] : [];
        const yaExiste = items.some(it => it.recetaId === fichaParaMenus.id || it.nombre.toLowerCase().trim() === fichaParaMenus.nombre.toLowerCase().trim());
        if (!yaExiste) {
          items.push({
            id: 'ratio-rec-' + fichaParaMenus.id + '-' + Date.now(),
            nombre: fichaParaMenus.nombre,
            cantidadPorPersona: 1,
            unidad: 'porción',
            costoUnitario: calcFicha.costoPorPorcion,
            recetaId: fichaParaMenus.id,
            recetaNombre: fichaParaMenus.nombre,
            categoria: (fichaParaMenus.tiempoMenu || '').toLowerCase() === 'cocteleria' ? 'bebestible' : 'comida',
            tipoOrigen: 'receta'
          });
          const nuevoCosto = targetMenu.costoPersona + calcFicha.costoPorPorcion;
          onUpdateMenu({
            ...targetMenu,
            itemsPorPersona: items,
            costoPersona: nuevoCosto,
            precioSugeridoPersona: Math.round(nuevoCosto / 0.33)
          });
        }
      });
    }

    setModalAgregarMenuOpen(false);
    setFichaParaMenus(null);

    if (menuNuevoCreado) {
      notificar(`✓ ¡Menú "${menuNuevoCreado.nombre}" creado con "${fichaParaMenus.nombre}" y activado en el cotizador!`);
    } else if (idsFinales.length > 0) {
      notificar(`✓ "${fichaParaMenus.nombre}" vinculada a ${idsFinales.length} ${idsFinales.length === 1 ? 'menú' : 'menús'} · costos actualizados en el cotizador`);
    } else {
      notificar(`✓ "${fichaParaMenus.nombre}" desvinculada de todos los menús`);
    }
  };

  // Sincronizar manualmente los costos de todos los menús donde participa la ficha activa
  const handleSincronizarTodosLosMenus = () => {
    if (!recetaActiva) return;
    const menusObjetivo = menus.filter(m => recetaPerteneceAMenu(recetaActiva, m.id));
    let sincronizados = 0;
    menusObjetivo.forEach(m => {
      const { costoMenuCalculado, recetasEncontradas } = calcularCostoMenuDesdeRecetas(m.id, recetas, insumos);
      if (recetasEncontradas > 0) {
        onSincronizarCostosMenu(m.id, costoMenuCalculado);
        sincronizados++;
      }
    });
    notificar(`✓ Costos actualizados en ${sincronizados} ${sincronizados === 1 ? 'menú' : 'menús'} del cotizador`);
  };

  const presetsMargen = [25, 30, 33, 35, 40, 45, 50];

  // ── Fichas filtradas por menú y agrupadas por categoría (acordeón) ──
  const fichasFiltradas = useMemo(() => {
    if (menuFiltroRecetas === 'todos') return recetas;
    if (menuFiltroRecetas === 'coffee-break') {
      return recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === 'coffee-break');
    }
    if (menuFiltroRecetas === 'costo-mesa') {
      return recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === 'costo-mesa');
    }
    if (menuFiltroRecetas === 'libres') {
      return recetas.filter(r => {
        const t = (r.tiempoMenu || '').toLowerCase();
        return !r.menuAsociadoId && (!r.menusAsociadosIds || r.menusAsociadosIds.length === 0) && t !== 'coffee-break' && t !== 'costo-mesa';
      });
    }
    return recetas.filter(r => recetaPerteneceAMenu(r, menuFiltroRecetas));
  }, [recetas, menuFiltroRecetas, menus]);

  // Ficha Costo de Mesa activa para acceso rápido y cálculo en vivo por pax
  const recetasCostoMesa = useMemo(
    () => recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === 'costo-mesa'),
    [recetas]
  );
  const fichaCostoMesaPrincipal = useMemo(
    () => recetasCostoMesa.find(r => r.id === costoMesaVinculadoId) || recetasCostoMesa[0],
    [recetasCostoMesa, costoMesaVinculadoId]
  );
  const calcCostoMesaPrincipal = useMemo(
    () => (fichaCostoMesaPrincipal ? calcularCostoReceta(fichaCostoMesaPrincipal, insumos) : null),
    [fichaCostoMesaPrincipal, insumos]
  );

  const gruposFichas = useMemo(() => {
    const grupos = new Map<string, RecetaFichaTecnica[]>();
    for (const r of fichasFiltradas) {
      const key = slugCategoriaFicha(r.tiempoMenu || 'general') || 'general';
      const existentes = grupos.get(key);
      if (existentes) existentes.push(r);
      else grupos.set(key, [r]);
    }

    const claves: string[] = [];
    const agregarClave = (k: string) => {
      if (k && !claves.includes(k)) claves.push(k);
    };
    TIEMPOS_MENU_DEFAULT.forEach(def => agregarClave(def.id.toLowerCase()));
    tiemposPersonalizados.forEach(t => agregarClave(slugCategoriaFicha(t)));
    grupos.forEach((_fichas, k) => agregarClave(k));

    return claves
      .map(key => ({ key, fichas: grupos.get(key) || [] }))
      .filter(grupo =>
        grupo.fichas.length > 0 ||
        !TIEMPOS_MENU_DEFAULT.some(def => def.id.toLowerCase() === grupo.key)
      );
  }, [fichasFiltradas, tiemposPersonalizados]);

  const nombreSeccionFicha = (key: string) => {
    if (SECCIONES_FICHAS_ETIQUETAS[key]) return SECCIONES_FICHAS_ETIQUETAS[key];
    const personalizada = tiemposPersonalizados.find(t => slugCategoriaFicha(t) === key);
    if (personalizada) return personalizada.trim();
    return formatearNombreTiempoMenu(key);
  };

  const todasSeccionesAbiertas = gruposFichas.length > 0 &&
    gruposFichas.every(g => seccionesFichasAbiertas.includes(g.key));

  const alternarTodasSeccionesFichas = () => {
    guardarSeccionesFichasAbiertas(
      todasSeccionesAbiertas ? [] : gruposFichas.map(g => g.key)
    );
  };

  const crearCategoriaFicha = () => {
    const nombre = nuevaCategoriaFichaInput.trim();
    if (!nombre) return;
    const key = slugCategoriaFicha(nombre);
    const yaExiste =
      TIEMPOS_MENU_DEFAULT.some(def => def.id.toLowerCase() === key) ||
      tiemposPersonalizados.some(t => slugCategoriaFicha(t) === key) ||
      recetas.some(r => slugCategoriaFicha(r.tiempoMenu || '') === key);

    if (!yaExiste) {
      guardarTiemposPersonalizados([...tiemposPersonalizados, nombre]);
    }
    abrirSeccionFicha(key);
    setNuevaCategoriaFichaInput('');
    setMostrarNuevaCategoriaFicha(false);
  };

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

        {/* Barra exclusiva para Demo Isidora: Carga Masiva de Fichas Técnicas & Recetas / Plantilla Excel */}
        {esDemoIsidora && (
          <div className="w-full mt-4 pt-3.5 pb-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-50/40 via-amber-50/30 to-transparent -mx-5 sm:-mx-6 px-5 sm:px-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] uppercase tracking-wider">
                💍 Demo Doña Isidora
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Herramienta exclusiva de pruebas para este perfil:
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalCargaRecetasOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50/80 text-amber-950 border border-amber-300 hover:border-amber-400 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:shadow-xs"
              title="Abrir asistente de Carga Masiva de Fichas Técnicas & Recetas / Plantilla Excel para Doña Isidora"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>📥 Carga Masiva de Fichas & Recetas / Plantilla Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TARJETA RESUMEN EN VIVO: COSTO DE MESA (MONTAJE INTERNO ESCALADO POR PAX) ── */}
      {fichaCostoMesaPrincipal && calcCostoMesaPrincipal && (
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                <LayoutGrid className="w-3 h-3" />
                Costo de Mesa (Montaje Interno)
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                incluirCostoMesa
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {incluirCostoMesa ? `✓ Vinculado a cotización (${invitados} Pax)` : 'Desactivado en cotización'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {fichaCostoMesaPrincipal.nombre}
            </h3>
            <p className="text-xs text-slate-600">
              Costo interno por 1 mesa ({fichaCostoMesaPrincipal.rendimientoPorciones || 10} pax):{' '}
              <strong className="text-slate-900 tabular-nums">{formatMoneda(calcCostoMesaPrincipal.costoTotalReceta)}/mesa</strong>
              {' · '}
              Por comensal:{' '}
              <strong className="text-emerald-800 tabular-nums">{formatMoneda(calcCostoMesaPrincipal.costoPorPorcion)}/pax</strong>
              {' · '}
              Total para <strong>{invitados} pax</strong>:{' '}
              <strong className="text-emerald-950 font-black tabular-nums">
                {formatMoneda(Math.round(calcCostoMesaPrincipal.costoPorPorcion * invitados))}
              </strong>
              {' '}
              <span className="text-[11px] text-slate-500">
                ({mesas.length > 0 ? `${mesas.length} mesas en salón` : `${Math.ceil(invitados / (fichaCostoMesaPrincipal.rendimientoPorciones || 10))} mesas estimadas`})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                setRecetaSeleccionadaId(fichaCostoMesaPrincipal.id);
                abrirSeccionFicha('costo-mesa');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Panera, Servilletas e Insumos</span>
            </button>
            {onToggleIncluirCostoMesa && (
              <button
                type="button"
                onClick={() => onToggleIncluirCostoMesa(!incluirCostoMesa)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  incluirCostoMesa
                    ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'
                }`}
              >
                {incluirCostoMesa ? '✓ Activo en Costo Real' : 'Activar en Cotización'}
              </button>
            )}
          </div>
        </div>
      )}

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
            const numRecetas = recetas.filter(r => recetaPerteneceAMenu(r, m.id)).length;
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

                    {/* Botón Editar Menú */}
                    {onUpdateMenu && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAEditar(m);
                          setModalNuevoMenuOpen(true);
                        }}
                        className="text-slate-400 hover:text-amber-600 p-1 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                        title={`Editar menú "${m.nombre}"`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

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

      {/* Selector de Recetas — Acordeón por categoría */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Fichas Técnicas ({recetas.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">· Haz clic para costearla</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMostrarNuevaCategoriaFicha(v => !v)}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nueva categoría</span>
            </button>
            {gruposFichas.length > 1 && (
              <button
                type="button"
                onClick={alternarTodasSeccionesFichas}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${todasSeccionesAbiertas ? 'rotate-180' : ''}`} />
                <span>{todasSeccionesAbiertas ? 'Cerrar todo' : 'Abrir todo'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalNuevoMenuOpen(true)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir nuevo menú a la carta</span>
            </button>
          </div>
        </div>

        {/* Campo libre para crear una categoría nueva */}
        {mostrarNuevaCategoriaFicha && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 uppercase tracking-wider shrink-0">
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nueva categoría:</span>
            </div>
            <input
              autoFocus
              type="text"
              value={nuevaCategoriaFichaInput}
              onChange={(e) => setNuevaCategoriaFichaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  crearCategoriaFicha();
                }
                if (e.key === 'Escape') {
                  setMostrarNuevaCategoriaFicha(false);
                  setNuevaCategoriaFichaInput('');
                }
              }}
              placeholder="Ej: Bebestibles, Entradas, Postres, Coctelería de Autor..."
              className="flex-1 px-3 py-1.5 text-xs font-semibold border border-blue-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={crearCategoriaFicha}
                disabled={!nuevaCategoriaFichaInput.trim()}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Crear categoría</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarNuevaCategoriaFicha(false);
                  setNuevaCategoriaFichaInput('');
                }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Filtro por Menú (desplegable compacto) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Menú:
          </span>
          <div className="relative">
            <select
              value={menuFiltroRecetas}
              onChange={(e) => setMenuFiltroRecetas(e.target.value)}
              className="appearance-none min-w-[220px] max-w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-amber-500"
            >
              <option value="todos">Todos los menús ({recetas.length})</option>
              {menus.map(m => {
                const count = recetas.filter(r => recetaPerteneceAMenu(r, m.id)).length;
                return (
                  <option key={m.id} value={m.id}>{m.nombre} ({count})</option>
                );
              })}
              <option value="coffee-break">
                Coffee Break ({recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === 'coffee-break').length})
              </option>
              <option value="costo-mesa">
                🪑 Costo de Mesa / Montaje ({recetas.filter(r => (r.tiempoMenu || '').toLowerCase() === 'costo-mesa').length})
              </option>
              <option value="libres">
                🍃 Libres / Sin Menú ({recetas.filter(r => {
                  const t = (r.tiempoMenu || '').toLowerCase();
                  return !r.menuAsociadoId && (!r.menusAsociadosIds || r.menusAsociadosIds.length === 0) && t !== 'coffee-break' && t !== 'costo-mesa';
                }).length})
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {menuFiltroRecetas !== 'todos' && (
            <button
              type="button"
              onClick={() => setMenuFiltroRecetas('todos')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Quitar filtro
            </button>
          )}
          <span className="text-[10px] text-slate-400 font-semibold ml-auto">
            {menus.length} {menus.length === 1 ? 'menú creado' : 'menús creados'}
          </span>
        </div>

        {fichasFiltradas.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
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
        ) : (
          <div className="space-y-2">
            {seccionesFichasAbiertas.length === 0 && (
              <p className="text-[10px] text-slate-400 font-semibold">
                Haz clic en una categoría para desplegar sus fichas.
              </p>
            )}

            {gruposFichas.map(({ key, fichas }) => {
              const abierta = seccionesFichasAbiertas.includes(key);
              return (
                <div
                  key={key}
                  className={`border rounded-xl overflow-hidden transition-colors ${abierta ? 'border-amber-200' : 'border-slate-200'}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSeccionFicha(key)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer transition-colors ${
                      abierta ? 'bg-amber-50/70 hover:bg-amber-50' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider min-w-0">
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${abierta ? '' : '-rotate-90'}`}
                      />
                      {key === 'coffee-break' && <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                      {key === 'costo-mesa' && <LayoutGrid className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      <span className="truncate">{nombreSeccionFicha(key)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums shrink-0 ${
                          abierta ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {fichas.length}
                      </span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      {abierta ? 'Ocultar' : 'Ver fichas'}
                    </span>
                  </button>

                  {abierta && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 p-2.5 bg-white">
                      {fichas.map((r) => {
                        const isSelected = r.id === recetaSeleccionadaId;
                        const calculo = calcularCostoReceta(r, insumos);
                        const menusDeFicha = menus.filter(m => recetaPerteneceAMenu(r, m.id));
                        const esFichaMesa = r.tiempoMenu === 'costo-mesa';
                        const estaVinculadaMesa = esFichaMesa && (costoMesaVinculadoId === r.id || (!costoMesaVinculadoId && r.id === fichaCostoMesaPrincipal?.id));

                        return (
                          <div
                            key={r.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setRecetaSeleccionadaId(r.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setRecetaSeleccionadaId(r.id);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400 shadow-xs'
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
                                ) : esFichaMesa ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-800 font-extrabold">
                                    <LayoutGrid className="w-3 h-3 text-emerald-700" />
                                    Costo de Mesa ({r.rendimientoPorciones || 10} pax)
                                  </span>
                                ) : (
                                  formatearNombreTiempoMenu(r.tiempoMenu)
                                )}
                              </span>
                              <span className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">
                                {r.nombre}
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">{esFichaMesa ? 'Por mesa / pax:' : 'Costo/pax:'}</span>
                              <span className="font-extrabold text-slate-800 tabular-nums">
                                {esFichaMesa
                                  ? `${formatMoneda(calculo.costoTotalReceta)} (${formatMoneda(calculo.costoPorPorcion)}/p)`
                                  : formatMoneda(calculo.costoPorPorcion)}
                              </span>
                            </div>

                            {/* VINCULACIÓN A MENÚS O COSTO DE MESA */}
                            {r.tiempoMenu === 'coffee-break' ? (
                              <div className="mt-1.5 w-full py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center gap-1">
                                <Coffee className="w-3 h-3" />
                                <span>Vinculada a Tarifas Generales</span>
                              </div>
                            ) : esFichaMesa ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRecetaSeleccionadaId(r.id);
                                  if (onVincularCostoMesa) onVincularCostoMesa(r);
                                }}
                                className={`mt-1.5 w-full py-1 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                  estaVinculadaMesa && incluirCostoMesa
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                <LayoutGrid className="w-3 h-3" />
                                <span>
                                  {estaVinculadaMesa && incluirCostoMesa
                                    ? `✓ Activo (${invitados} Pax)`
                                    : 'Vincular a Cotización'}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRecetaSeleccionadaId(r.id);
                                  abrirModalAgregarMenu(r);
                                }}
                                className={`mt-1.5 w-full py-1 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                                  menusDeFicha.length > 0
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                                }`}
                                title="Agregar esta ficha a los menús que estimes, o crear un menú nuevo con ella"
                              >
                                <ListPlus className="w-3 h-3" />
                                <span>
                                  {menusDeFicha.length > 0
                                    ? `✓ En ${menusDeFicha.length} ${menusDeFicha.length === 1 ? 'menú' : 'menús'} · Agregar a más`
                                    : '🍃 Libre · Agregar a Menú'}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

                  {/* Selector y visualizador de Categoría Libre de la Receta */}
                  <div className="relative inline-flex items-center gap-1">
                    {editandoCatLibreActiva ? (
                      <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-400 rounded-md px-1.5 py-0.5">
                        <input
                          autoFocus
                          type="text"
                          value={catLibreActivaInput}
                          onChange={(e) => setCatLibreActivaInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && catLibreActivaInput.trim()) {
                              e.preventDefault();
                              const catLimpia = catLibreActivaInput.trim();
                              if (!categoriasRecetasPersonalizadas.some(c => c.toLowerCase() === catLimpia.toLowerCase())) {
                                const actualizadas = [...categoriasRecetasPersonalizadas, catLimpia];
                                setCategoriasRecetasPersonalizadas(actualizadas);
                                try {
                                  localStorage.setItem(STORAGE_CATEGORIAS_RECETAS_KEY, JSON.stringify(actualizadas));
                                } catch {}
                              }
                              onUpdateReceta({ ...recetaActiva, categoria: catLimpia });
                              setEditandoCatLibreActiva(false);
                              setCatLibreActivaInput('');
                              notificar(`✓ Categoría libre "${catLimpia}" asignada a esta ficha`);
                            }
                            if (e.key === 'Escape') {
                              setEditandoCatLibreActiva(false);
                              setCatLibreActivaInput('');
                            }
                          }}
                          placeholder="Escribe categoría libre..."
                          className="text-[11px] font-bold text-blue-950 bg-white border border-blue-200 rounded px-2 py-0.5 w-40 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const catLimpia = catLibreActivaInput.trim();
                            if (!catLimpia) return;
                            if (!categoriasRecetasPersonalizadas.some(c => c.toLowerCase() === catLimpia.toLowerCase())) {
                              const actualizadas = [...categoriasRecetasPersonalizadas, catLimpia];
                              setCategoriasRecetasPersonalizadas(actualizadas);
                              try {
                                localStorage.setItem(STORAGE_CATEGORIAS_RECETAS_KEY, JSON.stringify(actualizadas));
                              } catch {}
                            }
                            onUpdateReceta({ ...recetaActiva, categoria: catLimpia });
                            setEditandoCatLibreActiva(false);
                            setCatLibreActivaInput('');
                            notificar(`✓ Categoría libre "${catLimpia}" asignada a esta ficha`);
                          }}
                          className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
                          title="Guardar categoría libre"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoCatLibreActiva(false);
                            setCatLibreActivaInput('');
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={recetaActiva.categoria || 'Receta de Autor'}
                        onChange={(e) => {
                          if (e.target.value === '__NUEVA_CAT_ACTIVA__') {
                            setEditandoCatLibreActiva(true);
                            setCatLibreActivaInput('');
                            return;
                          }
                          const nueva = e.target.value;
                          onUpdateReceta({
                            ...recetaActiva,
                            categoria: nueva
                          });
                          notificar(`✓ Categoría actualizada a "${nueva}"`);
                        }}
                        className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200/80 text-blue-950 font-bold text-[11px] border border-blue-300 focus:outline-hidden cursor-pointer transition-colors"
                        title="Cambiar o crear una categoría libre para esta receta"
                      >
                        {todasLasCategoriasRecetas.map(cat => (
                          <option key={cat} value={cat}>
                            Categoría: {cat}
                          </option>
                        ))}
                        <option value="__NUEVA_CAT_ACTIVA__">+ Escribir nueva categoría libre...</option>
                      </select>
                    )}
                  </div>

                  {recetaActiva.tiempoMenu === 'coffee-break' ? (
                    <span className="text-xs text-amber-900 flex items-center gap-1 font-bold bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
                      Vinculado a: <strong>Tarifas Generales (Coffee Break / Coctelería)</strong>
                    </span>
                  ) : recetaActiva.tiempoMenu === 'costo-mesa' ? (
                    <span className="text-xs text-emerald-900 flex items-center gap-1 font-bold bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                      <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
                      Vinculado a: <strong>Costo de Mesa ({invitados} Pax cotizados)</strong>
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

                <input
                  type="text"
                  value={recetaActiva.nombre}
                  onChange={(e) => {
                    const nuevoNombre = e.target.value;
                    onUpdateReceta({
                      ...recetaActiva,
                      nombre: nuevoNombre
                    });
                  }}
                  className="text-lg font-extrabold text-slate-900 mt-1 w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-amber-50/40 rounded-lg px-1.5 -mx-1.5 py-0.5 focus:outline-hidden transition-colors"
                  title="Haz clic para editar el nombre de la ficha"
                />

                <textarea
                  value={recetaActiva.descripcionProcedimiento || ''}
                  onChange={(e) => {
                    const nuevaDesc = e.target.value;
                    onUpdateReceta({
                      ...recetaActiva,
                      descripcionProcedimiento: nuevaDesc || undefined
                    });
                  }}
                  placeholder="Describe el procedimiento de esta receta (opcional)..."
                  rows={2}
                  className="text-xs text-slate-600 mt-1 w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-amber-50/40 rounded-lg px-1.5 -mx-1.5 py-0.5 focus:outline-hidden transition-colors resize-y leading-relaxed italic"
                  title="Haz clic para editar la descripción del procedimiento"
                />

                {recetaActiva.tiempoMenu !== 'coffee-break' && recetaActiva.tiempoMenu !== 'costo-mesa' && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-blue-500" />
                      Menús vinculados:
                    </span>
                    <select
                      value={recetaActiva.menuAsociadoId || ''}
                      onChange={(e) => {
                        const nuevoMenuId = e.target.value || undefined;
                        // Mantener el resto de vinculaciones múltiples intactas (solo si existen en carta);
                        // el select define el menú PRINCIPAL de la ficha
                        const otrosIds = (recetaActiva.menusAsociadosIds || []).filter(
                          id =>
                            id !== recetaActiva.menuAsociadoId &&
                            id !== nuevoMenuId &&
                            menus.some(m => m.id === id)
                        );
                        const idsFinales = nuevoMenuId ? [nuevoMenuId, ...otrosIds] : otrosIds;
                        onUpdateReceta({
                          ...recetaActiva,
                          menuAsociadoId: nuevoMenuId,
                          menusAsociadosIds: idsFinales.length > 0 ? idsFinales : undefined,
                          servicioAsociadoId: undefined
                        });
                        notificar(nuevoMenuId ? '✓ Menú principal de la ficha actualizado · costo sincronizado' : '✓ Ficha sin menú principal');
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-md focus:outline-none focus:border-blue-400 cursor-pointer transition-colors"
                      title="Cambiar el menú principal al que pertenece esta receta"
                    >
                      <option value="">— Sin menú vinculado —</option>
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.categoria})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => abrirModalAgregarMenu(recetaActiva)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      title="Agregar o quitar esta ficha en los menús que estimes"
                    >
                      <ListPlus className="w-3 h-3" />
                      <span>Agregar / Quitar Menús…</span>
                    </button>
                    {menusDeFichaActiva.length > 1 && (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                        Presente en {menusDeFichaActiva.length} menús
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateReceta(recetaActiva);
                    notificar(`✓ Ficha técnica "${recetaActiva.nombre}" guardada y actualizada con éxito`);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Guardar todos los cambios de esta ficha técnica"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ficha</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Deseas eliminar la receta "${recetaActiva.nombre}"?`)) {
                      onDeleteReceta(recetaActiva.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 text-xs flex items-center gap-1 transition-colors"
                  title="Eliminar receta"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>

            {/* Tabla de Ingredientes y Costos */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ingredientes & Materia Prima ({recetaActiva.ingredientes.length})
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">
                    {recetaActiva.tiempoMenu === 'costo-mesa' ? 'Comensales por mesa:' : 'Porción costeada:'}
                  </span>
                  <InputNumeroCeldaRecetas
                    valorInicial={recetaActiva.rendimientoPorciones || 1}
                    onCambioConfirmado={(val) => {
                      const limpio = Math.max(1, Math.round(val));
                      onUpdateReceta({
                        ...recetaActiva,
                        rendimientoPorciones: limpio
                      });
                    }}
                    min={1}
                    step="1"
                    className="w-12 text-center font-extrabold text-slate-900 bg-white border border-slate-300 rounded px-1 py-0.5 tabular-nums focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="font-semibold">pax</span>
                </div>
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

            {/* Agregar nuevo ingrediente con selector de categorías vinculadas y creación libre en Maestro de Insumos */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  Añadir Ingrediente desde el Maestro de Insumos:
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filtro por Categoría de Insumo */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-slate-400 shrink-0" />
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

                  {/* Botón para crear producto libremente en Maestro de Insumos */}
                  {onAddInsumo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPanelNuevoProductoOpen(v => !v);
                        setNpError('');
                        if (recetaActiva.tiempoMenu === 'costo-mesa') {
                          setNpCategoria('montaje_mesa');
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        panelNuevoProductoOpen
                          ? 'bg-blue-700 text-white border-blue-800'
                          : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                      }`}
                      title="Crear un nuevo producto en el Maestro de Insumos e incluirlo en este servicio"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+ Crear Producto en Maestro</span>
                    </button>
                  )}

                  {onIrAMaestroInsumos && (
                    <button
                      type="button"
                      onClick={onIrAMaestroInsumos}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Ir a la vista completa del Maestro de Insumos"
                    >
                      <Boxes className="w-3.5 h-3.5 text-blue-600" />
                      <span>Maestro ↗</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Panel Inline: Crear Producto Libremente en Maestro de Insumos e Incluirlo en esta Ficha */}
              {panelNuevoProductoOpen && onAddInsumo && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <PackagePlus className="w-4 h-4 text-blue-700" />
                        Nuevo Producto en Maestro de Insumos (Categoría Libre)
                      </span>
                      <span className="text-[10px] text-blue-800 block">
                        Se guarda directo en el Maestro de Insumos y se agrega al instante a "{recetaActiva.nombre}".
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanelNuevoProductoOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {npError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold">
                      {npError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        value={npNombre}
                        onChange={(e) => setNpNombre(e.target.value)}
                        placeholder="Ej: Pan Amasado Mini, Servilleta Lino, Pocillo Pebre..."
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          Categoría (Libre)
                        </label>
                        <button
                          type="button"
                          onClick={() => setNpEsCategoriaLibre(v => !v)}
                          className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          {npEsCategoriaLibre ? '← Lista' : '+ Nueva libre'}
                        </button>
                      </div>
                      {npEsCategoriaLibre ? (
                        <input
                          type="text"
                          value={npCategoriaLibreInput}
                          onChange={(e) => setNpCategoriaLibreInput(e.target.value)}
                          placeholder="Ej: Panadería de Mesa, Menaje VIP..."
                          className="w-full px-2.5 py-1.5 bg-white border-2 border-blue-500 rounded-lg text-slate-900 font-bold focus:outline-hidden"
                        />
                      ) : (
                        <select
                          value={npCategoria}
                          onChange={(e) => {
                            if (e.target.value === '__NUEVA__') {
                              setNpEsCategoriaLibre(true);
                              setNpCategoriaLibreInput('');
                            } else {
                              setNpCategoria(e.target.value);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
                        >
                          {todasLasCategoriasInsumos.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                          <option value="__NUEVA__">+ Crear nueva categoría libre...</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Proveedor (Opcional)
                      </label>
                      <input
                        type="text"
                        value={npProveedor}
                        onChange={(e) => setNpProveedor(e.target.value)}
                        placeholder="Ej: Panadería Local, La Vega..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Unidad de Compra
                      </label>
                      <select
                        value={npUnidadCompra}
                        onChange={(e) => setNpUnidadCompra(e.target.value as InsumoMaestro['unidadMedida'])}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-hidden"
                      >
                        <option value="unidad">unidad (c/u)</option>
                        <option value="kg">kg (kilogramo)</option>
                        <option value="g">g (gramo)</option>
                        <option value="L">L (litro)</option>
                        <option value="ml">ml (mililitro)</option>
                        <option value="paquete">paquete</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Precio Compra ($ CLP / {npUnidadCompra}) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={npPrecioCompra}
                        onChange={(e) => setNpPrecioCompra(e.target.value)}
                        placeholder="Ej: 250 o 4200"
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-extrabold tabular-nums focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Merma (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        step="any"
                        value={npMerma}
                        onChange={(e) => setNpMerma(e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <label className="inline-flex items-center gap-1.5 font-bold text-blue-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={npIncluirEnFicha}
                          onChange={(e) => setNpIncluirEnFicha(e.target.checked)}
                          className="rounded accent-blue-700"
                        />
                        <span>Incluir en esta ficha con cantidad:</span>
                      </label>
                      {npIncluirEnFicha && (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={0.01}
                            step="any"
                            value={npCantidadReceta}
                            onChange={(e) => setNpCantidadReceta(e.target.value)}
                            className="w-20 px-2 py-1 bg-white border border-blue-300 rounded-lg text-slate-900 font-extrabold text-right tabular-nums"
                          />
                          <span className="font-mono font-bold text-blue-900 text-[11px]">
                            {npUnidadCompra === 'kg' ? 'g' : (npUnidadCompra === 'paquete' ? 'unidad' : npUnidadCompra)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCrearProductoEnMaestro}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar en Maestro e Incluir</span>
                    </button>
                  </div>
                </div>
              )}

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

              {/* Selector de Margen: 1 Solo Indicador Claro */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-500" />
                    Margen Comercial de la Receta
                  </label>
                  <span className="text-xs font-black text-amber-800 tabular-nums bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                    {recetaActiva.margenSugerido}%
                  </span>
                </div>

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

                <button
                  type="button"
                  onClick={() => {
                    onUpdateReceta(recetaActiva);
                    notificar(`✓ Ficha técnica "${recetaActiva.nombre}" guardada y respaldada con éxito`);
                  }}
                  className="w-full mt-3 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Guardar todos los cambios de esta ficha técnica"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ficha Técnica</span>
                </button>
              </div>
            </div>

            {/* VINCULACIÓN: COFFEE BREAK -> TARIFAS, COSTO DE MESA -> COTIZACIÓN POR PAX, PLATOS -> MENÚ */}
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
            ) : recetaActiva.tiempoMenu === 'costo-mesa' ? (
              (() => {
                const paxPorMesa = Math.max(1, recetaActiva.rendimientoPorciones || 10);
                const mesasCalculadas = mesas.length > 0 ? mesas.length : Math.ceil(invitados / paxPorMesa);
                const totalPorPax = Math.round(calculosReceta.costoPorPorcion * invitados);
                const totalPorMesas = Math.round(calculosReceta.costoTotalReceta * mesasCalculadas);
                const esActivaEnCotizacion =
                  incluirCostoMesa &&
                  (costoMesaVinculadoId === recetaActiva.id ||
                    (!costoMesaVinculadoId && fichaCostoMesaPrincipal?.id === recetaActiva.id));

                return (
                  <div className="bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/40 rounded-2xl border border-emerald-300 p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-emerald-700" />
                        Costo de Mesa · Escala por Pax
                      </span>
                      {esActivaEnCotizacion && (
                        <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cálculo interno de lo que le cuesta al local montar 1 mesa ({paxPorMesa} pax). Se actualiza automáticamente con los <strong>{invitados} pax</strong> que estás cotizando.
                    </p>

                    <div className="text-xs text-slate-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Costo por 1 Mesa ({paxPorMesa} pax):</span>
                        <strong className="text-slate-900 font-extrabold tabular-nums">
                          {formatMoneda(calculosReceta.costoTotalReceta)}/mesa
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Costo por Comensal (p.p.):</span>
                        <span className="font-extrabold text-emerald-800 text-sm tabular-nums">
                          {formatMoneda(calculosReceta.costoPorPorcion)}/pax
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Pax cotizados activos:</span>
                        <span className="font-bold text-slate-800 font-mono">{invitados} pax</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>{mesas.length > 0 ? 'Mesas configuradas en salón:' : 'Mesas estimadas:'}</span>
                        <span className="font-bold text-slate-800 font-mono">{mesasCalculadas} mesas</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                        <span className="font-bold text-slate-800">Total Costo Mesas ({invitados} Pax):</span>
                        <span className="font-black text-emerald-950 text-base tabular-nums">
                          {formatMoneda(totalPorPax)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Equivalente {mesasCalculadas} mesas completas:</span>
                        <span className="font-semibold tabular-nums">{formatMoneda(totalPorMesas)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {onVincularCostoMesa && (
                        <button
                          type="button"
                          onClick={() => {
                            onVincularCostoMesa(recetaActiva);
                            notificar(`✓ Costo de Mesa "${recetaActiva.nombre}" vinculado al cotizador (${formatMoneda(totalPorPax)} para ${invitados} pax)`);
                          }}
                          className={`w-full py-2.5 px-3 active:scale-98 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            esActivaEnCotizacion
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {esActivaEnCotizacion
                              ? `✓ Vinculado y Actualizado (${invitados} Pax)`
                              : 'Vincular este Costo de Mesa al Cotizador'}
                          </span>
                        </button>
                      )}

                      {onToggleIncluirCostoMesa && (
                        <button
                          type="button"
                          onClick={() => onToggleIncluirCostoMesa(!incluirCostoMesa)}
                          className="w-full py-1.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {incluirCostoMesa ? 'Excluir temporalmente del Costo Real ($0)' : 'Incluir nuevamente en Costo Real'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Impacto en el Menú de Cotización
                  </span>
                </div>

                {menusDeFichaActiva.length === 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Esta ficha todavía <strong className="text-slate-800">no está vinculada a ningún menú</strong>.
                      Agrégala a los menús que ya tengas en carta, o crea un menú nuevo al instante con ella adentro.
                    </p>
                    <button
                      type="button"
                      onClick={() => abrirModalAgregarMenu(recetaActiva)}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ListPlus className="w-4 h-4" />
                      <span>Agregar a un Menú (creado o nuevo)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Menús donde aparece esta ficha ({menusDeFichaActiva.length}):
                    </span>

                    {menusDeFichaActiva.map(m => {
                      const calcMenu = calcularCostoMenuDesdeRecetas(m.id, recetas, insumos);
                      return (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900 truncate">
                              {m.nombre}
                              {m.id === recetaActiva.menuAsociadoId && (
                                <span className="ml-1.5 text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full align-middle">
                                  Principal
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {calcMenu.recetasEncontradas} fichas sumadas · {m.categoria}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-blue-900 tabular-nums shrink-0">
                            {formatMoneda(calcMenu.costoMenuCalculado)}/pax
                          </span>
                        </div>
                      );
                    })}

                    {menuVinculado && (
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Costo actual del menú principal en cotizador:</span>
                        <span className="tabular-nums">{formatMoneda(menuVinculado.costoPersona)}/pax</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSincronizarTodosLosMenus}
                      className="w-full mt-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                      <span>Actualizar Costos de {menusDeFichaActiva.length} {menusDeFichaActiva.length === 1 ? 'Menú' : 'Menús'} al Cotizador</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalAgregarMenu(recetaActiva)}
                      className="w-full py-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Agregar o quitar menús…</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── MODAL: AGREGAR FICHA A MENÚS (CREADOS O POR CREAR) ── */}
      {modalAgregarMenuOpen && fichaParaMenus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-blue-600" />
                Agregar a Menús
              </h2>
              <button
                type="button"
                onClick={() => setModalAgregarMenuOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Elige en qué menús aparecerá <strong className="text-slate-800">"{fichaParaMenus.nombre}"</strong>{' '}
              (costo {formatMoneda(calcularCostoReceta(fichaParaMenus, insumos).costoPorPorcion)}/pax).
              Puedes marcar varios menús o crear uno nuevo al instante.
            </p>

            {/* 1 · Menús existentes */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                1 · Menús en carta (marca todos los que estimes)
              </span>

              {menus.length === 0 && (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Aún no tienes menús en carta. Crea el primero con la opción de abajo 👇
                </p>
              )}

              {menus.map(m => {
                const marcado = menusElegidosModal.includes(m.id);
                const numFichas = recetas.filter(r => recetaPerteneceAMenu(r, m.id)).length;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMenuEnModal(m.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      marcado
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          marcado ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {m.nombre}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {m.categoria} · {numFichas} {numFichas === 1 ? 'ficha' : 'fichas'} · {formatMoneda(m.costoPersona)}/pax
                        </span>
                      </div>
                    </div>
                    {marcado && (
                      <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                        Incluida
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 2 · Crear un menú nuevo con esta ficha */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
              <button
                type="button"
                onClick={() => setCrearMenuDesdeModal(!crearMenuDesdeModal)}
                className="text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer hover:text-amber-950"
              >
                <FolderPlus className="w-4 h-4 text-amber-700" />
                {crearMenuDesdeModal ? '− No crear menú nuevo' : '＋ Crear un menú nuevo con esta ficha'}
              </button>

              {crearMenuDesdeModal && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    autoFocus
                    value={nombreMenuModal}
                    onChange={(e) => setNombreMenuModal(e.target.value)}
                    placeholder="Nombre del nuevo menú (Ej: Boda Gala 3 Tiempos)"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={categoriaMenuModal}
                      onChange={(e) => setCategoriaMenuModal(e.target.value as any)}
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-800 focus:outline-hidden"
                    >
                      <option value="formal">Banquete Formal</option>
                      <option value="campestre">Asado Campestre</option>
                      <option value="cocktail">Cóctel Dinámico</option>
                      <option value="premium">Menú Premium</option>
                    </select>
                    <input
                      type="text"
                      value={descripcionMenuModal}
                      onChange={(e) => setDescripcionMenuModal(e.target.value)}
                      placeholder="Descripción breve (opcional)"
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-amber-800 block leading-tight">
                    ✓ El menú se creará con esta ficha como primer plato, quedará seleccionado en el cotizador y su costo se calculará solo.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAgregarMenuOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAgregarMenus}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar vinculación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Receta */}
      {modalNuevaRecetaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-0.5">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  Nueva Ficha Técnica de Costeo
                </h2>
                <p className="text-xs text-slate-500">
                  Crea un plato o servicio y conéctalo al cotizador para que su costo se traslade en tiempo real.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCrearReceta(e as any)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Guardar esta ficha técnica ahora"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ficha</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevaRecetaOpen(false);
                    setModoMenuReceta('existente');
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
              ) : nuevoTiempoReceta === 'costo-mesa' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destino de Vinculación</label>
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-emerald-950 block text-xs">
                          Costo de Mesa · Montaje Interno (Base 10 Pax)
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Precarga panera (pan, pebre, mantequilla) y servilletas, y escala automáticamente con los {invitados} pax cotizados
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                      Escala Pax
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
                        + Crear Menú
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoMenuReceta('libre')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 ${
                          modoMenuReceta === 'libre'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-emerald-800 hover:text-emerald-900 font-extrabold'
                        }`}
                      >
                        🍃 Libre
                      </button>
                    </div>
                  </div>

                  {modoMenuReceta === 'libre' ? (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <span>🍃 Receta Libre (Sin Menú Asignado)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Esta ficha técnica se guardará de forma independiente en tu catálogo. Podrás costearla, editar sus insumos y asociarla a uno o varios menús más adelante con 1 clic.
                      </p>
                    </div>
                  ) : modoMenuReceta === 'existente' ? (
                    <div>
                      <select
                        value={nuevoMenuAsociadoId}
                        onChange={(e) => setNuevoMenuAsociadoId(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium bg-white"
                      >
                        <option value="">— Dejar libre (Sin menú asignado) —</option>
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {modoMenuReceta === 'nuevo' && nuevoTiempoReceta !== 'coffee-break'
                      ? 'Guardar Menú y Receta'
                      : 'Guardar Ficha Técnica'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        onClose={() => {
          setModalNuevoMenuOpen(false);
          setMenuAEditar(null);
        }}
        menuAEditar={menuAEditar}
        onGuardarMenu={handleGuardarMenuDirecto}
        recetasDisponibles={recetas}
        insumosDisponibles={insumos}
      />

      {/* Modal de Carga Masiva de Fichas & Recetas exclusivo para Demo Isidora */}
      {esDemoIsidora && isModalCargaRecetasOpen && (
        <ModalCargaMasivaRecetas
          isOpen={isModalCargaRecetasOpen}
          onClose={() => setIsModalCargaRecetasOpen(false)}
          recetasActuales={recetas}
          insumosDisponibles={insumos}
          menusDisponibles={menus}
          onImportarRecetas={(nuevas, modo) => {
            if (onImportarRecetas) {
              onImportarRecetas(nuevas, modo);
            }
          }}
          onRestablecerRecetas={onRestablecerRecetas}
          nombreEmpresa={nombreEmpresa}
        />
      )}
    </div>
  );
};
