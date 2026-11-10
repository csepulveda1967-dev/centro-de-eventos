import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { RecetaFichaTecnica, InsumoMaestro, MenuOption, IngredienteReceta } from '../types';
import { formatMoneda } from '../utils/formatters';
import { calcularCostoReceta } from '../config/insumosYRecetas';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ClipboardPaste,
  ChefHat,
  RotateCcw,
  Check,
  Utensils,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ModalCargaMasivaRecetasProps {
  isOpen: boolean;
  onClose: () => void;
  recetasActuales: RecetaFichaTecnica[];
  insumosDisponibles: InsumoMaestro[];
  menusDisponibles: MenuOption[];
  onImportarRecetas: (nuevasRecetas: RecetaFichaTecnica[], modo: 'agregar' | 'reemplazar') => void;
  onRestablecerRecetas?: () => void;
  nombreEmpresa?: string;
}

// 6 recetas de ejemplo reales para Doña Isidora Eventos (Banquetería Itinerante & Matrimonios)
const RECETAS_PLANTILLA_EJEMPLO = [
  {
    nombre: 'Medallón de Filete Angus con Salsa Oporto y Risotto al Azafrán',
    tiempoMenu: 'fondo',
    categoria: 'Plato de Fondo Gourmet',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 450,
    descripcionProcedimiento: 'Medallón de filete de 220g sellado con reducción de oporto y champiñones sobre risotto cremoso con parmesano grana.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Filete de Vacuno: 220g; Arroz Risotto: 80g; Vino Oporto: 60ml; Champiñones París: 70g; Mantequilla: 30g; Queso Parmesano: 30g; Azafrán: 1g'
  },
  {
    nombre: 'Carpaccio de Salmón Austral con Alcaparras y Vinagreta Maracuyá',
    tiempoMenu: 'entrada',
    categoria: 'Entrada de Gala',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 600,
    descripcionProcedimiento: 'Láminas finas de salmón fresco con alcaparras crocantes, vinagreta emulsionada de maracuyá y palta hass.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Salmón Fresco: 140g; Palta Hass: 60g; Aceite de Oliva Extra Virgen: 25ml; Limón Sutil: 50g'
  },
  {
    nombre: 'Trilogía de Postres Doña Isidora (Mousse Belga, Suspiro y Sorbete)',
    tiempoMenu: 'postre',
    categoria: 'Postre de Autor',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 450,
    descripcionProcedimiento: 'Mousse de chocolate belga puro al 70%, suspiro limeño y sorbete artesanal de frutos rojos del valle.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Chocolate Belga 70%: 70g; Crema de Leche Fresca: 80ml; Huevos de Campo: 2 unidad; Frutos Rojos Mixtos: 50g'
  },
  {
    nombre: 'Bocados de Cóctel Rústico (Ceviche Reineta, Empanaditas & Gyozas)',
    tiempoMenu: 'coctel',
    categoria: 'Cóctel de Apertura',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 750,
    descripcionProcedimiento: 'Estación de 6 bocados fríos y calientes servidos en cucharitas de greda y bandejas de madera noble.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Reineta Fresca: 90g; Camarón Ecuatoriano: 60g; Masa Empanada Cocktail: 2 unidad; Limón Sutil: 40g; Cebolla Morada: 30g; Cilantro Fresco: 15g'
  },
  {
    nombre: 'Lomo Vetado a las Brasas con Papas Rústicas al Romero',
    tiempoMenu: 'fondo',
    categoria: 'Parrilla & Fuegos',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 500,
    descripcionProcedimiento: 'Corte noble de lomo vetado a fuego lento de leña de espino con papas baby al romero y mantequilla de hierbas.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Lomo Vetado Angus: 280g; Papa Rústica Baby: 180g; Mantequilla: 25g; Romero Fresco: 10g; Sal de Cahuil: 5g'
  },
  {
    nombre: 'Trasnoche: Mini Hamburguesas Caseras en Brioche y Consomé de Campo',
    tiempoMenu: 'trasnoche',
    categoria: 'Trasnoche / Bajón',
    rendimientoPorciones: 1,
    margenSugerido: 33,
    costoAdicionalElaboracion: 350,
    descripcionProcedimiento: 'Dos mini sliders en pan brioche artesanal con queso cheddar fundido y tazón de caldo aromático caliente.',
    menuAsociadoNombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
    ingredientesTexto: 'Carne Molida Vacuno Especial: 120g; Pan Hamburguesa Brioche: 2 unidad; Queso Laminado: 40g; Verduras para Caldo: 50g'
  }
];

export const ModalCargaMasivaRecetas: React.FC<ModalCargaMasivaRecetasProps> = ({
  isOpen,
  onClose,
  recetasActuales,
  insumosDisponibles,
  menusDisponibles,
  onImportarRecetas,
  onRestablecerRecetas,
  nombreEmpresa = 'Doña Isidora Eventos'
}) => {
  const [tab, setTab] = useState<'archivo' | 'pegar'>('archivo');
  const [archivoNombre, setArchivoNombre] = useState<string>('');
  const [textoPegado, setTextoPegado] = useState<string>('');
  const [recetasLeidas, setRecetasLeidas] = useState<RecetaFichaTecnica[]>([]);
  const [modoImportacion, setModoImportacion] = useState<'agregar' | 'reemplazar'>('agregar');
  const [errorParseo, setErrorParseo] = useState<string | null>(null);
  const [esDragOver, setEsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ── DESCARGA DE PLANTILLA EN EXCEL (.XLSX NATIVO) ──
  const handleDescargarPlantillaExcel = () => {
    try {
      const dataAOA: (string | number)[][] = [
        // Encabezados
        [
          'Nombre Ficha / Receta',
          'Tiempo Menu (coctel, entrada, fondo, postre, trasnoche, coffee-break)',
          'Categoria',
          'Rendimiento Porciones (ej: 1)',
          'Margen Sugerido % (ej: 33)',
          'Costo Adicional Elaboracion CLP',
          'Menu Asociado',
          'Descripcion / Procedimiento',
          'Ingredientes (Formato: Insumo: Cantidad Unidad; Insumo 2: Cantidad Unidad)'
        ],
        // Filas de ejemplo
        ...RECETAS_PLANTILLA_EJEMPLO.map(r => [
          r.nombre,
          r.tiempoMenu,
          r.categoria,
          r.rendimientoPorciones,
          r.margenSugerido,
          r.costoAdicionalElaboracion,
          r.menuAsociadoNombre,
          r.descripcionProcedimiento,
          r.ingredientesTexto
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(dataAOA);

      ws['!cols'] = [
        { wch: 42 }, // Nombre
        { wch: 22 }, // Tiempo
        { wch: 24 }, // Categoria
        { wch: 15 }, // Rendimiento
        { wch: 15 }, // Margen %
        { wch: 22 }, // Costo Adicional
        { wch: 32 }, // Menu
        { wch: 45 }, // Procedimiento
        { wch: 65 }  // Ingredientes
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fichas_Tecnicas');
      XLSX.writeFile(wb, 'plantilla_fichas_recetas_dona_isidora.xlsx');
    } catch (err) {
      console.error('Error generando plantilla Excel:', err);
      handleDescargarPlantillaCSV();
    }
  };

  // ── DESCARGA DE PLANTILLA EN CSV ──
  const handleDescargarPlantillaCSV = () => {
    const encabezados = 'Nombre Ficha;Tiempo Menu;Categoria;Rendimiento;Margen;Costo Adicional;Menu Asociado;Descripcion;Ingredientes\n';
    const filas = RECETAS_PLANTILLA_EJEMPLO.map(r =>
      `"${r.nombre}";"${r.tiempoMenu}";"${r.categoria}";${r.rendimientoPorciones};${r.margenSugerido};${r.costoAdicionalElaboracion};"${r.menuAsociadoNombre}";"${r.descripcionProcedimiento.replace(/"/g, '""')}";"${r.ingredientesTexto.replace(/"/g, '""')}"`
    ).join('\n');

    const csvContent = '\uFEFF' + encabezados + filas;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_fichas_recetas_dona_isidora.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const limpiarNumero = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val).replace(/[$€%\s.]/g, '').replace(/,/g, '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // ── RESOLVER INSUMO POR NOMBRE (BUSCADOR INTELIGENTE EN EL MAESTRO) ──
  const resolverInsumoId = (nombreIng: string): { insumoId: string; cantidad: number; unidad: 'kg' | 'g' | 'L' | 'ml' | 'unidad' } => {
    const limpio = nombreIng.trim().toLowerCase();
    
    // Buscar coincidencia exacta o parcial en insumos
    const match = insumosDisponibles.find(i => {
      const iNom = i.nombre.toLowerCase();
      return iNom === limpio || iNom.includes(limpio) || limpio.includes(iNom);
    });

    if (match) {
      return {
        insumoId: match.id,
        cantidad: 100,
        unidad: (match.unidadMedida as any) || 'g'
      };
    }

    // Si no se encuentra, usar el primer insumo disponible como base
    const fallbackId = insumosDisponibles[0]?.id || 'ins-base';
    return {
      insumoId: fallbackId,
      cantidad: 100,
      unidad: 'g'
    };
  };

  // ── PARSEO DE LA CADENA DE INGREDIENTES (Ej: "Filete: 220g; Arroz: 80g; Vino: 60ml") ──
  const parsearIngredientesTexto = (texto: string): IngredienteReceta[] => {
    if (!texto || !texto.trim()) {
      // Ingrediente por defecto
      const fallbackInsumo = insumosDisponibles[0];
      return fallbackInsumo ? [{
        id: `ing-${Date.now()}-1`,
        insumoId: fallbackInsumo.id,
        cantidad: 100,
        unidad: (fallbackInsumo.unidadMedida as any) || 'g'
      }] : [];
    }

    const items = texto.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0);
    const ingredientes: IngredienteReceta[] = [];

    items.forEach((item, index) => {
      // Regex para separar "Nombre Insumo: 220 g" o "Filete 220g"
      let nombre = item;
      let cantidad = 100;
      let unidad: 'kg' | 'g' | 'L' | 'ml' | 'unidad' = 'g';

      if (item.includes(':')) {
        const partes = item.split(':');
        nombre = partes[0].trim();
        const cantStr = partes[1].trim();
        const numMatch = cantStr.match(/([\d.,]+)\s*([a-zA-Záéíóúñ]+)?/);
        if (numMatch) {
          cantidad = limpiarNumero(numMatch[1]) || 100;
          const u = (numMatch[2] || '').toLowerCase();
          if (u === 'kg' || u === 'kilo' || u === 'kilos') unidad = 'kg';
          else if (u === 'g' || u === 'gr' || u === 'gramos') unidad = 'g';
          else if (u === 'l' || u === 'lt' || u === 'litro' || u === 'litros') unidad = 'L';
          else if (u === 'ml' || u === 'cc') unidad = 'ml';
          else if (u.includes('un') || u === 'u') unidad = 'unidad';
        }
      } else {
        const numMatch = item.match(/^(.*?)\s+([\d.,]+)\s*([a-zA-Záéíóúñ]+)?$/);
        if (numMatch) {
          nombre = numMatch[1].trim();
          cantidad = limpiarNumero(numMatch[2]) || 100;
          const u = (numMatch[3] || '').toLowerCase();
          if (u === 'kg' || u === 'kilo') unidad = 'kg';
          else if (u === 'g' || u === 'gr') unidad = 'g';
          else if (u === 'l' || u === 'lt') unidad = 'L';
          else if (u === 'ml' || u === 'cc') unidad = 'ml';
          else if (u.includes('un')) unidad = 'unidad';
        }
      }

      const res = resolverInsumoId(nombre);
      ingredientes.push({
        id: `ing-${Date.now()}-${index}`,
        insumoId: res.insumoId,
        cantidad: cantidad > 0 ? cantidad : res.cantidad,
        unidad: unidad || res.unidad
      });
    });

    return ingredientes.length > 0 ? ingredientes : [{
      id: `ing-${Date.now()}-default`,
      insumoId: insumosDisponibles[0]?.id || 'ins-base',
      cantidad: 150,
      unidad: 'g'
    }];
  };

  // ── PROCESAR MATRIZ DE DATOS A OBJETOS RECETAFICHATECNICA ──
  const procesarMatrizARecetas = (filas: any[][]): RecetaFichaTecnica[] => {
    if (!filas || filas.length < 2) {
      throw new Error('El archivo no contiene suficientes filas de datos.');
    }

    const headerRow = filas[0].map(h => String(h || '').trim().toLowerCase());

    const findIndex = (keywords: string[]) => {
      return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxNombre = findIndex(['nombre', 'ficha', 'receta', 'plato']);
    const idxTiempo = findIndex(['tiempo', 'momento', 'etapa', 'servicio']);
    const idxCat = findIndex(['categoria', 'tipo', 'rubro']);
    const idxRend = findIndex(['rendimiento', 'porciones', 'pax']);
    const idxMargen = findIndex(['margen', 'food cost', '%']);
    const idxCostoAdic = findIndex(['adicional', 'elaboracion', 'gas', 'indirecto']);
    const idxMenu = findIndex(['menu', 'carta']);
    const idxDesc = findIndex(['descripcion', 'procedimiento', 'preparacion', 'detalle']);
    const idxIng = findIndex(['ingredientes', 'insumos', 'materia prima', 'escandallo']);

    if (idxNombre === -1) {
      throw new Error('No se encontró la columna de Nombre de la Ficha / Receta.');
    }

    const resultado: RecetaFichaTecnica[] = [];

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (!fila || fila.length === 0) continue;

      const nombre = String(fila[idxNombre] || '').trim();
      if (!nombre) continue;

      const tiempoRaw = idxTiempo !== -1 ? String(fila[idxTiempo] || '').trim().toLowerCase() : 'fondo';
      let tiempoMenu = 'fondo';
      if (tiempoRaw.includes('coctel') || tiempoRaw.includes('cóctel') || tiempoRaw.includes('bocado')) tiempoMenu = 'coctel';
      else if (tiempoRaw.includes('entrada')) tiempoMenu = 'entrada';
      else if (tiempoRaw.includes('postre') || tiempoRaw.includes('dulce')) tiempoMenu = 'postre';
      else if (tiempoRaw.includes('trasnoche') || tiempoRaw.includes('bajon')) tiempoMenu = 'trasnoche';
      else if (tiempoRaw.includes('coffee') || tiempoRaw.includes('cafe')) tiempoMenu = 'coffee-break';
      else if (tiempoRaw) tiempoMenu = tiempoRaw.replace(/\s+/g, '_');

      const categoria = idxCat !== -1 && fila[idxCat] ? String(fila[idxCat]).trim() : 'Plato Gourmet';
      const rendimiento = idxRend !== -1 ? Math.max(1, Math.round(limpiarNumero(fila[idxRend]))) : 1;
      const margen = idxMargen !== -1 ? Math.max(5, Math.min(80, Math.round(limpiarNumero(fila[idxMargen])))) || 33 : 33;
      const costoAdicional = idxCostoAdic !== -1 ? Math.round(limpiarNumero(fila[idxCostoAdic])) : 400;

      const menuNombre = idxMenu !== -1 ? String(fila[idxMenu] || '').trim().toLowerCase() : '';
      let menuAsociadoId = menusDisponibles[0]?.id;
      if (menuNombre) {
        const matchMenu = menusDisponibles.find(m => m.nombre.toLowerCase().includes(menuNombre));
        if (matchMenu) menuAsociadoId = matchMenu.id;
      }

      const descripcion = idxDesc !== -1 && fila[idxDesc] ? String(fila[idxDesc]).trim() : `Ficha técnica de ${nombre}. Preparación gourmet para banquetería de bodas.`;
      const ingTexto = idxIng !== -1 ? String(fila[idxIng] || '') : '';
      const ingredientes = parsearIngredientesTexto(ingTexto);

      const id = `rec-isidora-${Date.now()}-${i}`;

      resultado.push({
        id,
        nombre,
        tiempoMenu,
        categoria,
        rendimientoPorciones: rendimiento,
        margenSugerido: margen,
        costoAdicionalElaboracion: costoAdicional,
        menuAsociadoId,
        descripcionProcedimiento: descripcion,
        ingredientes
      });
    }

    if (resultado.length === 0) {
      throw new Error('No se detectaron recetas válidas en las filas leídas.');
    }

    return resultado;
  };

  // ── MANEJO DE ARCHIVO EXCEL / CSV ──
  const procesarArchivo = (file: File) => {
    setErrorParseo(null);
    setArchivoNombre(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let filas: any[][] = [];

        if (file.name.endsWith('.csv')) {
          const texto = new TextDecoder('utf-8').decode(data as ArrayBuffer);
          const primeraLinea = texto.split('\n')[0] || '';
          const delimitador = primeraLinea.includes(';') ? ';' : primeraLinea.includes('\t') ? '\t' : ',';
          filas = texto
            .split(/\r?\n/)
            .filter(l => l.trim().length > 0)
            .map(linea => {
              const regex = new RegExp(`(?:^|${delimitador})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimitador}]*))`, 'g');
              const celdas: string[] = [];
              let match;
              while ((match = regex.exec(linea)) !== null) {
                let celda = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
                celdas.push(celda ? celda.trim() : '');
              }
              return celdas;
            });
        } else {
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          filas = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        }

        const parsed = procesarMatrizARecetas(filas);
        setRecetasLeidas(parsed);
      } catch (err: any) {
        console.error('Error parseando archivo de recetas:', err);
        setErrorParseo(err.message || 'Error al leer el archivo. Asegúrate de usar la plantilla.');
        setRecetasLeidas([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ── MANEJO DE PEGAR DESDE PORTAPAPELES ──
  const procesarTextoPegado = () => {
    setErrorParseo(null);
    if (!textoPegado.trim()) {
      setErrorParseo('Pega primero las celdas copiadas desde Excel.');
      return;
    }

    try {
      const lineas = textoPegado.trim().split(/\r?\n/);
      const primeraLinea = lineas[0] || '';
      const delimitador = primeraLinea.includes('\t') ? '\t' : primeraLinea.includes(';') ? ';' : ',';

      const filas = lineas.map(l => l.split(delimitador).map(c => c.trim().replace(/^"|"$/g, '')));
      const parsed = procesarMatrizARecetas(filas);
      setRecetasLeidas(parsed);
      setArchivoNombre('Celdas Pegadas desde Excel');
    } catch (err: any) {
      console.error('Error parseando texto pegado:', err);
      setErrorParseo(err.message || 'No se pudieron interpretar las celdas pegadas. Verifica el formato.');
      setRecetasLeidas([]);
    }
  };

  // ── CARGA RÁPIDA 1-CLIC DE PRUEBA ISIDORA ──
  const handleCargarEjemploPrueba = () => {
    setErrorParseo(null);
    setArchivoNombre('Plantilla de Prueba Doña Isidora (6 Fichas Técnicas)');
    const demoRecetas: RecetaFichaTecnica[] = RECETAS_PLANTILLA_EJEMPLO.map((r, idx) => ({
      id: `rec-isidora-demo-${idx + 1}`,
      nombre: r.nombre,
      tiempoMenu: r.tiempoMenu,
      categoria: r.categoria,
      rendimientoPorciones: r.rendimientoPorciones,
      margenSugerido: r.margenSugerido,
      costoAdicionalElaboracion: r.costoAdicionalElaboracion,
      menuAsociadoId: menusDisponibles[0]?.id || 'menu-isidora-campestre',
      descripcionProcedimiento: r.descripcionProcedimiento,
      ingredientes: parsearIngredientesTexto(r.ingredientesTexto)
    }));
    setRecetasLeidas(demoRecetas);
  };

  const handleConfirmarImportacion = () => {
    if (recetasLeidas.length === 0) return;
    onImportarRecetas(recetasLeidas, modoImportacion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-white to-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Carga Masiva de Fichas Técnicas & Recetas Excel
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  Demo Isidora
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Descarga la plantilla con escandallos gastronómicos, edita tus platos y cárgalos en lote para {nombreEmpresa}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* PASO 1: DESCARGA DE LA PLANTILLA OFICIAL */}
          <div className="bg-gradient-to-br from-amber-50/60 to-slate-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/90 px-2 py-0.5 rounded">
                  Paso 1 · Plantilla Oficial de Cocina
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Planilla Excel para Fichas Técnicas, Tiempos de Menú e Ingredientes
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Incluye columnas para el nombre del plato, tiempo (cóctel, entrada, fondo, postre, trasnoche), margen gastronómico (33%), porciones y materias primas.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDescargarPlantillaExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  title="Descargar archivo Excel .xlsx nativo"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Plantilla Excel (.xlsx)</span>
                  <Download className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={handleDescargarPlantillaCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs shadow-2xs transition-colors"
                  title="Descargar versión CSV separada por punto y coma"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Guía Rápida de Formato */}
            <div className="mt-3.5 pt-3 border-t border-amber-200 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Tiempos:</strong> <code>coctel</code>, <code>entrada</code>, <code>fondo</code>, <code>postre</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Margen:</strong> porcentaje estándar (ej: <code>33%</code>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Ingredientes:</strong> <code>Insumo: Cantidad g/kg/ml</code></span>
              </div>
            </div>
          </div>

          {/* PASO 2: SUBIR ARCHIVO O PEGAR CELDAS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  Paso 2 · Cargar Archivo o Datos
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Selecciona tu planilla editada o pega las celdas
                </h4>
              </div>

              {/* Botón de Muestra 1 Clic */}
              <button
                type="button"
                onClick={handleCargarEjemploPrueba}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-lg transition-colors"
                title="Cargar 6 recetas completas de muestra sin subir archivo"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Cargar 6 de Muestra</span>
              </button>
            </div>

            {/* Pestañas: Archivo vs Pegar */}
            <div className="flex border-b border-slate-200 mb-3">
              <button
                type="button"
                onClick={() => setTab('archivo')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
                  tab === 'archivo'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Subir Archivo (.xlsx / .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('pegar')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
                  tab === 'pegar'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Pegar desde Excel (Ctrl+V)</span>
              </button>
            </div>

            {/* Dropzone */}
            {tab === 'archivo' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setEsDragOver(true);
                }}
                onDragLeave={() => setEsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setEsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    procesarArchivo(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  esDragOver
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      procesarArchivo(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <ChefHat className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Haz clic para seleccionar o arrastra tu archivo de recetas aquí
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos soportados: <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>
                </p>
                {archivoNombre && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Archivo cargado: {archivoNombre}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pegar Celdas */}
            {tab === 'pegar' && (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  value={textoPegado}
                  onChange={(e) => setTextoPegado(e.target.value)}
                  placeholder="Copia las celdas directamente de tu planilla de recetas (con encabezados) y pégalas aquí..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/60"
                />
                <button
                  type="button"
                  onClick={procesarTextoPegado}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Procesar Celdas Pegadas</span>
                </button>
              </div>
            )}

            {errorParseo && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Atención:</strong> {errorParseo}
                </div>
              </div>
            )}
          </div>

          {/* PASO 3: VISTA PREVIA Y COSTEO EN TIEMPO REAL */}
          {recetasLeidas.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Vista Previa y Costeo de Fichas Detectadas
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-300">
                      {recetasLeidas.length} listas para importar
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    El sistema calcula automáticamente el costo por porción y precio sugerido con los insumos del maestro.
                  </p>
                </div>

                {/* Selector Modo */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-slate-700 font-medium hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modoImportRec"
                      checked={modoImportacion === 'agregar'}
                      onChange={() => setModoImportacion('agregar')}
                      className="text-amber-600"
                    />
                    <span>Agregar a las existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-slate-700 font-medium hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modoImportRec"
                      checked={modoImportacion === 'reemplazar'}
                      onChange={() => setModoImportacion('reemplazar')}
                      className="text-amber-600"
                    />
                    <span>Reemplazar todo</span>
                  </label>
                </div>
              </div>

              {/* Tabla de Vista Previa */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 font-bold text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Ficha / Plato</th>
                      <th className="py-2 px-3">Tiempo</th>
                      <th className="py-2 px-3">Ingredientes</th>
                      <th className="py-2 px-3 text-right">Costo / Porción</th>
                      <th className="py-2 px-3 text-right">P. Sugerido (33%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recetasLeidas.map((r, idx) => {
                      const { costoPorPorcion, precioSugeridoVenta } = calcularCostoReceta(r, insumosDisponibles);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span className="truncate max-w-[220px]" title={r.nombre}>{r.nombre}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block ml-4">
                              {r.categoria} · {r.rendimientoPorciones} {r.rendimientoPorciones === 1 ? 'porción' : 'porciones'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                              {r.tiempoMenu}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600">
                            <span className="font-medium text-slate-800">
                              {r.ingredientes?.length || 0} materias primas
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                            {formatMoneda(costoPorPorcion)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-800 tabular-nums">
                            {formatMoneda(precioSugeridoVenta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Opción de Restablecer */}
          {onRestablecerRecetas && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>¿Deseas volver a las fichas técnicas originales de Doña Isidora?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Restablecer las fichas técnicas al catálogo original de Doña Isidora?')) {
                    onRestablecerRecetas();
                    onClose();
                  }
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline"
              >
                Restablecer Fichas Base
              </button>
            </div>
          )}
        </div>

        {/* Pie del Modal: Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {recetasLeidas.length > 0 ? (
              <span>
                {modoImportacion === 'agregar' ? 'Se sumarán' : 'Se reemplazarán por'}{' '}
                <strong>{recetasLeidas.length} fichas técnicas</strong> en Doña Isidora.
              </span>
            ) : (
              <span>Descarga la plantilla o usa el botón de muestra para cargar fichas.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={recetasLeidas.length === 0}
              onClick={handleConfirmarImportacion}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all ${
                recetasLeidas.length > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer hover:shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                Confirmar e Importar ({recetasLeidas.length})
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
