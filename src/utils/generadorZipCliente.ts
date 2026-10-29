/**
 * Generador de archivos ZIP en memoria del navegador (Client-Side)
 * No requiere servidor, no falla con errores 404 y funciona 100% offline.
 */
import JSZip from 'jszip';
import schemaSqlContent from '../../supabase/schema.sql?raw';
import seedSqlContent from '../../supabase/seed.sql?raw';
import guiaContent from '../../GUIA_RESPALDO_Y_SUPABASE.md?raw';
import { PaqueteRespaldoCompleto, generarSQLSupabase } from './respaldoDiscoDuro';

export async function descargarPaqueteCompletoZip(datos: PaqueteRespaldoCompleto, nombreEmpresa = 'Dominga_Eventos') {
  const zip = new JSZip();
  const fecha = new Date().toISOString().split('T')[0];

  // 1. Archivos SQL de Supabase
  const carpetaSupabase = zip.folder('supabase');
  if (carpetaSupabase) {
    carpetaSupabase.file('schema.sql', schemaSqlContent);
    carpetaSupabase.file('seed.sql', seedSqlContent);
  }

  // 2. Respaldo Dinámico con los datos actuales del usuario (JSON y SQL)
  const carpetaRespaldos = zip.folder('respaldo_datos');
  if (carpetaRespaldos) {
    carpetaRespaldos.file(`datos_completos_${fecha}.json`, JSON.stringify(datos, null, 2));
    carpetaRespaldos.file(`script_postgresql_con_datos_${fecha}.sql`, generarSQLSupabase(datos));
  }

  // 3. Guía de Instalación y Producción 24/7
  zip.file('GUIA_RESPALDO_Y_SUPABASE.md', guiaContent);
  zip.file(
    'LEEME_INSTRUCCIONES.txt',
    `========================================================================\n` +
    `PAQUETE DE RESPALDO Y BASE DE DATOS SUPABASE\n` +
    `Empresa: ${nombreEmpresa}\n` +
    `Fecha: ${new Date().toLocaleString('es-CL')}\n` +
    `========================================================================\n\n` +
    `CONTENIDO DE ESTE PAQUETE:\n\n` +
    `1. /supabase/schema.sql\n` +
    `   Contiene la estructura de tablas para PostgreSQL en Supabase (empresas, insumos, recetas, menus, proveedores, cotizaciones, etc.).\n\n` +
    `2. /supabase/seed.sql\n` +
    `   Contiene los datos iniciales gastronómicos chilenos en pesos CLP.\n\n` +
    `3. /respaldo_datos/datos_completos_${fecha}.json\n` +
    `   Tus recetas, costos y cotizaciones tal como las tienes configuradas en la plataforma.\n\n` +
    `4. /respaldo_datos/script_postgresql_con_datos_${fecha}.sql\n` +
    `   Sentencias SQL listas para insertar tus datos en Supabase.\n\n` +
    `5. GUIA_RESPALDO_Y_SUPABASE.md\n` +
    `   Manual completo para alojar la web en Vercel gratis con uptime 24/7 sin caídas.\n`
  );

  // Generar blob y forzar descarga
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `RESPALDO_COMPLETO_${nombreEmpresa.replace(/[^a-zA-Z0-9]/g, '_')}_${fecha}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarga directa de archivos de texto individuales en memoria (cero 404)
 */
export function descargarArchivoTextoEnMemoria(contenido: string, nombreArchivo: string, tipoMime = 'text/plain;charset=utf-8;') {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { schemaSqlContent, seedSqlContent, guiaContent };
