import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, X, 
  ChevronRight, ChevronLeft, CheckCircle2, Copy, Check, Share2, 
  ChefHat, Users, FileText, ArrowRight, ShieldCheck, Flame, Mic, MessageCircle
} from 'lucide-react';
import { EmpresaCliente } from '../types';

interface DemoComercialModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: EmpresaCliente;
  onIrAFuncion: (vista: 'cotizador' | 'recetas' | 'insumos' | 'calendario') => void;
}

interface EscenaComercial {
  id: number;
  titulo: string;
  subtitulo: string;
  tagline: string;
  textoLocucion: string;
  colorFondo: string;
  icono: any;
  vistaDestino: 'cotizador' | 'recetas' | 'insumos' | 'calendario';
  kpis: { valor: string; etiqueta: string }[];
  puntosClave: string[];
}

export const DemoComercialModal: React.FC<DemoComercialModalProps> = ({
  isOpen,
  onClose,
  empresa,
  onIrAFuncion
}) => {
  const [escenaActual, setEscenaActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [vozHabilitada, setVozHabilitada] = useState(true);
  const [progresoEscena, setProgresoEscena] = useState(0);
  const [pestañaActiva, setPestañaActiva] = useState<'video' | 'guion'>('video');
  const [copiado, setCopiado] = useState(false);

  // Voces disponibles en español ordenadas (priorizando Latina Neutra Femenina)
  const [vocesEspanol, setVocesEspanol] = useState<SpeechSynthesisVoice[]>([]);
  const [vozSeleccionadaURI, setVozSeleccionadaURI] = useState<string>('');

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const progressTimerRef = useRef<any>(null);
  const keepAliveRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = reproduciendo;

  const escenas: EscenaComercial[] = [
    {
      id: 1,
      titulo: "¿Horas cotizando a mano y calculando costos a ciegas?",
      subtitulo: "El desafío real de cada fin de semana en gastronomía y eventos",
      tagline: "EL PROBLEMA",
      textoLocucion: `¿Sabías que un centro de eventos pierde hasta un veinte por ciento de sus utilidades por cotizar tarde o sin calcular los costos reales de cada ingrediente? Administrar un banquete no debería ser un dolor de cabeza entre planillas y dudas.`,
      colorFondo: "from-slate-900 via-rose-950 to-slate-900",
      icono: Flame,
      vistaDestino: "cotizador",
      kpis: [
        { valor: "-20%", etiqueta: "Pérdida en costos no previstos" },
        { valor: "4 a 6 hrs", etiqueta: "Tiempo promedio por cotización" },
        { valor: "Mermas", etiqueta: "Fugas invisibles de dinero" }
      ],
      puntosClave: [
        "Planillas de Excel complejas y desactualizadas",
        "Dudas sobre cuánto cobrar realmente por comensal",
        "Cotizaciones lentas que hacen que los clientes elijan a otro"
      ]
    },
    {
      id: 2,
      titulo: `Presentamos SOLVI Flow: «Todo fluye. Todo conecta»`,
      subtitulo: `Gestión integral de eventos de CS Consultoría adaptada a ${empresa.nombre}`,
      tagline: "LA TRANSFORMACIÓN",
      textoLocucion: `Te presentamos SOLVI Flow, desarrollado por CS Consultoría. Toda la operación de tu empresa de eventos en una sola plataforma: cotizador, escandallo gastronómico, compras y calendario en tiempo real. Todo fluye, todo conecta.`,
      colorFondo: "from-slate-900 via-indigo-950 to-slate-900",
      icono: Sparkles,
      vistaDestino: "cotizador",
      kpis: [
        { valor: "100%", etiqueta: "Cálculo en vivo reactivo" },
        { valor: "SOLVI Flow", etiqueta: "Software integral de eventos" },
        { valor: "CS Consultoría", etiqueta: "Soporte e innovación" }
      ],
      puntosClave: [
        "Menús de cóctel, buffet y gala con precios dinámicos",
        "Control instantáneo de capacidad de invitados y costos",
        "Toda la operación en una sola plataforma fluida"
      ]
    },
    {
      id: 3,
      titulo: "Costeo de Recetas & Margen Real del 33%",
      subtitulo: "Controla cada gramo de carne, salmón y mermas con el estándar de oro gastronómico",
      tagline: "CONTROL FINANCIERO",
      textoLocucion: `Con la calculadora de recetas y costeo de platos, controlas el costo exacto de cada gramo de carne, verduras y mermas. El sistema aplica automáticamente la regla de oro del treinta y tres por ciento gastronómico para blindar tu ganancia.`,
      colorFondo: "from-slate-900 via-emerald-950 to-slate-900",
      icono: ChefHat,
      vistaDestino: "recetas",
      kpis: [
        { valor: "33%", etiqueta: "Margen sugerido gastronómico" },
        { valor: "100% Preciso", etiqueta: "Cálculo exacto de mermas" },
        { valor: "$ / Plato", etiqueta: "Costo unitario sincronizado" }
      ],
      puntosClave: [
        "Maestro de insumos con precios reales de proveedores",
        "Actualiza el precio del kilo de carne y se actualizan todos los menús",
        "Decide con números fríos tu precio de venta sugerido"
      ]
    },
    {
      id: 4,
      titulo: "Brigada, Proveedores y Mesas Automatizadas",
      subtitulo: "Sabe exactamente cuántos garzones contratar y detecta si te faltan mesas",
      tagline: "OPERACIONES SIN ERRORES",
      textoLocucion: `No más sorpresas el día del evento. El sistema calcula automáticamente la cantidad recomendada de garzones, cocineros y personal de aseo. Además, te avisa en rojo al instante si faltan mesas para tus invitados.`,
      colorFondo: "from-slate-900 via-blue-950 to-slate-900",
      icono: Users,
      vistaDestino: "cotizador",
      kpis: [
        { valor: "1 x 15", etiqueta: "Ratio garzón por comensales" },
        { valor: "Auto-Fill", etiqueta: "Distribución de mesas en 1 clic" },
        { valor: "Proveedores", etiqueta: "Vajilla, DJ y flores integrados" }
      ],
      puntosClave: [
        "Alertas rojas automáticas si la capacidad no coincide",
        "Tarifas configurables por jornada de personal",
        "Servicios adicionales por comensal o tarifa fija"
      ]
    },
    {
      id: 5,
      titulo: "Fichas de Cotización de Lujo listas para Enviar",
      subtitulo: "Propuestas elegantes en PDF con membrete oficial que cierran ventas al instante",
      tagline: "VENTAS Y CIERRE",
      textoLocucion: `Sorprende a novios y empresas con propuestas comerciales de primer nivel. Genera la ficha formal con el membrete oficial de tu centro de eventos, lista para imprimir o compartir por WhatsApp en formato PDF.`,
      colorFondo: "from-slate-900 via-purple-950 to-slate-900",
      icono: FileText,
      vistaDestino: "calendario",
      kpis: [
        { valor: "1 Clic", etiqueta: "Generación de PDF formal" },
        { valor: "+300%", etiqueta: "Mayor tasa de conversión" },
        { valor: "WhatsApp", etiqueta: "Listo para enviar a novios" }
      ],
      puntosClave: [
        `Membrete con logotipo oficial de ${empresa.nombre}`,
        "Desglose limpio sin mostrar tus costos internos",
        "Calendario mensual para evitar doble reserva de fechas"
      ]
    },
    {
      id: 6,
      titulo: "SOLVI Flow: «Todo fluye. Todo conecta»",
      subtitulo: "Software de gestión integral de centros de eventos y productoras por CS Consultoría",
      tagline: "¡COMIENZA AHORA!",
      textoLocucion: `Haz crecer tu centro de eventos con SOLVI Flow de CS Consultoría. Organización, eficiencia, tecnología y fluidez. Toda la operación de tu empresa de eventos en una sola plataforma. ¡Escríbenos y agenda tu demostración en vivo hoy mismo!`,
      colorFondo: "from-slate-900 via-indigo-950 to-slate-900",
      icono: ShieldCheck,
      vistaDestino: "cotizador",
      kpis: [
        { valor: "SOLVI Flow", etiqueta: "Software de eventos" },
        { valor: "CS Consultoría", etiqueta: "Desarrollo y soporte" },
        { valor: "24/7", etiqueta: "Uptime y respaldo" }
      ],
      puntosClave: [
        "Toda la operación de una empresa de eventos, en una sola plataforma",
        "Personalidad moderna, elegante, intuitiva y profesional",
        "Asesoría directa con CS Consultoría"
      ]
    }
  ];

  // ── Cargar y filtrar voces con prioridad absoluta de VOZ LATINA NEUTRA FEMENINA ──
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    synthRef.current = window.speechSynthesis;

    const actualizarVoces = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      // Filtrar todas las voces en español
      const vocesEs = allVoices.filter(v => v.lang.startsWith('es') || v.lang.includes('es'));
      if (vocesEs.length === 0) return;

      // Función de puntuación para priorizar Voz Latina Neutra Femenina:
      // 1. Idioma Latino: es-419 (Latinoamérica), es-MX (México neutro), es-US, es-CL, es-CO
      // 2. Nombre femenino común
      // 3. Penalizar acento de España (es-ES) para asegurar tono latino
      const puntuarVoz = (v: SpeechSynthesisVoice): number => {
        let score = 0;
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();

        // Bonus por idioma latinoamericano neutro
        if (lang === 'es-419' || lang.includes('419')) score += 100;
        else if (lang === 'es-mx' || lang.includes('mx')) score += 90;
        else if (lang === 'es-us' || lang.includes('us')) score += 85;
        else if (lang === 'es-co' || lang.includes('co')) score += 80;
        else if (lang === 'es-cl' || lang.includes('cl')) score += 75;
        else if (lang.startsWith('es-')) score += 50;

        // Penalizar acento ibérico / España para favorecer neutro latino
        if (lang === 'es-es' || name.includes('spain') || name.includes('españa')) {
          score -= 40;
        }

        // Bonus por nombres femeninos conocidos
        const nombresFemeninos = [
          'paulina', 'mia', 'sabina', 'dalia', 'sofia', 'camila', 'paloma', 
          'victoria', 'ximena', 'valeria', 'lupe', 'monica', 'female', 'mujer', 
          'lucia', 'conchita', 'elvira', 'carmen', 'rosa', 'samantha', 'karen'
        ];
        if (nombresFemeninos.some(fem => name.includes(fem))) {
          score += 60;
        }

        // Bonus por motores de alta calidad (Google o Microsoft en español latino)
        if (name.includes('google') || name.includes('natural') || name.includes('online')) {
          score += 20;
        }

        return score;
      };

      // Ordenar las voces de mayor a menor puntuación (las mejores latinas neutras primero)
      const vocesOrdenadas = [...vocesEs].sort((a, b) => puntuarVoz(b) - puntuarVoz(a));
      setVocesEspanol(vocesOrdenadas);

      // Seleccionar la mejor voz latina neutra
      if (vocesOrdenadas.length > 0) {
        setVozSeleccionadaURI(vocesOrdenadas[0].voiceURI);
      }
    };

    actualizarVoces();
    window.speechSynthesis.onvoiceschanged = actualizarVoces;

    return () => {
      detenerVoz();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const detenerVoz = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if ((window as any).__commercialUtterance) {
      delete (window as any).__commercialUtterance;
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  // ── Reproducción continua conducida por la voz (Speech-Driven Progression) ──
  const reproducirEscenaConVoz = (indice: number) => {
    detenerVoz();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    setEscenaActual(indice);
    setProgresoEscena(0);

    const escenaActualData = escenas[indice];
    if (!escenaActualData) return;

    if (!vozHabilitada || !synthRef.current) {
      // Si la voz está silenciada, avanzar por temporizador visual continuo
      const duracionMs = 8000;
      let transcurrido = 0;
      progressTimerRef.current = setInterval(() => {
        transcurrido += 100;
        const p = Math.min(100, (transcurrido / duracionMs) * 100);
        setProgresoEscena(p);
        if (transcurrido >= duracionMs) {
          clearInterval(progressTimerRef.current);
          if (indice < escenas.length - 1) {
            reproducirEscenaConVoz(indice + 1);
          } else {
            setReproduciendo(false);
          }
        }
      }, 100);
      return;
    }

    // Preparar el enunciado de voz
    const utterance = new SpeechSynthesisUtterance(escenaActualData.textoLocucion);
    (window as any).__commercialUtterance = utterance; // Evitar que el garbage collector de Chrome corte el audio

    // Asignar voz seleccionada
    const voces = synthRef.current.getVoices();
    const voz = voces.find(v => v.voiceURI === vozSeleccionadaURI) ||
                voces.find(v => (v.lang.includes('419') || v.lang.includes('MX') || v.lang.includes('US') || v.lang.includes('CL')) && v.name.toLowerCase().includes('female')) ||
                voces.find(v => v.lang.startsWith('es'));

    if (voz) {
      utterance.voice = voz;
    }
    // Asignar estándar latinoamericano
    utterance.lang = voz?.lang || 'es-419';
    // Tono femenino natural, cálido y fluido para locución comercial
    utterance.pitch = 1.08; 
    utterance.rate = 0.98; // Cadencia suave y neutra para máxima inteligibilidad

    // Estimación de tiempo para la barra de progreso
    const duracionEstimadaMs = Math.max(5000, (escenaActualData.textoLocucion.length / 13.5) * 1000);
    const inicioTimestamp = Date.now();

    progressTimerRef.current = setInterval(() => {
      const transcurrido = Date.now() - inicioTimestamp;
      const pct = Math.min(95, (transcurrido / duracionEstimadaMs) * 100);
      setProgresoEscena(pct);
    }, 100);

    // Keepalive de Chrome para evitar que corte audios largos
    keepAliveRef.current = setInterval(() => {
      if (synthRef.current?.speaking) {
        synthRef.current.pause();
        synthRef.current.resume();
      }
    }, 10000);

    // Evento clave: cuando la locutora TERMINA la frase, avanzamos suavemente a la siguiente escena
    utterance.onend = () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      setProgresoEscena(100);

      // Si aún estamos en modo reproducción continua
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (!isPlayingRef.current) return;
          if (indice < escenas.length - 1) {
            reproducirEscenaConVoz(indice + 1);
          } else {
            // Fin del comercial
            setReproduciendo(false);
          }
        }, 750); // Pausa cinematográfica de 0.75s entre escenas
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis notice:', e.error);
        if (indice < escenas.length - 1 && isPlayingRef.current) {
          setTimeout(() => reproducirEscenaConVoz(indice + 1), 1000);
        }
      }
    };

    synthRef.current.speak(utterance);
  };

  const iniciarReproduccion = () => {
    setReproduciendo(true);
    isPlayingRef.current = true;
    if (escenaActual >= escenas.length - 1 && progresoEscena >= 100) {
      reproducirEscenaConVoz(0);
    } else {
      reproducirEscenaConVoz(escenaActual);
    }
  };

  const pausarReproduccion = () => {
    setReproduciendo(false);
    isPlayingRef.current = false;
    detenerVoz();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const reiniciarComercial = () => {
    setReproduciendo(true);
    isPlayingRef.current = true;
    reproducirEscenaConVoz(0);
  };

  const cambiarEscena = (indice: number) => {
    detenerVoz();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setEscenaActual(indice);
    setProgresoEscena(0);
    if (reproduciendo) {
      reproducirEscenaConVoz(indice);
    }
  };

  const toggleVoz = () => {
    const nuevoEstado = !vozHabilitada;
    setVozHabilitada(nuevoEstado);
    if (!nuevoEstado) {
      detenerVoz();
    } else if (reproduciendo) {
      reproducirEscenaConVoz(escenaActual);
    }
  };

  // Si se cierra el modal, limpiar todo de inmediato
  useEffect(() => {
    if (!isOpen) {
      detenerVoz();
      setReproduciendo(false);
      isPlayingRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }, [isOpen]);

  const copiarGuion = () => {
    const guionCompleto = `🎙️ GUIÓN PUBLICITARIO - LOCUCIÓN EN VOZ LATINA NEUTRA
SISTEMA DE OPERACIONES Y COTIZACIONES - ${empresa.nombre.toUpperCase()}
Duración: 45 segundos | Tono: Cercano, profesional y persuasivo (Latino Neutro)

[ESCENA 1 - 0:00 a 0:08 - PROBLEMA]
Locutora: "¿Sabías que un centro de eventos pierde hasta un veinte por ciento de sus utilidades por cotizar tarde o sin calcular los costos reales de cada ingrediente? Administrar un banquete no debería ser un dolor de cabeza entre planillas y dudas."

[ESCENA 2 - 0:08 a 0:16 - SOLUCIÓN]
Locutora: "Te presentamos el Sistema Integral de Operaciones y Cotizaciones, personalizado a la medida de ${empresa.nombre}. La plataforma moderna que calcula menús, garzones y utilidades en tiempo real sin enredos técnicos."

[ESCENA 3 - 0:16 a 0:25 - COSTEO DE RECETAS Y MARGEN 33%]
Locutora: "Con la calculadora de recetas y costeo de platos, controlas el costo exacto de cada gramo de carne, verduras y mermas. El sistema aplica automáticamente la regla de oro del treinta y tres por ciento gastronómico para blindar tu ganancia."

[ESCENA 4 - 0:25 a 0:34 - OPERACIONES Y MESAS]
Locutora: "No más sorpresas el día del evento. El sistema calcula automáticamente la cantidad recomendada de garzones, cocineros y personal de aseo. Además, te avisa en rojo al instante si faltan mesas para tus invitados."

[ESCENA 5 - 0:34 a 0:42 - FICHAS Y PROPUESTAS]
Locutora: "Sorprende a novios y empresas con propuestas comerciales de primer nivel. Genera la ficha formal con el membrete oficial de tu centro de eventos, lista para imprimir o compartir por WhatsApp en formato PDF."

[ESCENA 6 - 0:42 a 0:48 - LLAMADO A LA ACCIÓN]
Locutora: "Haz crecer tu centro de eventos con tecnología confiable de Google. Cotiza más rápido, asegura tus ganancias y lidera el mercado. ¡Escríbenos al WhatsApp más cincuenta y seis nueve, treinta y uno, dieciocho, trece, cero cuatro, y pide tu acceso hoy mismo!"

---
📍 ${empresa.nombre} - ${empresa.recintoPrincipal}, ${empresa.ciudad}
📱 WhatsApp Comercial / Asesoría: +56 9 3118 1304`;

    navigator.clipboard.writeText(guionCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (!isOpen) return null;

  const escena = escenas[escenaActual];
  const IconoEscena = escena.icono;

  // Identificar si la voz activa es femenina / latina
  const vozActualObj = vocesEspanol.find(v => v.voiceURI === vozSeleccionadaURI);

  const getEtiquetaVoz = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase();
    let pais = 'Latina Neutra';
    if (lang.includes('mx')) pais = 'México (Neutra)';
    else if (lang.includes('cl')) pais = 'Chile';
    else if (lang.includes('co')) pais = 'Colombia';
    else if (lang.includes('us')) pais = 'EE.UU. Latina';
    else if (lang.includes('419')) pais = 'Latinoamérica';
    else if (lang.includes('es')) pais = 'España';

    return `${v.name.replace(/Google|Microsoft/gi, '').trim()} · ${pais}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Barra Superior con Configuración de Voz Latina Neutra */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              🎬
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Comercial con Voz Latina Neutra</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  <Mic className="w-2.5 h-2.5" /> Voz Latina Activa
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                {empresa.nombre} · Presentación audiovisual continua y costeo en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Selector de Voz Latina Neutra */}
            {vocesEspanol.length > 1 && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Voz:</span>
                <select
                  value={vozSeleccionadaURI}
                  onChange={(e) => {
                    setVozSeleccionadaURI(e.target.value);
                    if (reproduciendo) {
                      reproducirEscenaConVoz(escenaActual);
                    }
                  }}
                  className="bg-transparent text-white font-medium focus:outline-hidden text-xs max-w-[170px] truncate cursor-pointer"
                >
                  {vocesEspanol.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white">
                      {getEtiquetaVoz(v)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Pestaña: Video vs Guión */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPestañaActiva('video')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  pestañaActiva === 'video' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Comercial
              </button>
              <button
                type="button"
                onClick={() => setPestañaActiva('guion')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  pestañaActiva === 'guion' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Guión
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: REPRODUCTOR COMERCIAL */}
        {pestañaActiva === 'video' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Pantalla Principal del Comercial (Cinemática) */}
            <div className={`relative flex-1 bg-gradient-to-br ${escena.colorFondo} p-6 sm:p-10 text-white flex flex-col justify-between overflow-hidden transition-all duration-700 min-h-[360px]`}>
              
              {/* Efectos de luz ambiental decorativos */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Cabecera de la Escena */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider uppercase border border-white/15 text-amber-300">
                  <IconoEscena className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {escena.tagline} · {escenaActual + 1} de {escenas.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVoz}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md transition-colors ${
                      vozHabilitada 
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                    }`}
                    title={vozHabilitada ? "Silenciar voz en off" : "Activar voz en off"}
                  >
                    {vozHabilitada ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                    <span>{vozHabilitada ? "Voz Latina On" : "Voz Mute"}</span>
                  </button>
                </div>
              </div>

              {/* Centro de la Escena: Título, Subtítulo y Tarjetas de Impacto */}
              <div className="relative z-10 my-4 space-y-4 max-w-2xl">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                    {escena.titulo}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 font-medium mt-1.5">
                    {escena.subtitulo}
                  </p>
                </div>

                {/* Tarjetas KPI de Alto Impacto */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                  {escena.kpis.map((kpi, idx) => (
                    <div 
                      key={idx}
                      className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 text-center shadow-lg"
                    >
                      <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                        {kpi.valor}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-200 font-medium leading-tight mt-0.5">
                        {kpi.etiqueta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Puntos clave */}
                <div className="hidden sm:flex flex-col gap-1.5 pt-1">
                  {escena.puntosClave.map((punto, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{punto}</span>
                    </div>
                  ))}
                </div>

                {/* Botón directo de WhatsApp en Escena Final */}
                {escena.id === 6 && (
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/56931181304?text=${encodeURIComponent(`Hola! Vi el comercial y quiero pedir una demostración del Sistema para Centros de Eventos (${empresa.nombre}). Demo en vivo: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-transform"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Pedir Demo por WhatsApp (+56 9 3118 1304)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Subtítulos Dinámicos con onda de voz animada */}
              <div className="relative z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
                <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className={`w-1 h-2 bg-amber-400 rounded-full ${reproduciendo ? 'animate-bounce' : ''}`} style={{ animationDelay: '0ms' }} />
                    <span className={`w-1 h-3.5 bg-amber-400 rounded-full ${reproduciendo ? 'animate-bounce' : ''}`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-1 h-2 bg-amber-400 rounded-full ${reproduciendo ? 'animate-bounce' : ''}`} style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Locución Latina Neutra:</span>
                  <span className="text-slate-300 font-normal">({vozActualObj ? getEtiquetaVoz(vozActualObj) : 'Voz Latina'})</span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed italic">
                  "{escena.textoLocucion}"
                </p>
              </div>

            </div>

            {/* Barra de Progreso de la Escena Actual */}
            <div className="h-1.5 bg-slate-800 w-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-100 ease-linear"
                style={{ width: `${progresoEscena}%` }}
              />
            </div>

            {/* Controles de Reproducción y Navegación */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              
              {/* Botones de Escena (Miniaturas / Pistas 1 a 6) */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {escenas.map((e, index) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => cambiarEscena(index)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      escenaActual === index 
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/50' 
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={`Ir a Escena ${index + 1}: ${e.tagline}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Controles Principales de Play / Pause */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiarEscena(Math.max(0, escenaActual - 1))}
                  disabled={escenaActual === 0}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg hover:bg-slate-800"
                  title="Escena anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {reproduciendo ? (
                  <button
                    type="button"
                    onClick={pausarReproduccion}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-lg transition-transform active:scale-95 text-xs sm:text-sm"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={iniciarReproduccion}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold rounded-xl shadow-lg transition-transform active:scale-95 text-xs sm:text-sm"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{progresoEscena > 0 && progresoEscena < 100 ? 'Continuar Voz' : 'Reproducir Comercial'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={reiniciarComercial}
                  title="Reiniciar comercial desde el inicio"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => cambiarEscena(Math.min(escenas.length - 1, escenaActual + 1))}
                  disabled={escenaActual === escenas.length - 1}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg hover:bg-slate-800"
                  title="Siguiente escena"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Botón de Acción Directa: Ir a Probar en la App */}
              <button
                type="button"
                onClick={() => {
                  detenerVoz();
                  onClose();
                  onIrAFuncion(escena.vistaDestino);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl text-xs transition-colors border border-slate-700"
              >
                <span>Probar función en vivo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>
        )}

        {/* PESTAÑA 2: GUIÓN Y COPY PARA PUBLICAR O ENVIAR */}
        {pestañaActiva === 'guion' && (
          <div className="p-6 bg-slate-900 text-slate-200 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Guión Publicitario & Textos para WhatsApp</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Locución Latina Neutra
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copia y pega este texto para enviarlo por WhatsApp o para grabar un video de 45 segundos con tu voz.
                </p>
              </div>

              <button
                type="button"
                onClick={copiarGuion}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Guión Completo</span>
                  </>
                )}
              </button>
            </div>

            {/* Estructura del Guión */}
            <div className="space-y-4">
              {escenas.map((e, idx) => (
                <div key={e.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                    <span>ESCENA {idx + 1}: {e.tagline}</span>
                    <span className="text-slate-500">Locución Latina Neutra</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">{e.titulo}</h5>
                  <div className="p-3 bg-slate-900/80 rounded-lg text-xs text-slate-300 font-mono border-l-2 border-amber-500">
                    <span className="text-amber-400 font-bold">Locutora: </span>
                    "{e.textoLocucion}"
                  </div>
                </div>
              ))}
            </div>

            {/* Mensaje de WhatsApp Directo para Mandar a la Vecina */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>Mensaje listo para WhatsApp (con tu número +56 9 3118 1304 y enlace al demo)</span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <a
                    href={`https://wa.me/56931181304?text=${encodeURIComponent(`Hola! Preparé esta propuesta para ${empresa.nombre}. Diseñé este sistema de cotizaciones y costeo en tiempo real. Puedes ver el demo funcionando en vivo aquí: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>Abrir en WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const demoUrl = typeof window !== 'undefined' ? window.location.href : '';
                      const textoWsp = `Hola! Preparé una propuesta especial para ${empresa.nombre}. Diseñé un sistema digital donde puedes cotizar bodas y eventos en 2 minutos, con costeo de recetas al 33% gastronómico, cálculo automático de garzones y fichas de venta en PDF con tu membrete. Puedes probar el demo en vivo aquí: ${demoUrl}. Mi WhatsApp es +56 9 3118 1304.`;
                      navigator.clipboard.writeText(textoWsp);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-lg text-xs text-slate-300 leading-relaxed font-sans border border-slate-800">
                "Hola! Preparé una propuesta especial para <b>{empresa.nombre}</b>. Diseñé un sistema digital donde puedes cotizar bodas y eventos en 2 minutos, con costeo de recetas al 33% gastronómico, cálculo automático de garzones y fichas de venta de lujo en PDF con tu propio membrete de Finca La Toscana en Linderos. Puedes probar el demo en vivo aquí: <span className="text-amber-400 underline font-mono">{typeof window !== 'undefined' ? window.location.href : 'enlace-demo'}</span>. ¿Tienes 5 minutos para verlo? Me puedes responder directo a este WhatsApp: <b>+56 9 3118 1304</b>."
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
