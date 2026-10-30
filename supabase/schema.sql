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

-- Políticas de lectura y escritura para rol anónimo (ideal para arrancar la app de inmediato sin barreras de Auth)
CREATE POLICY "Permitir lectura publica de empresas" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "Permitir lectura y escritura de insumos" ON public.insumos FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de recetas" ON public.recetas FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de receta_ingredientes" ON public.receta_ingredientes FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de menus" ON public.menus FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de staff_tarifas" ON public.staff_tarifas FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de proveedores" ON public.proveedores FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de estilos_decoracion" ON public.estilos_decoracion FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de cotizaciones" ON public.cotizaciones FOR ALL USING (true);
CREATE POLICY "Permitir lectura y escritura de reservas" ON public.reservas FOR ALL USING (true);
