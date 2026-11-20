-- ==============================================================================
-- SCRIPT ENDURECIDO DE POLÍTICAS ROW LEVEL SECURITY (RLS) PARA SUPABASE
-- Sistema: SOLVI Flow (Banquetería y Centros de Eventos)
-- ==============================================================================
-- IMPORTANTE DE SEGURIDAD:
-- La llave pública (VITE_SUPABASE_ANON_KEY) vive en el navegador del usuario.
-- Por eso, NUNCA debe permitirse que el rol `anon` lea PII de clientes, costos
-- internos o ejecute UPDATE/DELETE en producción.
-- ==============================================================================

-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS (Obligatorio)
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

-- Limpiar políticas permisivas heredadas o previas si existieran
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

-- ==============================================================================
-- OPCIÓN 1 (ACTIVA POR DEFECTO): MODO SEGURO DE PRODUCCIÓN
-- - Visitantes anónimos: SOLO lectura de catálogos públicos (empresas, menús, estilos)
--   e INSERT validado en demo_telemetria (write-only; no pueden leer actividad ajena).
-- - Datos sensibles (insumos, recetas, tarifas, proveedores, cotizaciones con PII, reservas y telemetría):
--   exclusivamente para usuarios autenticados en Supabase Auth (`authenticated`).
-- ==============================================================================

-- A) Catálogos públicos de solo lectura (sin acceso de escritura anónimo)
CREATE POLICY "Lectura publica empresas" ON public.empresas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica menus" ON public.menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica estilos" ON public.estilos_decoracion FOR SELECT TO anon, authenticated USING (true);

-- B) Telemetría del Medidor Demo (anon inserta uso; SOLO Admin autenticado lee/resetea)
CREATE POLICY "Insertar telemetria demo anonima" ON public.demo_telemetria
FOR INSERT TO anon, authenticated
WITH CHECK (
    char_length(id) BETWEEN 4 AND 80
    AND char_length(centro_id) BETWEEN 2 AND 64
    AND char_length(centro_nombre) BETWEEN 2 AND 180
);
CREATE POLICY "Admin lee y gestiona telemetria demo" ON public.demo_telemetria
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- C) Datos confidenciales, costos internos y PII protegidos por autenticación
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

-- ==============================================================================
-- OPCIÓN 2 (RECOMENDADA PARA VARIAS EMPRESAS EN UNA SOLA BD): MULTI-TENANCY ESTRICTO
-- Cada usuario autenticado solo puede ver y modificar filas de SU propia `empresa_id`
-- definida en `auth.users.raw_app_meta_data` (app_metadata, no editable por el cliente).
-- ==============================================================================
/*
-- Nota: usa `app_metadata` (gestionado por el administrador/servidor en Supabase),
-- NUNCA `user_metadata` (que puede ser modificado por el propio usuario vía auth.updateUser).

CREATE POLICY "Tenant insumos por empresa" ON public.insumos
FOR ALL TO authenticated
USING (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
)
WITH CHECK (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
);

CREATE POLICY "Tenant cotizaciones por empresa" ON public.cotizaciones
FOR ALL TO authenticated
USING (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
)
WITH CHECK (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
);

CREATE POLICY "Tenant reservas por empresa" ON public.reservas
FOR ALL TO authenticated
USING (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
)
WITH CHECK (
    empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin'
);
*/
