/**
 * Utilidades para Respaldo en Disco Duro Local (JSON / SQL) y Restauración
 * Permite al usuario tener 100% de propiedad sobre sus datos gastronómicos y cotizaciones.
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
  URL.revokeObjectURL(url);
}

/**
 * Genera un script SQL completo con DDL y DML (INSERTs) listo para ejecutar en Supabase o PostgreSQL
 */
export function generarSQLSupabase(datos: PaqueteRespaldoCompleto): string {
  const sanitize = (val: string | null | undefined) => {
    if (val === null || val === undefined) return 'NULL';
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const sql: string[] = [
    `-- ==============================================================================`,
    `-- RESPALDO COMPLETO DE BASE DE DATOS PARA SUPABASE / POSTGRESQL`,
    `-- Generado el: ${new Date().toLocaleString('es-CL')}`,
    `-- Versión del Sistema: ${datos.version}`,
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
  for (const emp of datos.empresas) {
    sql.push(
      `INSERT INTO public.empresas (id, nombre, subtitulo, recinto_principal, direccion, ciudad, telefono, email, sitio_web) ` +
      `VALUES (${sanitize(emp.id)}, ${sanitize(emp.nombre)}, ${sanitize(emp.subtitulo)}, ${sanitize(emp.recintoPrincipal)}, ${sanitize(emp.direccion)}, ${sanitize(emp.ciudad)}, ${sanitize(emp.telefono)}, ${sanitize(emp.email)}, ${sanitize(emp.sitioWeb)}) ` +
      `ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono, email = EXCLUDED.email;`
    );
  }
  sql.push('');

  // 2. Insumos
  sql.push(`-- 2. INSUMOS MAESTROS Y MERMAS`);
  for (const ins of datos.insumos) {
    sql.push(
      `INSERT INTO public.insumos (id, empresa_id, nombre, categoria, unidad_medida, precio_compra, merma_porcentaje, proveedor) ` +
      `VALUES (${sanitize(ins.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(ins.nombre)}, ${sanitize(ins.categoria)}, ${sanitize(ins.unidadMedida)}, ${ins.precioCompra || 0}, ${ins.mermaPorcentaje || 0}, ${sanitize(ins.proveedor || '')}) ` +
      `ON CONFLICT (id) DO UPDATE SET precio_compra = EXCLUDED.precio_compra, merma_porcentaje = EXCLUDED.merma_porcentaje;`
    );
  }
  sql.push('');

  // 3. Recetas y sus ingredientes
  sql.push(`-- 3. RECETAS / FICHAS TÉCNICAS`);
  for (const rec of datos.recetas) {
    sql.push(
      `INSERT INTO public.recetas (id, empresa_id, nombre, tiempo_menu, categoria, rendimiento_porciones, margen_sugerido, costo_adicional_elaboracion, descripcion_procedimiento, menu_asociado_id) ` +
      `VALUES (${sanitize(rec.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(rec.nombre)}, ${sanitize(rec.tiempoMenu)}, ${sanitize(rec.categoria)}, ${rec.rendimientoPorciones || 1}, ${rec.margenSugerido || 33}, ${rec.costoAdicionalElaboracion || 0}, ${sanitize(rec.descripcionProcedimiento || '')}, ${sanitize(rec.menuAsociadoId || '')}) ` +
      `ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, margen_sugerido = EXCLUDED.margen_sugerido;`
    );

    // Ingredientes de la receta
    if (rec.ingredientes && rec.ingredientes.length > 0) {
      for (const ing of rec.ingredientes) {
        sql.push(
          `INSERT INTO public.receta_ingredientes (id, receta_id, insumo_id, cantidad, unidad, merma_especifica) ` +
          `VALUES (${sanitize(ing.id)}, ${sanitize(rec.id)}, ${sanitize(ing.insumoId)}, ${ing.cantidad || 0}, ${sanitize(ing.unidad)}, ${ing.mermaEspecifica ?? 'NULL'}) ` +
          `ON CONFLICT (id) DO NOTHING;`
        );
      }
    }
  }
  sql.push('');

  // 4. Menús
  sql.push(`-- 4. MENÚS DE EVENTOS`);
  for (const m of datos.menus) {
    const recetasJson = sanitize(JSON.stringify(m.recetasIds || []));
    sql.push(
      `INSERT INTO public.menus (id, empresa_id, nombre, categoria, costo_persona, precio_sugerido_persona, descripcion, coctel, entrada, fondo, postre, trasnoche, destacado, recetas_ids, costo_calculado_desde_recetas) ` +
      `VALUES (${sanitize(m.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(m.nombre)}, ${sanitize(m.categoria)}, ${m.costoPersona || 0}, ${m.precioSugeridoPersona || 0}, ${sanitize(m.descripcion)}, ${sanitize(m.tiempos?.coctel)}, ${sanitize(m.tiempos?.entrada)}, ${sanitize(m.tiempos?.fondo)}, ${sanitize(m.tiempos?.postre)}, ${sanitize(m.tiempos?.trasnoche)}, ${m.destacado ? 'true' : 'false'}, ${recetasJson}::jsonb, ${m.costoCalculadoDesdeRecetas ? 'true' : 'false'}) ` +
      `ON CONFLICT (id) DO UPDATE SET costo_persona = EXCLUDED.costo_persona, precio_sugerido_persona = EXCLUDED.precio_sugerido_persona;`
    );
  }
  sql.push('');

  // 5. Staff Tarifas
  sql.push(`-- 5. STAFF Y PERSONAL`);
  sql.push(
    `INSERT INTO public.staff_tarifas (id, empresa_id, garzon_jornada, cocinero_jornada, aseo_jornada, maitre_jornada, ratio_garzon, ratio_cocinero, ratio_aseo) ` +
    `VALUES ('tarifa-actual', ${sanitize(datos.empresaActivaId)}, ${datos.tarifasStaff.garzonJornada}, ${datos.tarifasStaff.cocineroJornada}, ${datos.tarifasStaff.aseoJornada}, ${datos.tarifasStaff.maitreJornada}, ${datos.tarifasStaff.ratioGarzon}, ${datos.tarifasStaff.ratioCocinero}, ${datos.tarifasStaff.ratioAseo}) ` +
    `ON CONFLICT (id) DO UPDATE SET garzon_jornada = EXCLUDED.garzon_jornada, cocinero_jornada = EXCLUDED.cocinero_jornada;`
  );
  sql.push('');

  // 6. Proveedores
  sql.push(`-- 6. PROVEEDORES`);
  for (const prov of datos.proveedores) {
    sql.push(
      `INSERT INTO public.proveedores (id, empresa_id, nombre, categoria, tipo_cobro, costo, precio_venta_sugerido, descripcion, icon_name, obligatorio) ` +
      `VALUES (${sanitize(prov.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(prov.nombre)}, ${sanitize(prov.categoria)}, ${sanitize(prov.tipoCobro)}, ${prov.costo}, ${prov.precioVentaSugerido}, ${sanitize(prov.descripcion)}, ${sanitize(prov.iconName)}, ${prov.obligatorio ? 'true' : 'false'}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sql.push('');

  // 7. Estilos Decoración
  sql.push(`-- 7. ESTILOS DECORACIÓN`);
  for (const est of datos.estilosDecoracion) {
    const paletaJson = sanitize(JSON.stringify(est.paleta || []));
    const elemJson = sanitize(JSON.stringify(est.elementos || []));
    const visualJson = sanitize(JSON.stringify(est.estiloVisual || {}));
    sql.push(
      `INSERT INTO public.estilos_decoracion (id, empresa_id, nombre, subtitulo, costo_fijo, precio_venta_sugerido, descripcion, paleta, elementos, destacado, estilo_visual) ` +
      `VALUES (${sanitize(est.id)}, ${sanitize(datos.empresaActivaId)}, ${sanitize(est.nombre)}, ${sanitize(est.subtitulo)}, ${est.costoFijo}, ${est.precioVentaSugerido}, ${sanitize(est.descripcion)}, ${paletaJson}::jsonb, ${elemJson}::jsonb, ${est.destacado ? 'true' : 'false'}, ${visualJson}::jsonb) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sql.push('');

  // 8. Cotización Actual
  sql.push(`-- 8. COTIZACIÓN ACTUAL`);
  const cot = datos.cotizacionActual;
  const personalJson = sanitize(JSON.stringify(cot.personal));
  const provsJson = sanitize(JSON.stringify(cot.proveedoresSeleccionados));
  const mesasJson = sanitize(JSON.stringify(cot.mesas));
  sql.push(
    `INSERT INTO public.cotizaciones (id, empresa_id, nombre_evento, cliente, email_cliente, telefono_cliente, tipo_evento, fecha_evento, invitados, menu_id, personal, proveedores_seleccionados, mesas, decoracion_id, margen_ganancia, aplica_iva, observaciones) ` +
    `VALUES ('cot-actual', ${sanitize(datos.empresaActivaId)}, ${sanitize(cot.nombreEvento)}, ${sanitize(cot.cliente)}, ${sanitize(cot.emailCliente)}, ${sanitize(cot.telefonoCliente)}, ${sanitize(cot.tipoEvento)}, ${sanitize(cot.fechaEvento)}, ${cot.invitados}, ${sanitize(cot.menuId)}, ${personalJson}::jsonb, ${provsJson}::jsonb, ${mesasJson}::jsonb, ${sanitize(cot.decoracionId)}, ${cot.margenGanancia}, ${cot.aplicaIva ? 'true' : 'false'}, ${sanitize(cot.observaciones)}) ` +
    `ON CONFLICT (id) DO UPDATE SET nombre_evento = EXCLUDED.nombre_evento, invitados = EXCLUDED.invitados;`
  );
  sql.push('');

  // 9. Reservas Calendario
  sql.push(`-- 9. RESERVAS CALENDARIO`);
  for (const res of datos.reservas) {
    sql.push(
      `INSERT INTO public.reservas (id, empresa_id, fecha, cliente, evento, tipo_evento, invitados, estado, total) ` +
      `VALUES (${sanitize(res.id)}, ${sanitize(res.empresaId || datos.empresaActivaId)}, ${sanitize(res.fecha)}, ${sanitize(res.cliente)}, ${sanitize(res.titulo)}, ${sanitize(res.tipoEvento)}, ${res.invitados}, ${sanitize(res.estado)}, ${res.montoTotal || 0}) ` +
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
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo .json subido por el usuario para restaurar la aplicación
 */
export function leerArchivoRespaldoJSON(file: File): Promise<PaqueteRespaldoCompleto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validación básica de estructura
        if (!parsed.insumos || !parsed.recetas || !parsed.menus) {
          throw new Error('El archivo no parece ser un respaldo válido de Dominga Eventos (faltan tablas clave).');
        }

        resolve(parsed as PaqueteRespaldoCompleto);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}
