-- ==============================================================================
-- SISTEMA DE COTIZACIONES, COSTEO GASTRONÓMICO Y GESTIÓN DE EVENTOS
-- SCRIPT DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- Generado para: Dominga Eventos / Centros de Eventos & Banquetería
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs (si no está activa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLA: empresas (Soporte Multi-Empresa / Locaciones / Franquicias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    subtitulo TEXT,
    recinto_principal TEXT,
    direccion TEXT,
    ciudad TEXT DEFAULT 'Santiago, Chile',
    telefono TEXT,
    email TEXT,
    sitio_web TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA: insumos (Maestro de Insumos & Materias Primas con Merma)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.insumos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL, -- Permite categorías estándar (carnes, verduras_frutas, abarrotes, etc.) o cualquier categoría libre creada por el usuario
    unidad_medida TEXT NOT NULL, -- kg, g, L, ml, unidad, paquete
    precio_compra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    merma_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0,
    proveedor TEXT,
    ultimo_cambio DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insumos_empresa ON public.insumos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON public.insumos(categoria);

-- ==============================================================================
-- TABLA: recetas (Fichas Técnicas & Costeo de Platos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recetas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tiempo_menu TEXT NOT NULL, -- coctel, entrada, fondo, postre, trasnoche
    categoria TEXT NOT NULL,
    rendimiento_porciones INTEGER NOT NULL DEFAULT 1,
    margen_sugerido NUMERIC(5, 2) DEFAULT 33.00,
    costo_adicional_elaboracion NUMERIC(12, 2) DEFAULT 0,
    descripcion_procedimiento TEXT,
    menu_asociado_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recetas_empresa ON public.recetas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_recetas_tiempo ON public.recetas(tiempo_menu);

-- ==============================================================================
-- TABLA: receta_ingredientes (Ingredientes detallados por cada ficha técnica)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.receta_ingredientes (
    id TEXT PRIMARY KEY,
    receta_id TEXT NOT NULL REFERENCES public.recetas(id) ON DELETE CASCADE,
    insumo_id TEXT NOT NULL REFERENCES public.insumos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 3) NOT NULL DEFAULT 0,
    unidad TEXT NOT NULL,
    merma_especifica NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_receta ON public.receta_ingredientes(receta_id);
CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_insumo ON public.receta_ingredientes(insumo_id);

-- ==============================================================================
-- TABLA: menus (Opciones y Paquetes de Menús para Cotización)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.menus (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL, -- formal, campestre, cocktail, premium
    costo_persona NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_sugerido_persona NUMERIC(12, 2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    coctel TEXT,
    entrada TEXT,
    fondo TEXT,
    postre TEXT,
    trasnoche TEXT,
    destacado BOOLEAN DEFAULT FALSE,
    recetas_ids JSONB DEFAULT '[]'::jsonb,
    costo_calculado_desde_recetas BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_empresa ON public.menus(empresa_id);

-- ==============================================================================
-- TABLA: staff_tarifas (Tarifas y ratios de personal por jornada)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff_tarifas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    garzon_jornada NUMERIC(12, 2) NOT NULL DEFAULT 45000,
    cocinero_jornada NUMERIC(12, 2) NOT NULL DEFAULT 55000,
    aseo_jornada NUMERIC(12, 2) NOT NULL DEFAULT 40000,
    maitre_jornada NUMERIC(12, 2) NOT NULL DEFAULT 70000,
    ratio_garzon INTEGER NOT NULL DEFAULT 15,
    ratio_cocinero INTEGER NOT NULL DEFAULT 35,
    ratio_aseo INTEGER NOT NULL DEFAULT 50,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA: proveedores (Servicios de Terceros: DJ, Iluminación, Vajilla, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.proveedores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL, -- tecnica, ambientacion, vajilla, bar, cobertura
    tipo_cobro TEXT NOT NULL, -- fijo, por_persona
    costo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_venta_sugerido NUMERIC(12, 2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    icon_name TEXT,
    obligatorio BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);

-- ==============================================================================
-- TABLA: estilos_decoracion (Ambientación, Montaje y Estilos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.estilos_decoracion (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    subtitulo TEXT,
    costo_fijo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_venta_sugerido NUMERIC(12, 2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    paleta JSONB DEFAULT '[]'::jsonb,
    elementos JSONB DEFAULT '[]'::jsonb,
    destacado BOOLEAN DEFAULT FALSE,
    estilo_visual JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA: cotizaciones (Registro de Cotizaciones y Eventos Proyectados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre_evento TEXT NOT NULL,
    cliente TEXT NOT NULL,
    email_cliente TEXT,
    telefono_cliente TEXT,
    tipo_evento TEXT NOT NULL,
    fecha_evento DATE,
    invitados INTEGER NOT NULL DEFAULT 100,
    menu_id TEXT,
    personal JSONB NOT NULL DEFAULT '{}'::jsonb,
    proveedores_seleccionados JSONB NOT NULL DEFAULT '{}'::jsonb,
    mesas JSONB NOT NULL DEFAULT '[]'::jsonb,
    decoracion_id TEXT,
    margen_ganancia NUMERIC(5, 2) NOT NULL DEFAULT 35.00,
    aplica_iva BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    total_neto NUMERIC(12, 2),
    total_iva NUMERIC(12, 2),
    total_final NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON public.cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON public.cotizaciones(fecha_evento);

-- ==============================================================================
-- TABLA: reservas (Calendario de Fechas y Disponibilidad del Centro de Eventos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reservas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cliente TEXT NOT NULL,
    evento TEXT NOT NULL,
    tipo_evento TEXT,
    invitados INTEGER NOT NULL DEFAULT 100,
    estado TEXT NOT NULL DEFAULT 'confirmada', -- confirmada, pendiente, bloqueada
    saldo_pendiente NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON public.reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_empresa ON public.reservas(empresa_id);

-- Columnas extendidas seguras para altas de nuevos centros contratados (idempotente)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS letra_logo TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS color_tema TEXT DEFAULT 'amber';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS razon_social_legal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS rut_empresa TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS giro_comercial TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS contacto_responsable TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cargo_responsable TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS modalidad_operacion TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS capacidad_max_pax INTEGER;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS tarifa_base_arriendo NUMERIC(12, 2);

-- ==============================================================================
-- TABLA: demo_telemetria (Medidor Remoto de Uso del Demo Comercial)
-- ==============================================================================
-- Seguridad de mínimo privilegio:
-- - Visitantes anónimos de demos (?centro=dominga, ?centro=damaris) SOLO pueden INSERTAR eventos validados.
-- - SOLO el Administrador autenticado (`authenticated`) puede LEER o BORRAR la telemetría.
-- - Ningún cliente o visitante puede espiar la actividad de otros centros.
CREATE TABLE IF NOT EXISTS public.demo_telemetria (
    id TEXT PRIMARY KEY,
    centro_id TEXT NOT NULL,
    centro_nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalle TEXT,
    sesion_id TEXT,
    user_agent_corto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_telemetria_tipo CHECK (tipo IN ('visita', 'cotizacion', 'invitados', 'menu', 'pdf', 'whatsapp', 'recetas', 'proveedores', 'calendario')),
    CONSTRAINT chk_telemetria_largo CHECK (
        char_length(id) <= 80
        AND char_length(centro_id) <= 64
        AND char_length(centro_nombre) <= 180
        AND (detalle IS NULL OR char_length(detalle) <= 240)
    )
);

CREATE INDEX IF NOT EXISTS idx_demo_telemetria_centro ON public.demo_telemetria(centro_id);
CREATE INDEX IF NOT EXISTS idx_demo_telemetria_created ON public.demo_telemetria(created_at DESC);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS) PARA SUPABASE
-- ==============================================================================
-- Habilitamos RLS en todas las tablas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estilos_decoracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_telemetria ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad por defecto (ENDURECIDAS PARA PRODUCCIÓN):
-- 1) Catálogo público comercial (solo lectura para visitantes/cotizador demo)
-- 2) Datos confidenciales (costos reales, insumos, recetas, PII de clientes y reservas)
--    restringidos únicamente a personal autenticado en Supabase Auth.
-- 3) Telemetría demo: inserción anónima validada (write-only), lectura/borrado solo Admin autenticado.

DROP POLICY IF EXISTS "Permitir lectura publica de empresas" ON public.empresas;
DROP POLICY IF EXISTS "Lectura publica empresas" ON public.empresas;
DROP POLICY IF EXISTS "Staff gestiona empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir lectura y escritura de insumos" ON public.insumos;
DROP POLICY IF EXISTS "Staff gestiona insumos" ON public.insumos;
DROP POLICY IF EXISTS "Permitir lectura y escritura de recetas" ON public.recetas;
DROP POLICY IF EXISTS "Staff gestiona recetas" ON public.recetas;
DROP POLICY IF EXISTS "Permitir lectura y escritura de receta_ingredientes" ON public.receta_ingredientes;
DROP POLICY IF EXISTS "Staff gestiona receta_ingredientes" ON public.receta_ingredientes;
DROP POLICY IF EXISTS "Permitir lectura y escritura de menus" ON public.menus;
DROP POLICY IF EXISTS "Lectura publica menus" ON public.menus;
DROP POLICY IF EXISTS "Staff gestiona menus" ON public.menus;
DROP POLICY IF EXISTS "Permitir lectura y escritura de staff_tarifas" ON public.staff_tarifas;
DROP POLICY IF EXISTS "Staff gestiona staff_tarifas" ON public.staff_tarifas;
DROP POLICY IF EXISTS "Permitir lectura y escritura de proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Staff gestiona proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Permitir lectura y escritura de estilos_decoracion" ON public.estilos_decoracion;
DROP POLICY IF EXISTS "Lectura publica estilos" ON public.estilos_decoracion;
DROP POLICY IF EXISTS "Staff gestiona estilos_decoracion" ON public.estilos_decoracion;
DROP POLICY IF EXISTS "Permitir lectura y escritura de cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Staff gestiona cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Permitir lectura y escritura de reservas" ON public.reservas;
DROP POLICY IF EXISTS "Staff gestiona reservas" ON public.reservas;
DROP POLICY IF EXISTS "Insertar telemetria demo anonima" ON public.demo_telemetria;
DROP POLICY IF EXISTS "Admin lee y gestiona telemetria demo" ON public.demo_telemetria;

-- Restricciones de integridad para evitar valores negativos o corruptos en base de datos
ALTER TABLE public.insumos DROP CONSTRAINT IF EXISTS chk_insumos_precio_merma;
ALTER TABLE public.insumos ADD CONSTRAINT chk_insumos_precio_merma CHECK (precio_compra >= 0 AND merma_porcentaje >= 0 AND merma_porcentaje <= 100);

ALTER TABLE public.recetas DROP CONSTRAINT IF EXISTS chk_recetas_valores;
ALTER TABLE public.recetas ADD CONSTRAINT chk_recetas_valores CHECK (rendimiento_porciones > 0 AND margen_sugerido >= 0 AND margen_sugerido <= 100 AND costo_adicional_elaboracion >= 0);

ALTER TABLE public.cotizaciones DROP CONSTRAINT IF EXISTS chk_cotizaciones_invitados;
ALTER TABLE public.cotizaciones ADD CONSTRAINT chk_cotizaciones_invitados CHECK (invitados > 0 AND invitados <= 50000);

ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS chk_reservas_invitados;
ALTER TABLE public.reservas ADD CONSTRAINT chk_reservas_invitados CHECK (invitados > 0 AND invitados <= 50000);

-- Catálogo comercial visible públicamente (solo SELECT, sin INSERT/UPDATE/DELETE anónimo)
CREATE POLICY "Lectura publica empresas" ON public.empresas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica menus" ON public.menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica estilos" ON public.estilos_decoracion FOR SELECT TO anon, authenticated USING (true);

-- Telemetría de demos: los prospectos anónimos SOLO pueden enviar pings de uso; nunca leer ni borrar
CREATE POLICY "Insertar telemetria demo anonima" ON public.demo_telemetria
FOR INSERT TO anon, authenticated
WITH CHECK (
    char_length(id) BETWEEN 4 AND 80
    AND char_length(centro_id) BETWEEN 2 AND 64
    AND char_length(centro_nombre) BETWEEN 2 AND 180
);
CREATE POLICY "Admin lee y gestiona telemetria demo" ON public.demo_telemetria
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Gestión integral restringida estrictamente a usuarios autenticados (Staff / Administrador)
CREATE POLICY "Staff gestiona empresas" ON public.empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona insumos" ON public.insumos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona recetas" ON public.recetas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona receta_ingredientes" ON public.receta_ingredientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona menus" ON public.menus FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona staff_tarifas" ON public.staff_tarifas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona proveedores" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona estilos_decoracion" ON public.estilos_decoracion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona cotizaciones" ON public.cotizaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona reservas" ON public.reservas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Nota: Para aislamiento multi-empresa estricto por empresa_id (tenancy),
-- consulta y aplica la Opción 2 en supabase/politicas_rls.sql.
