import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ProveedorServicio } from '../types';
import { formatMoneda } from '../utils/formatters';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  Truck,
  RotateCcw,
  Check,
  Building2,
  Phone,
  Mail,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ModalCargaMasivaProveedoresProps {
  isOpen: boolean;
  onClose: () => void;
  proveedoresActuales: ProveedorServicio[];
  onImportarProveedores: (nuevosProveedores: ProveedorServicio[], modo: 'agregar' | 'reemplazar') => void;
  onRestablecerProveedores?: () => void;
  nombreEmpresa?: string;
}

// Datos de ejemplo predefinidos para la plantilla y prueba rápida
const PROVEEDORES_PLANTILLA_EJEMPLO = [
  {
    nombre: 'DJ & Iluminación Robótica de Fiesta',
    tipoCobro: 'fijo',
    costo: 380000,
    precioVentaSugerido: 580000,
    categoria: 'tecnica',
    iconName: 'Disc',
    contactoNombre: 'Matías DJ Pro',
    telefonoPedidos: '+56984321122',
    emailPedidos: 'djmatias@eventos.cl',
    plazoAnticipacion: '15 días antes',
    descripcion: 'Sistema de sonido profesional line-array, micrófonos inalámbricos, consola y show de cabezas móviles robotizadas para pista.'
  },
  {
    nombre: 'Barra Abierta de Coctelería de Autor',
    tipoCobro: 'por_persona',
    costo: 6800,
    precioVentaSugerido: 12500,
    categoria: 'bar',
    iconName: 'Wine',
    contactoNombre: 'Nicolás Barra Móvil',
    telefonoPedidos: '+56971223344',
    emailPedidos: 'barra@cocteles.cl',
    plazoAnticipacion: '7 días antes',
    descripcion: 'Barra ilimitada durante toda la fiesta: destilados premium, coctelería de autor, cristalería tallada, hielo continuo y bartenders.'
  },
  {
    nombre: 'Vajilla & Cristalería Fina de Lujo',
    tipoCobro: 'por_persona',
    costo: 4200,
    precioVentaSugerido: 7800,
    categoria: 'vajilla',
    iconName: 'UtensilsCrossed',
    contactoNombre: 'Arriendos de Banquetería Andes',
    telefonoPedidos: '+56965544332',
    emailPedidos: 'contacto@arriendos.cl',
    plazoAnticipacion: '10 días antes',
    descripcion: 'Platos base texturados, cubertería dorada, copas de cristal labrado, servilletas de lino puro y vajilla para 4 tiempos.'
  },
  {
    nombre: 'Arreglos Florales & Arcos de Ceremonia',
    tipoCobro: 'fijo',
    costo: 480000,
    precioVentaSugerido: 750000,
    categoria: 'ambientacion',
    iconName: 'Flower2',
    contactoNombre: 'Loreto Floristería Nupcial',
    telefonoPedidos: '+56952334455',
    emailPedidos: 'loreto@flores.cl',
    plazoAnticipacion: '20 días antes',
    descripcion: 'Arco ceremonial decorado con flores de estación, caminos de mesa orgánicos, centros de mesa altos y ramo de novia.'
  },
  {
    nombre: 'Cobertura Audiovisual & Drone 4K',
    tipoCobro: 'fijo',
    costo: 650000,
    precioVentaSugerido: 980000,
    categoria: 'cobertura',
    iconName: 'Camera',
    contactoNombre: 'Felipe Fotografía',
    telefonoPedidos: '+56943219988',
    emailPedidos: 'felipe@fotosboda.cl',
    plazoAnticipacion: '30 días antes',
    descripcion: 'Cobertura de 10 horas completas, 2 fotógrafos, tomas aéreas con dron 4K, galería online privada y video teaser de 3 minutos.'
  },
  {
    nombre: 'Estación de Café de Grano & Petits Fours',
    tipoCobro: 'por_persona',
    costo: 2400,
    precioVentaSugerido: 4500,
    categoria: 'cocteleria',
    iconName: 'Coffee',
    contactoNombre: 'Café & Dulzuras Móvil',
    telefonoPedidos: '+56933221100',
    emailPedidos: 'contacto@cafemovil.cl',
    plazoAnticipacion: '7 días antes',
    descripcion: 'Cafetería espresso y cappuccino en grano molido al instante, infusiones orgánicas y torre de mini macarons y bombones.'
  }
];

export const ModalCargaMasivaProveedores: React.FC<ModalCargaMasivaProveedoresProps> = ({
  isOpen,
  onClose,
  proveedoresActuales,
  onImportarProveedores,
  onRestablecerProveedores,
  nombreEmpresa = 'Doña Isidora Eventos'
}) => {
  const [tab, setTab] = useState<'archivo' | 'pegar'>('archivo');
  const [archivoNombre, setArchivoNombre] = useState<string>('');
  const [textoPegado, setTextoPegado] = useState<string>('');
  const [proveedoresLeidos, setProveedoresLeidos] = useState<ProveedorServicio[]>([]);
  const [modoImportacion, setModoImportacion] = useState<'agregar' | 'reemplazar'>('agregar');
  const [errorParseo, setErrorParseo] = useState<string | null>(null);
  const [esDragOver, setEsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ── DESCARGA DE PLANTILLA EN EXCEL (.XLSX NATIVO) ──
  const handleDescargarPlantillaExcel = () => {
    try {
      const dataAOA: (string | number)[][] = [
        // Fila 1: Encabezados técnicos reconocidos
        [
          'Nombre',
          'Tipo Cobro (fijo o por_persona)',
          'Costo Real (CLP)',
          'Precio Venta Sugerido (CLP)',
          'Categoria (tecnica, ambientacion, vajilla, bar, cobertura, cocteleria)',
          'Contacto Nombre',
          'Telefono WhatsApp',
          'Email Contacto',
          'Plazo Anticipacion',
          'Descripcion'
        ],
        // Filas de ejemplo
        ...PROVEEDORES_PLANTILLA_EJEMPLO.map(p => [
          p.nombre,
          p.tipoCobro,
          p.costo,
          p.precioVentaSugerido,
          p.categoria,
          p.contactoNombre,
          p.telefonoPedidos,
          p.emailPedidos,
          p.plazoAnticipacion,
          p.descripcion
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(dataAOA);

      // Ancho automático de columnas
      ws['!cols'] = [
        { wch: 38 }, // Nombre
        { wch: 22 }, // Tipo Cobro
        { wch: 18 }, // Costo
        { wch: 22 }, // Precio Venta
        { wch: 20 }, // Categoria
        { wch: 25 }, // Contacto
        { wch: 18 }, // Telefono
        { wch: 24 }, // Email
        { wch: 18 }, // Plazo
        { wch: 45 }  // Descripcion
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
      XLSX.writeFile(wb, 'plantilla_proveedores_dona_isidora.xlsx');
    } catch (err) {
      console.error('Error generando plantilla Excel:', err);
      // Fallback a CSV
      handleDescargarPlantillaCSV();
    }
  };

  // ── DESCARGA DE PLANTILLA EN CSV (COMPATIBLE CON EXCEL CHILENO) ──
  const handleDescargarPlantillaCSV = () => {
    const encabezados = 'Nombre;Tipo Cobro;Costo Real;Precio Venta Sugerido;Categoria;Contacto;Telefono;Email;Plazo;Descripcion\n';
    const filas = PROVEEDORES_PLANTILLA_EJEMPLO.map(p =>
      `"${p.nombre}";"${p.tipoCobro}";${p.costo};${p.precioVentaSugerido};"${p.categoria}";"${p.contactoNombre}";"${p.telefonoPedidos}";"${p.emailPedidos}";"${p.plazoAnticipacion}";"${p.descripcion.replace(/"/g, '""')}"`
    ).join('\n');

    const csvContent = '\uFEFF' + encabezados + filas;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_proveedores_dona_isidora.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── LIMPIEZA Y PARSEO DE NUMEROS ──
  const limpiarNumero = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val).replace(/[$€\s.]/g, '').replace(/,/g, '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num);
  };

  // ── MAPEO DE ICONOS SEGÚN CATEGORÍA O NOMBRE ──
  const inferirIcono = (categoria: string, nombre: string): string => {
    const c = (categoria || '').toLowerCase();
    const n = (nombre || '').toLowerCase();
    if (c.includes('bar') || n.includes('bar') || n.includes('vino') || n.includes('trago')) return 'Wine';
    if (c.includes('vajilla') || n.includes('vajilla') || n.includes('loza') || n.includes('plato')) return 'UtensilsCrossed';
    if (c.includes('ambient') || c.includes('flor') || n.includes('flor') || n.includes('deco')) return 'Flower2';
    if (c.includes('tecnica') || n.includes('dj') || n.includes('audio') || n.includes('sonido') || n.includes('musica')) return 'Disc';
    if (c.includes('cobertura') || n.includes('foto') || n.includes('video') || n.includes('camara')) return 'Camera';
    if (c.includes('coffee') || n.includes('cafe') || n.includes('coffee')) return 'Coffee';
    if (n.includes('luz') || n.includes('ilumin') || n.includes('efecto')) return 'Zap';
    if (n.includes('magia') || n.includes('animacion') || n.includes('show')) return 'Sparkles';
    return 'Truck';
  };

  // ── PARSEO DE MATRIZ DE DATOS A OBJETOS PROVEEDOR ──
  const procesarMatrizAProveedores = (filas: any[][]): ProveedorServicio[] => {
    if (!filas || filas.length < 2) {
      throw new Error('El archivo no contiene suficientes filas de datos.');
    }

    // Identificar fila de encabezados
    const headerRow = filas[0].map(h => String(h || '').trim().toLowerCase());

    const findIndex = (keywords: string[]) => {
      return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxNombre = findIndex(['nombre', 'proveedor', 'servicio', 'item', 'descripcion']);
    const idxTipo = findIndex(['tipo', 'cobro', 'modalidad', 'unidad']);
    const idxCosto = findIndex(['costo', 'valor real', 'precio compra', 'costo unitario']);
    const idxPrecioVenta = findIndex(['venta', 'sugerido', 'precio cliente', 'tarifa']);
    const idxCat = findIndex(['categoria', 'rubro', 'tipo servicio']);
    const idxContacto = findIndex(['contacto', 'responsable', 'proveedor nombre', 'persona']);
    const idxTelefono = findIndex(['telefono', 'whatsapp', 'celular', 'fono', 'movil']);
    const idxEmail = findIndex(['email', 'correo', 'mail']);
    const idxPlazo = findIndex(['plazo', 'anticipacion', 'tiempo']);
    const idxDesc = findIndex(['detalle', 'nota', 'observacion', 'descripcion']);

    if (idxNombre === -1) {
      throw new Error('No se encontró la columna de Nombre de Proveedor en la cabecera.');
    }

    const resultado: ProveedorServicio[] = [];

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (!fila || fila.length === 0) continue;

      const nombre = String(fila[idxNombre] || '').trim();
      if (!nombre) continue; // Saltar filas vacías

      const tipoRaw = idxTipo !== -1 ? String(fila[idxTipo] || '').trim().toLowerCase() : '';
      const esPorPersona = tipoRaw.includes('persona') || tipoRaw.includes('pax') || tipoRaw.includes('comensal') || tipoRaw === 'por_persona';

      const costo = idxCosto !== -1 ? limpiarNumero(fila[idxCosto]) : 0;
      let precioVenta = idxPrecioVenta !== -1 ? limpiarNumero(fila[idxPrecioVenta]) : 0;
      if (precioVenta <= 0 && costo > 0) {
        // Margen por defecto ~35%
        precioVenta = Math.round(costo / 0.65);
      }

      const catRaw = idxCat !== -1 ? String(fila[idxCat] || '').trim().toLowerCase() : 'tecnica';
      let categoria: ProveedorServicio['categoria'] = 'tecnica';
      if (catRaw.includes('bar')) categoria = 'bar';
      else if (catRaw.includes('vajilla')) categoria = 'vajilla';
      else if (catRaw.includes('ambient') || catRaw.includes('flor')) categoria = 'ambientacion';
      else if (catRaw.includes('cobertura') || catRaw.includes('foto')) categoria = 'cobertura';
      else if (catRaw.includes('coctel') || catRaw.includes('cafe')) categoria = 'cocteleria';

      const contactoNombre = idxContacto !== -1 ? String(fila[idxContacto] || '').trim() : '';
      const telefonoPedidos = idxTelefono !== -1 ? String(fila[idxTelefono] || '').trim() : '';
      const emailPedidos = idxEmail !== -1 ? String(fila[idxEmail] || '').trim() : '';
      const plazoAnticipacion = idxPlazo !== -1 ? String(fila[idxPlazo] || '').trim() : '';
      const descripcion = (idxDesc !== -1 && idxDesc !== idxNombre ? String(fila[idxDesc] || '').trim() : '') ||
        `Servicio externalizado de ${nombre}. Coordinación y logística para bodas.`;

      const id = `prov-isidora-${Date.now()}-${i}`;
      const iconName = inferirIcono(categoria, nombre);

      resultado.push({
        id,
        nombre,
        tipoCobro: esPorPersona ? 'por_persona' : 'fijo',
        costo,
        precioVentaSugerido: precioVenta,
        categoria,
        iconName,
        contactoNombre: contactoNombre || undefined,
        telefonoPedidos: telefonoPedidos || undefined,
        emailPedidos: emailPedidos || undefined,
        plazoAnticipacion: plazoAnticipacion || undefined,
        descripcion
      });
    }

    if (resultado.length === 0) {
      throw new Error('No se detectaron proveedores válidos para importar en el archivo.');
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
          // Detectar delimitador (';', ',', '\t')
          const primeraLinea = texto.split('\n')[0] || '';
          const delimitador = primeraLinea.includes(';') ? ';' : primeraLinea.includes('\t') ? '\t' : ',';
          filas = texto
            .split(/\r?\n/)
            .filter(l => l.trim().length > 0)
            .map(linea => {
              // Regex para respetar comillas
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
          // Archivo XLSX o XLS nativo
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          filas = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        }

        const proveedoresParseados = procesarMatrizAProveedores(filas);
        setProveedoresLeidos(proveedoresParseados);
      } catch (err: any) {
        console.error('Error parseando archivo:', err);
        setErrorParseo(err.message || 'Error al leer el archivo. Asegúrate de usar la plantilla.');
        setProveedoresLeidos([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ── MANEJO DE COPIAR Y PEGAR DESDE EXCEL ──
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
      const proveedoresParseados = procesarMatrizAProveedores(filas);
      setProveedoresLeidos(proveedoresParseados);
      setArchivoNombre('Celdas Pegadas desde Excel');
    } catch (err: any) {
      console.error('Error parseando texto pegado:', err);
      setErrorParseo(err.message || 'No se pudieron interpretar las celdas pegadas. Verifica el formato.');
      setProveedoresLeidos([]);
    }
  };

  // ── CARGA RÁPIDA DE PRUEBA 1-CLIC (DEMO ISIDORA) ──
  const handleCargarEjemploPrueba = () => {
    setErrorParseo(null);
    setArchivoNombre('Plantilla de Prueba Doña Isidora (6 Proveedores)');
    const proveedoresDemo: ProveedorServicio[] = PROVEEDORES_PLANTILLA_EJEMPLO.map((p, idx) => ({
      id: `prov-isidora-demo-${idx + 1}`,
      nombre: p.nombre,
      tipoCobro: p.tipoCobro as 'fijo' | 'por_persona',
      costo: p.costo,
      precioVentaSugerido: p.precioVentaSugerido,
      categoria: p.categoria as any,
      iconName: p.iconName,
      contactoNombre: p.contactoNombre,
      telefonoPedidos: p.telefonoPedidos,
      emailPedidos: p.emailPedidos,
      plazoAnticipacion: p.plazoAnticipacion,
      descripcion: p.descripcion
    }));
    setProveedoresLeidos(proveedoresDemo);
  };

  // ── CONFIRMAR E IMPORTAR ──
  const handleConfirmarImportacion = () => {
    if (proveedoresLeidos.length === 0) return;
    onImportarProveedores(proveedoresLeidos, modoImportacion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Carga Masiva de Proveedores & Plantilla Excel
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  Demo Isidora
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Descarga la plantilla oficial en Excel, edita tus servicios y súbelos en segundos para {nombreEmpresa}.
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
          <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-2 py-0.5 rounded">
                  Paso 1 · Plantilla Oficial
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Descarga la planilla modelo con ejemplos reales de bodas y banquetería
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Ya viene formateada con columnas para nombre, cobro por persona o fijo, costos reales, precios de venta y datos de contacto directo.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDescargarPlantillaExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
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
            <div className="mt-3.5 pt-3 border-t border-indigo-100 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Tipo Cobro:</strong> <code>fijo</code> o <code>por_persona</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Costo Real:</strong> valores en pesos sin puntos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Contacto:</strong> nombre, teléfono de pedidos y plazo</span>
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
                  Selecciona tu archivo modificado o pega las celdas
                </h4>
              </div>

              {/* Botón de Prueba Rápida 1 Clic */}
              <button
                type="button"
                onClick={handleCargarEjemploPrueba}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
                title="Carga instantánea de 6 proveedores de muestra sin subir archivo"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
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
                    ? 'border-indigo-600 text-indigo-600'
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
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Pegar desde Excel (Ctrl+V)</span>
              </button>
            </div>

            {/* Vista Tab 1: Dropzone Archivo */}
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
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/40'
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
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Haz clic para seleccionar o arrastra tu archivo aquí
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

            {/* Vista Tab 2: Pegar Celdas */}
            {tab === 'pegar' && (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  value={textoPegado}
                  onChange={(e) => setTextoPegado(e.target.value)}
                  placeholder="Copia las celdas directamente de tu planilla Excel (incluyendo encabezados) y pégalas aquí con Ctrl+V..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/60"
                />
                <button
                  type="button"
                  onClick={procesarTextoPegado}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Procesar Celdas Pegadas</span>
                </button>
              </div>
            )}

            {/* Error si ocurre */}
            {errorParseo && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Atención:</strong> {errorParseo}
                </div>
              </div>
            )}
          </div>

          {/* PASO 3: VISTA PREVIA Y VALIDACIÓN DE FILAS */}
          {proveedoresLeidos.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Vista Previa de Proveedores Detectados
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-300">
                      {proveedoresLeidos.length} listos para importar
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verifica que los costos y cobros coincidan antes de confirmar la importación.
                  </p>
                </div>

                {/* Selector de Modo: Agregar vs Reemplazar */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-slate-700 font-medium hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modoImport"
                      checked={modoImportacion === 'agregar'}
                      onChange={() => setModoImportacion('agregar')}
                      className="text-indigo-600"
                    />
                    <span>Agregar a los existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-slate-700 font-medium hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modoImport"
                      checked={modoImportacion === 'reemplazar'}
                      onChange={() => setModoImportacion('reemplazar')}
                      className="text-indigo-600"
                    />
                    <span>Reemplazar todo</span>
                  </label>
                </div>
              </div>

              {/* Tabla de Vista Previa */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 font-bold text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Servicio / Proveedor</th>
                      <th className="py-2 px-3">Cobro</th>
                      <th className="py-2 px-3 text-right">Costo Real</th>
                      <th className="py-2 px-3 text-right">Precio Venta</th>
                      <th className="py-2 px-3">Contacto / WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proveedoresLeidos.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="truncate max-w-[220px]" title={p.nombre}>{p.nombre}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block ml-4">
                            Cat: {p.categoria} · {p.descripcion?.slice(0, 50)}...
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.tipoCobro === 'por_persona'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {p.tipoCobro === 'por_persona' ? 'Por Persona' : 'Cobro Fijo'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                          {formatMoneda(p.costo)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-900 tabular-nums">
                          {formatMoneda(p.precioVentaSugerido)}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          <div className="font-medium text-slate-800 truncate max-w-[150px]">
                            {p.contactoNombre || '—'}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            {p.telefonoPedidos || '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Opción de Restablecer a Proveedores Predeterminados */}
          {onRestablecerProveedores && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>¿Deseas volver a los proveedores de fábrica de Doña Isidora?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Restablecer el catálogo de proveedores al estado original de Doña Isidora?')) {
                    onRestablecerProveedores();
                    onClose();
                  }
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline"
              >
                Restablecer Proveedores Base
              </button>
            </div>
          )}
        </div>

        {/* Pie del Modal: Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {proveedoresLeidos.length > 0 ? (
              <span>
                {modoImportacion === 'agregar' ? 'Se sumarán' : 'Se reemplazarán por'}{' '}
                <strong>{proveedoresLeidos.length} proveedores</strong> en el Módulo 3.
              </span>
            ) : (
              <span>Carga un archivo Excel o usa el botón de muestra para continuar.</span>
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
              disabled={proveedoresLeidos.length === 0}
              onClick={handleConfirmarImportacion}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all ${
                proveedoresLeidos.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                Confirmar e Importar ({proveedoresLeidos.length})
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
