/**
 * Utilidades para Respaldo en Disco Duro Local (JSON / SQL) y Restauración
 * Endurecido contra: Prototype Pollution, DoS por archivos grandes,
 * corrupción de esquema e inyección SQL en exportaciones.
 */

import {
  EmpresaCliente,
  InsumoMaestro,
  RecetaFichaTecnica,
  MenuOption,
  StaffTarifas,
  ProveedorServicio,
  EstiloDecoracion,
  ReservaCalendario,
  CotizacionState
} from '../types';
import {
  sanitizarNumero,
  sanitizarObjetoJsonSeguro,
  sanitizarTexto,
  validarTamanoArchivo
} from './security';

export interface PaqueteRespaldoCompleto {
  version: string;
  fechaExportacion: string;
  autor: string;
  empresaActivaId: string;
  empresas: EmpresaCliente[];
  insumos: InsumoMaestro[];
  recetas: RecetaFichaTecnica[];
  menus: MenuOption[];
  tarifasStaff: StaffTarifas;
  proveedores: ProveedorServicio[];
  estilosDecoracion: EstiloDecoracion[];
  reservas: ReservaCalendario[];
  cotizacionActual: CotizacionState;
}

/**
 * Descarga directamente al disco duro un archivo JSON con toda la información
 */
export function descargarRespaldoJSON(datos: PaqueteRespaldoCompleto, nombreEmpresa = 'Dominga_Eventos') {
  const timestamp = new Date().toISOString().split('T')[0];
  const nombreLimpio = nombreEmpresa.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `RESPALDO_${nombreLimpio}_${timestamp}.json`;

  const jsonString = JSON.stringify(datos, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Genera un script SQL completo con DDL y DML (INSERTs) listo para ejecutar en Supabase o PostgreSQL.
 * Sanitiza strings (eliminando bytes NUL y escapando comillas) y valida estrictamente todos los valores numéricos.
 */
export function generarSQLSupabase(datos: PaqueteRespaldoCompleto): string {
  const sanitize = (val: string | null | undefined) => {
    if (val === null || val === undefined) return 'NULL';
    const limpio = String(val).replace(/\0/g, '');
    return `'${limpio.replace(/'/g, "''")}'`;
  };
  const num = (val: unknown, fallback = 0, min = 0, max = 1_000_000_000) => {
    return String(sanitizarNumero(val, min, max, fallback));
  };
  const jsonSafe = (val: unknown, fallback: unknown) => {
    try {
      const limpio = sanitizarObjetoJsonSeguro(val ?? fallback);
      return sanitize(JSON.stringify(limpio));
    } catch {
      return sanitize(JSON.stringify(fallback));
    }
  };

  const sql: string[] = [
    `-- ==============================================================================`,
    `-- RESPALDO COMPLETO DE BASE DE DATOS PARA SUPABASE / POSTGRESQL`,
    `-- Generado el: ${new Date().toLocaleString('es-CL')}`,
    `-- Versión del Sistema: ${sanitizarTexto(datos.version, 20)}`,
    `-- ==============================================================================\n`,
    `-- Limpiar tablas si existen (opcional, en orden de dependencias)`,
    `-- DROP TABLE IF EXISTS public.receta_ingredientes CASCADE;`,
    `-- DROP TABLE IF EXISTS public.recetas CASCADE;`,
    `-- DROP TABLE IF EXISTS public.insumos CASCADE;`,
    `-- DROP TABLE IF EXISTS public.menus CASCADE;`,
    `-- DROP TABLE IF EXISTS public.staff_tarifas CASCADE;`,
    `-- DROP TABLE IF EXISTS public.proveedores CASCADE;`,
    `-- DROP TABLE IF EXISTS public.estilos_decoracion CASCADE;`,
    `-- DROP TABLE IF EXISTS public.cotizaciones CASCADE;`,
    `-- DROP TABLE IF EXISTS public.reservas CASCADE;`,
    `-- DROP TABLE IF EXISTS public.empresas CASCADE;\n`
  ];

  // 1. Empresas
  sql.push(`-- 1. EMPRESAS`);
  for (const emp of datos.empresas || []) {
    sql.push(
      `INSERT INTO public.empresas (id, nombre, subtitulo, recinto_principal, direccion, ciudad, telefono, email, sitio_web) ` +
      `VALUES (${sanitize(emp.id)}, ${sanitize(emp.nombre)}, ${sanitize(emp.subtitulo)}, ${sanitize(emp.recintoPrincipal)}, ${sanitize(emp.direccion)}, ${sanitize(emp.ciudad)}, ${sanitize(emp.telefono)}, ${sanitize(emp.email)}, ${sanitize(emp.sitioWeb)}) ` +
      `ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono, email = EXCLUDED.email;`
    );
  }
  sql.push('');

  // 2. Insumos
  sql.push(`-- 2. INSUMOS MAESTROS Y MERMAS`);
  for (const ins of datos.insumos || []) {
    sql.push(
      `INSERT INTO public.insumos (id, empresa_id, nombre, categoria, unidad_medida, precio_compra, merma_porcentaje, proveedor) ` +
      `VALUES (${sanitize(ins.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(ins.nombre)}, ${sanitize(ins.categoria)}, ${sanitize(ins.unidadMedida)}, ${num(ins.precioCompra, 0)}, ${num(ins.mermaPorcentaje, 0, 0, 100)}, ${sanitize(ins.proveedor || '')}) ` +
      `ON CONFLICT (id) DO UPDATE SET precio_compra = EXCLUDED.precio_compra, merma_porcentaje = EXCLUDED.merma_porcentaje;`
    );
  }
  sql.push('');

  // 3. Recetas y sus ingredientes
  sql.push(`-- 3. RECETAS / FICHAS TÉCNICAS`);
  for (const rec of datos.recetas || []) {
    sql.push(
      `INSERT INTO public.recetas (id, empresa_id, nombre, tiempo_menu, categoria, rendimiento_porciones, margen_sugerido, costo_adicional_elaboracion, descripcion_procedimiento, menu_asociado_id) ` +
      `VALUES (${sanitize(rec.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(rec.nombre)}, ${sanitize(rec.tiempoMenu)}, ${sanitize(rec.categoria)}, ${num(rec.rendimientoPorciones, 1, 1, 10000)}, ${num(rec.margenSugerido, 33, 0, 100)}, ${num(rec.costoAdicionalElaboracion, 0)}, ${sanitize(rec.descripcionProcedimiento || '')}, ${sanitize(rec.menuAsociadoId || '')}) ` +
      `ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, margen_sugerido = EXCLUDED.margen_sugerido;`
    );

    if (Array.isArray(rec.ingredientes) && rec.ingredientes.length > 0) {
      for (const ing of rec.ingredientes) {
        const mermaEspSql =
          ing.mermaEspecifica !== undefined && ing.mermaEspecifica !== null
            ? num(ing.mermaEspecifica, 0, 0, 100)
            : 'NULL';
        sql.push(
          `INSERT INTO public.receta_ingredientes (id, receta_id, insumo_id, cantidad, unidad, merma_especifica) ` +
          `VALUES (${sanitize(ing.id)}, ${sanitize(rec.id)}, ${sanitize(ing.insumoId)}, ${num(ing.cantidad, 0)}, ${sanitize(ing.unidad)}, ${mermaEspSql}) ` +
          `ON CONFLICT (id) DO NOTHING;`
        );
      }
    }
  }
  sql.push('');

  // 4. Menús
  sql.push(`-- 4. MENÚS DE EVENTOS`);
  for (const m of datos.menus || []) {
    const recetasJson = jsonSafe(m.recetasIds, []);
    sql.push(
      `INSERT INTO public.menus (id, empresa_id, nombre, categoria, costo_persona, precio_sugerido_persona, descripcion, coctel, entrada, fondo, postre, trasnoche, destacado, recetas_ids, costo_calculado_desde_recetas) ` +
      `VALUES (${sanitize(m.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(m.nombre)}, ${sanitize(m.categoria)}, ${num(m.costoPersona, 0)}, ${num(m.precioSugeridoPersona, 0)}, ${sanitize(m.descripcion)}, ${sanitize(m.tiempos?.coctel)}, ${sanitize(m.tiempos?.entrada)}, ${sanitize(m.tiempos?.fondo)}, ${sanitize(m.tiempos?.postre)}, ${sanitize(m.tiempos?.trasnoche)}, ${m.destacado ? 'true' : 'false'}, ${recetasJson}::jsonb, ${m.costoCalculadoDesdeRecetas ? 'true' : 'false'}) ` +
      `ON CONFLICT (id) DO UPDATE SET costo_persona = EXCLUDED.costo_persona, precio_sugerido_persona = EXCLUDED.precio_sugerido_persona;`
    );
  }
  sql.push('');

  // 5. Staff Tarifas
  sql.push(`-- 5. STAFF Y PERSONAL`);
  const st = datos.tarifasStaff;
  sql.push(
    `INSERT INTO public.staff_tarifas (id, empresa_id, garzon_jornada, cocinero_jornada, aseo_jornada, maitre_jornada, ratio_garzon, ratio_cocinero, ratio_aseo) ` +
    `VALUES ('tarifa-actual', ${sanitize(datos.empresaActivaId)}, ${num(st?.garzonJornada, 45000)}, ${num(st?.cocineroJornada, 55000)}, ${num(st?.aseoJornada, 40000)}, ${num(st?.maitreJornada, 70000)}, ${num(st?.ratioGarzon, 15, 1, 500)}, ${num(st?.ratioCocinero, 35, 1, 500)}, ${num(st?.ratioAseo, 50, 1, 500)}) ` +
    `ON CONFLICT (id) DO UPDATE SET garzon_jornada = EXCLUDED.garzon_jornada, cocinero_jornada = EXCLUDED.cocinero_jornada;`
  );
  sql.push('');

  // 6. Proveedores
  sql.push(`-- 6. PROVEEDORES`);
  for (const prov of datos.proveedores || []) {
    sql.push(
      `INSERT INTO public.proveedores (id, empresa_id, nombre, categoria, tipo_cobro, costo, precio_venta_sugerido, descripcion, icon_name, obligatorio) ` +
      `VALUES (${sanitize(prov.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(prov.nombre)}, ${sanitize(prov.categoria)}, ${sanitize(prov.tipoCobro)}, ${num(prov.costo, 0)}, ${num(prov.precioVentaSugerido, 0)}, ${sanitize(prov.descripcion)}, ${sanitize(prov.iconName)}, ${prov.obligatorio ? 'true' : 'false'}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sql.push('');

  // 7. Estilos Decoración
  sql.push(`-- 7. ESTILOS DECORACIÓN`);
  for (const est of datos.estilosDecoracion || []) {
    const paletaJson = jsonSafe(est.paleta, []);
    const elemJson = jsonSafe(est.elementos, []);
    const visualJson = jsonSafe(est.estiloVisual, {});
    sql.push(
      `INSERT INTO public.estilos_decoracion (id, empresa_id, nombre, subtitulo, costo_fijo, precio_venta_sugerido, descripcion, paleta, elementos, destacado, estilo_visual) ` +
      `VALUES (${sanitize(est.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(est.nombre)}, ${sanitize(est.subtitulo)}, ${num(est.costoFijo, 0)}, ${num(est.precioVentaSugerido, 0)}, ${sanitize(est.descripcion)}, ${paletaJson}::jsonb, ${elemJson}::jsonb, ${est.destacado ? 'true' : 'false'}, ${visualJson}::jsonb) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sql.push('');

  // 8. Cotización Actual
  sql.push(`-- 8. COTIZACIÓN ACTUAL`);
  const cot = datos.cotizacionActual;
  if (cot) {
    const personalJson = jsonSafe(cot.personal, {});
    const provsJson = jsonSafe(cot.proveedoresSeleccionados, {});
    const mesasJson = jsonSafe(cot.mesas, []);
    sql.push(
      `INSERT INTO public.cotizaciones (id, empresa_id, nombre_evento, cliente, email_cliente, telefono_cliente, tipo_evento, fecha_evento, invitados, menu_id, personal, proveedores_seleccionados, mesas, decoracion_id, margen_ganancia, aplica_iva, observaciones) ` +
      `VALUES ('cot-actual', ${sanitize(datos.empresaActivaId)}, ${sanitize(cot.nombreEvento)}, ${sanitize(cot.cliente)}, ${sanitize(cot.emailCliente)}, ${sanitize(cot.telefonoCliente)}, ${sanitize(cot.tipoEvento)}, ${sanitize(cot.fechaEvento)}, ${num(cot.invitados, 100, 1, 50000)}, ${sanitize(cot.menuId)}, ${personalJson}::jsonb, ${provsJson}::jsonb, ${mesasJson}::jsonb, ${sanitize(cot.decoracionId)}, ${num(cot.margenGanancia, 35, 0, 500)}, ${cot.aplicaIva ? 'true' : 'false'}, ${sanitize(cot.observaciones)}) ` +
      `ON CONFLICT (id) DO UPDATE SET nombre_evento = EXCLUDED.nombre_evento, invitados = EXCLUDED.invitados;`
    );
    sql.push('');
  }

  // 9. Reservas Calendario
  sql.push(`-- 9. RESERVAS CALENDARIO`);
  for (const res of datos.reservas || []) {
    sql.push(
      `INSERT INTO public.reservas (id, empresa_id, fecha, cliente, evento, tipo_evento, invitados, estado, total) ` +
      `VALUES (${sanitize(res.id)}, ${sanitize(res.empresaId || datos.empresaActivaId)}, ${sanitize(res.fecha)}, ${sanitize(res.cliente)}, ${sanitize(res.titulo)}, ${sanitize(res.tipoEvento)}, ${num(res.invitados, 100, 1, 50000)}, ${sanitize(res.estado)}, ${num(res.montoTotal, 0)}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }

  return sql.join('\n');
}

/**
 * Descarga directamente al disco duro el script SQL para Supabase / PostgreSQL
 */
export function descargarRespaldoSQL(datos: PaqueteRespaldoCompleto, nombreEmpresa = 'Dominga_Eventos') {
  const timestamp = new Date().toISOString().split('T')[0];
  const nombreLimpio = nombreEmpresa.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `SUPABASE_DATABASE_${nombreLimpio}_${timestamp}.sql`;

  const sqlContent = generarSQLSupabase(datos);
  const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Lee y valida de forma segura un archivo .json subido por el usuario para restaurar la aplicación.
 * Protege contra DoS de archivos gigantes y Prototype Pollution (__proto__, constructor, prototype).
 */
export function leerArchivoRespaldoJSON(file: File): Promise<PaqueteRespaldoCompleto> {
  return new Promise((resolve, reject) => {
    const checkSize = validarTamanoArchivo(file, 5);
    if (!checkSize.ok) {
      reject(new Error(checkSize.error));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('El contenido del archivo no es texto válido.');
        }

        const rawParsed = JSON.parse(text);
        const parsed = sanitizarObjetoJsonSeguro(rawParsed) as Partial<PaqueteRespaldoCompleto>;

        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !Array.isArray(parsed.insumos) ||
          !Array.isArray(parsed.recetas) ||
          !Array.isArray(parsed.menus)
        ) {
          throw new Error(
            'El archivo no parece ser un respaldo válido de SOLVI Flow (se requieren listas válidas de insumos, recetas y menús).'
          );
        }

        // Normalizar límites de seguridad en arreglos críticos
        const paqueteSeguro: PaqueteRespaldoCompleto = {
          version: sanitizarTexto(parsed.version || '1.2.0', 20),
          fechaExportacion: sanitizarTexto(parsed.fechaExportacion || new Date().toISOString(), 40),
          autor: sanitizarTexto(parsed.autor || 'SOLVI Flow', 100),
          empresaActivaId: sanitizarTexto(parsed.empresaActivaId || 'emp-dominga', 64),
          empresas: Array.isArray(parsed.empresas) ? parsed.empresas.slice(0, 100) : [],
          insumos: parsed.insumos.slice(0, 2000).map((ins) => ({
            ...ins,
            id: sanitizarTexto(ins.id, 64),
            nombre: sanitizarTexto(ins.nombre, 180),
            categoria: sanitizarTexto(ins.categoria, 80),
            precioCompra: sanitizarNumero(ins.precioCompra, 0, 50_000_000, 0),
            mermaPorcentaje: sanitizarNumero(ins.mermaPorcentaje, 0, 99, 0)
          })),
          recetas: parsed.recetas.slice(0, 1000).map((rec) => ({
            ...rec,
            id: sanitizarTexto(rec.id, 64),
            nombre: sanitizarTexto(rec.nombre, 200),
            rendimientoPorciones: sanitizarNumero(rec.rendimientoPorciones, 1, 10000, 1),
            margenSugerido: sanitizarNumero(rec.margenSugerido, 1, 95, 33),
            costoAdicionalElaboracion: sanitizarNumero(rec.costoAdicionalElaboracion, 0, 50_000_000, 0)
          })),
          menus: parsed.menus.slice(0, 500),
          tarifasStaff: parsed.tarifasStaff as StaffTarifas,
          proveedores: Array.isArray(parsed.proveedores) ? parsed.proveedores.slice(0, 500) : [],
          estilosDecoracion: Array.isArray(parsed.estilosDecoracion) ? parsed.estilosDecoracion.slice(0, 200) : [],
          reservas: Array.isArray(parsed.reservas) ? parsed.reservas.slice(0, 2000) : [],
          cotizacionActual: parsed.cotizacionActual as CotizacionState
        };

        resolve(paqueteSeguro);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}
