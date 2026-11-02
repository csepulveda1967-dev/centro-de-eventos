-- ==============================================================================
-- GUÍA Y SCRIPT DE POLÍTICAS ROW LEVEL SECURITY (RLS) PARA SUPABASE
-- Sistema: SOLVI Flow / Dominga Eventos (Banquetería y Centros de Eventos)
-- ==============================================================================

-- ¿QUÉ ES RLS?
-- Row Level Security (Seguridad a Nivel de Fila) es el cortafuegos de PostgreSQL.
-- Asegura que nadie pueda leer ni modificar datos a los que no tiene autorización,
-- incluso si tienen la URL y la llave pública (anon key) del proyecto.

-- ==============================================================================
-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS (Obligatorio)
-- ==============================================================================
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

-- ==============================================================================
-- OPCIÓN 1: MODO INICIO RÁPIDO (Ideal para empezar hoy sin login)
-- Permite que la app web lea y guarde datos usando la llave pública "anon".
-- ==============================================================================

-- Limpiar políticas previas si existieran
DROP POLICY IF EXISTS "Acceso publico empresas" ON public.empresas;
DROP POLICY IF EXISTS "Acceso publico insumos" ON public.insumos;
DROP POLICY IF EXISTS "Acceso publico recetas" ON public.recetas;
DROP POLICY IF EXISTS "Acceso publico receta_ingredientes" ON public.receta_ingredientes;
DROP POLICY IF EXISTS "Acceso publico menus" ON public.menus;
DROP POLICY IF EXISTS "Acceso publico staff_tarifas" ON public.staff_tarifas;
DROP POLICY IF EXISTS "Acceso publico proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Acceso publico estilos_decoracion" ON public.estilos_decoracion;
DROP POLICY IF EXISTS "Acceso publico cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Acceso publico reservas" ON public.reservas;

-- Crear políticas permisivas para desarrollo o uso comercial directo:
CREATE POLICY "Acceso publico empresas" ON public.empresas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico insumos" ON public.insumos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico recetas" ON public.recetas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico receta_ingredientes" ON public.receta_ingredientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico menus" ON public.menus FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico staff_tarifas" ON public.staff_tarifas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico proveedores" ON public.proveedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico estilos_decoracion" ON public.estilos_decoracion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico cotizaciones" ON public.cotizaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso publico reservas" ON public.reservas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ==============================================================================
-- OPCIÓN 2: MODO HÍBRIDO PROFESIONAL (El más recomendado)
-- - Los clientes pueden VER menús y estilos de decoración.
-- - Los costos reales, insumos, sueldos y cotizaciones solo los ve y edita el personal con Login (authenticated).
-- ==============================================================================

/*
-- Para activar la Opción 2, primero elimina las políticas de la Opción 1 y ejecuta:

-- A) Catálogos públicos (cualquier visitante puede cotizar o ver opciones):
CREATE POLICY "Lectura publica de empresas" ON public.empresas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica de menus" ON public.menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica de estilos" ON public.estilos_decoracion FOR SELECT TO anon, authenticated USING (true);

-- B) Crear cotizaciones (cualquier cliente o vendedor puede ingresar una cotización):
CREATE POLICY "Crear cotizaciones" ON public.cotizaciones FOR INSERT TO anon, authenticated WITH CHECK (true);

-- C) Datos confidenciales protegidos (solo usuarios con sesión iniciada en Supabase Auth):
CREATE POLICY "Staff gestiona insumos" ON public.insumos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona recetas" ON public.recetas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona receta_ingredientes" ON public.receta_ingredientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff gestiona staff_tarifas" ON public.staff_tarifas FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff gestiona proveedores" ON public.proveedores FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff gestiona cotizaciones completas" ON public.cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff actualiza cotizaciones" ON public.cotizaciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff gestiona reservas" ON public.reservas FOR ALL TO authenticated USING (true) WITH CHECK (true);
*/


-- ==============================================================================
-- OPCIÓN 3: MODO MULTI-EMPRESA ESTRICTO (Tenancy por empresa_id)
-- Si tienes varias empresas (ej: Dominga Eventos y Finca La Toscana) y cada
-- usuario pertenece a una empresa específica mediante user_metadata en auth.users:
-- ==============================================================================

/*
-- Ejemplo de política multi-empresa:
CREATE POLICY "Ver solo insumos de mi empresa" ON public.insumos
FOR ALL TO authenticated
USING (
    empresa_id = (auth.jwt() -> 'user_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') = 'superadmin'
)
WITH CHECK (
    empresa_id = (auth.jwt() -> 'user_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') = 'superadmin'
);
*/
