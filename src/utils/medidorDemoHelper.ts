/**
 * Utilidades y persistencia para el Medidor de Uso del Demo
 * Permite al Administrador saber con precisión si un cliente o prospecto
 * está ocupando el demo comercial, qué módulos visita, cuántas cotizaciones simula,
 * cuántos PDFs genera y cuándo fue su última interacción.
 */

export interface EventoActividadDemo {
  id: string;
  tipo: 'visita' | 'cotizacion' | 'invitados' | 'menu' | 'pdf' | 'whatsapp' | 'recetas' | 'proveedores' | 'calendario';
  detalle: string;
  centroId: string;
  centroNombre: string;
  timestamp: number;
}

export interface MetricasCentroDemo {
  centroId: string;
  centroNombre: string;
  totalAcciones: number;
  cotizacionesCalculadas: number;
  fichasPdfVistas: number;
  propuestasWhatsApp: number;
  recetasConsultadas: number;
  ultimaActividad: number | null;
  minutosUsoEstimados: number;
}

export interface RegistroMetricasDemo {
  primeraVisita: number;
  ultimaActividad: number;
  totalInteracciones: number;
  sesionesIniciadas: number;
  tiempoTotalMinutos: number;
  porCentro: Record<string, MetricasCentroDemo>;
  historialEventos: EventoActividadDemo[];
}

const STORAGE_KEY = 'solvi_demo_telemetria_v1';
const ULTIMO_EVENTO_TIMESTAMP_KEY = 'solvi_demo_last_event_ts';

export const METRICAS_VACIAS: RegistroMetricasDemo = {
  primeraVisita: Date.now(),
  ultimaActividad: Date.now(),
  totalInteracciones: 0,
  sesionesIniciadas: 1,
  tiempoTotalMinutos: 1,
  porCentro: {
    'damaris-eventos': {
      centroId: 'damaris-eventos',
      centroNombre: 'Centro de Eventos Damaris',
      totalAcciones: 0,
      cotizacionesCalculadas: 0,
      fichasPdfVistas: 0,
      propuestasWhatsApp: 0,
      recetasConsultadas: 0,
      ultimaActividad: null,
      minutosUsoEstimados: 0
    },
    'dominga-eventos': {
      centroId: 'dominga-eventos',
      centroNombre: 'Dominga Eventos by Mauge',
      totalAcciones: 0,
      cotizacionesCalculadas: 0,
      fichasPdfVistas: 0,
      propuestasWhatsApp: 0,
      recetasConsultadas: 0,
      ultimaActividad: null,
      minutosUsoEstimados: 0
    },
    'modelo-base': {
      centroId: 'modelo-base',
      centroNombre: 'Doña Isidora (Demo General)',
      totalAcciones: 0,
      cotizacionesCalculadas: 0,
      fichasPdfVistas: 0,
      propuestasWhatsApp: 0,
      recetasConsultadas: 0,
      ultimaActividad: null,
      minutosUsoEstimados: 0
    }
  },
  historialEventos: []
};

/**
 * Obtiene las métricas actuales del demo desde localStorage
 */
export function obtenerMetricasDemo(): RegistroMetricasDemo {
  if (typeof window === 'undefined') return METRICAS_VACIAS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const inicial = { ...METRICAS_VACIAS, primeraVisita: Date.now(), ultimaActividad: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
      return inicial;
    }
    const parsed: RegistroMetricasDemo = JSON.parse(raw);
    
    // Garantizar que todos los centros existan
    if (!parsed.porCentro) parsed.porCentro = {};
    for (const [key, val] of Object.entries(METRICAS_VACIAS.porCentro)) {
      if (!parsed.porCentro[key]) {
        parsed.porCentro[key] = { ...val };
      }
    }
    if (!Array.isArray(parsed.historialEventos)) {
      parsed.historialEventos = [];
    }
    return parsed;
  } catch (e) {
    console.error('Error leyendo métricas del demo:', e);
    return METRICAS_VACIAS;
  }
}

/**
 * Registra una acción o evento de uso en el demo
 */
export function registrarActividadDemo(
  tipo: EventoActividadDemo['tipo'],
  detalle: string,
  centroId: string,
  centroNombre: string
): RegistroMetricasDemo {
  if (typeof window === 'undefined') return METRICAS_VACIAS;

  try {
    // Evitar ráfagas duplicadas (debounce de 400ms para el mismo tipo)
    const ahora = Date.now();
    const ultimoTs = Number(sessionStorage.getItem(`${ULTIMO_EVENTO_TIMESTAMP_KEY}_${tipo}`) || '0');
    if (ahora - ultimoTs < 400 && tipo !== 'pdf' && tipo !== 'whatsapp') {
      return obtenerMetricasDemo();
    }
    sessionStorage.setItem(`${ULTIMO_EVENTO_TIMESTAMP_KEY}_${tipo}`, String(ahora));

    const datos = obtenerMetricasDemo();
    datos.ultimaActividad = ahora;
    datos.totalInteracciones += 1;

    // Actualizar datos del centro
    if (!datos.porCentro[centroId]) {
      datos.porCentro[centroId] = {
        centroId,
        centroNombre,
        totalAcciones: 0,
        cotizacionesCalculadas: 0,
        fichasPdfVistas: 0,
        propuestasWhatsApp: 0,
        recetasConsultadas: 0,
        ultimaActividad: null,
        minutosUsoEstimados: 0
      };
    }

    const centro = datos.porCentro[centroId];
    centro.totalAcciones += 1;
    centro.ultimaActividad = ahora;

    if (tipo === 'cotizacion' || tipo === 'invitados' || tipo === 'menu') {
      centro.cotizacionesCalculadas += 1;
    } else if (tipo === 'pdf') {
      centro.fichasPdfVistas += 1;
    } else if (tipo === 'whatsapp') {
      centro.propuestasWhatsApp += 1;
    } else if (tipo === 'recetas') {
      centro.recetasConsultadas += 1;
    }

    // Agregar al historial de eventos (guardar los últimos 60)
    const nuevoEvento: EventoActividadDemo = {
      id: `ev-${ahora}-${Math.random().toString(36).slice(2, 6)}`,
      tipo,
      detalle,
      centroId,
      centroNombre,
      timestamp: ahora
    };

    datos.historialEventos = [nuevoEvento, ...datos.historialEventos.slice(0, 59)];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    return datos;
  } catch (e) {
    console.error('Error registrando actividad demo:', e);
    return METRICAS_VACIAS;
  }
}

/**
 * Registra una sesión de apertura del demo
 */
export function registrarSesionDemo(centroId: string, centroNombre: string) {
  if (typeof window === 'undefined') return;

  try {
    const yaRegistradoEnSesion = sessionStorage.getItem('solvi_sesion_registrada');
    if (!yaRegistradoEnSesion) {
      sessionStorage.setItem('solvi_sesion_registrada', 'true');
      const datos = obtenerMetricasDemo();
      datos.sesionesIniciadas = (datos.sesionesIniciadas || 0) + 1;
      datos.ultimaActividad = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
      registrarActividadDemo('visita', `Apertura del demo para ${centroNombre}`, centroId, centroNombre);
    }
  } catch (e) {}
}

/**
 * Acumula tiempo activo en el demo (llamado por heartbeat cada 60 seg)
 */
export function acumularTiempoActivoDemo(centroId: string, minutos: number = 1) {
  if (typeof window === 'undefined') return;

  try {
    const datos = obtenerMetricasDemo();
    datos.tiempoTotalMinutos = (datos.tiempoTotalMinutos || 0) + minutos;
    if (datos.porCentro[centroId]) {
      datos.porCentro[centroId].minutosUsoEstimados = (datos.porCentro[centroId].minutosUsoEstimados || 0) + minutos;
    }
    datos.ultimaActividad = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch (e) {}
}

export interface EvaluacionNivelUso {
  porcentaje: number;
  nivelTexto: string;
  color: 'slate' | 'blue' | 'emerald' | 'amber' | 'purple';
  estaActivoAhora: boolean;
  estadoTexto: string;
  resumenFrase: string;
}

/**
 * Calcula el nivel de uso del medidor (0% - 100%) y su diagnóstico
 */
export function calcularNivelUso(metricas: RegistroMetricasDemo): EvaluacionNivelUso {
  const ahora = Date.now();
  const tiempoDesdeUltima = ahora - (metricas.ultimaActividad || 0);

  // Considerado "Activo ahora" si la última acción fue hace menos de 10 minutos
  const estaActivoAhora = tiempoDesdeUltima < 10 * 60 * 1000;
  // Considerado "Reciente" si fue en las últimas 24 horas
  const esRecienteHoy = tiempoDesdeUltima < 24 * 60 * 60 * 1000;

  // Ponderación de puntuación de uso
  // Cotizaciones valen 3 pts, PDFs 10 pts, WhatsApp 10 pts, Recetas 2 pts, Sesiones 5 pts
  let puntosTotales = 0;
  let totalPdf = 0;
  let totalWsp = 0;
  let totalCot = 0;

  Object.values(metricas.porCentro || {}).forEach(c => {
    puntosTotales += (c.cotizacionesCalculadas * 3) + (c.fichasPdfVistas * 10) + (c.propuestasWhatsApp * 10) + (c.recetasConsultadas * 2);
    totalPdf += c.fichasPdfVistas;
    totalWsp += c.propuestasWhatsApp;
    totalCot += c.cotizacionesCalculadas;
  });

  puntosTotales += (metricas.sesionesIniciadas || 1) * 5;
  puntosTotales += Math.min(30, Math.floor((metricas.tiempoTotalMinutos || 0) / 2));

  // Escala de 0 a 100% (100 puntos = 100% de uso pleno del demo)
  const porcentaje = Math.min(100, Math.max(metricas.totalInteracciones > 0 ? 12 : 0, Math.round(puntosTotales)));

  let nivelTexto = 'Sin uso registrado';
  let color: EvaluacionNivelUso['color'] = 'slate';
  let resumenFrase = 'El demo aún no tiene interacciones registradas.';

  if (porcentaje >= 80) {
    nivelTexto = 'Uso Muy Intenso / Pleno';
    color = 'emerald';
    resumenFrase = `¡Alta actividad! Se han generado ${totalCot} cotizaciones, ${totalPdf} PDFs y ${totalWsp} propuestas por WhatsApp.`;
  } else if (porcentaje >= 50) {
    nivelTexto = 'Uso Activo / Comercial';
    color = 'blue';
    resumenFrase = `El cliente está probando activamente cotizaciones (${totalCot}) y explorando costos.`;
  } else if (porcentaje >= 20) {
    nivelTexto = 'Uso Moderado / Inicial';
    color = 'amber';
    resumenFrase = 'El demo ha sido abierto y se han simulado algunos valores básicos.';
  } else if (porcentaje > 0) {
    nivelTexto = 'Primeros Clics / Explorando';
    color = 'purple';
    resumenFrase = 'El usuario acaba de ingresar y está familiarizándose con la interfaz.';
  }

  let estadoTexto = 'Inactivo';
  if (estaActivoAhora) {
    estadoTexto = '🟢 En Uso Activo Ahora Mismo';
  } else if (esRecienteHoy) {
    estadoTexto = '🟡 Usado hoy (hace unas horas)';
  } else if (tiempoDesdeUltima < 48 * 60 * 60 * 1000) {
    estadoTexto = '⚪ Usado ayer';
  } else {
    estadoTexto = '⚪ Sin actividad en los últimos días';
  }

  return {
    porcentaje,
    nivelTexto,
    color,
    estaActivoAhora,
    estadoTexto,
    resumenFrase
  };
}

/**
 * Reinicia las métricas a cero (por si el administrador entrega el demo a un nuevo cliente)
 */
export function reiniciarMetricasDemo(): RegistroMetricasDemo {
  if (typeof window === 'undefined') return METRICAS_VACIAS;
  const nuevo = {
    ...METRICAS_VACIAS,
    primeraVisita: Date.now(),
    ultimaActividad: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
  } catch (e) {}
  return nuevo;
}

/**
 * Formatea una fecha / hora relativa en español
 */
export function formatearTiempoRelativo(timestamp: number | null): string {
  if (!timestamp) return 'Nunca';
  const diffSegundos = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSegundos < 30) return 'Hace unos segundos';
  if (diffSegundos < 60) return `Hace ${diffSegundos} seg`;
  const minutos = Math.floor(diffSegundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;

  const d = new Date(timestamp);
  return `${d.toLocaleDateString('es-CL')} ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
}
