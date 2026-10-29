# 🛡️ SOLVI Flow · Guía de Respaldo, Nube & Uptime 100% 24/7
### Software de Gestión Integral de Centros de Eventos y Productoras
**«Todo fluye. Todo conecta» · Desarrollado por CS Consultoría**

Esta guía garantiza que tu plataforma esté **siempre en línea (24/7 sin caídas)** para operar con fluidez, presentar cotizaciones en vivo y gestionar compras y reservas.

---

## 1. ¿Cómo respaldar todo en tu Disco Duro de inmediato?

Desde la aplicación web tienes **un botón directo en el encabezado:**
> Clic en **💾 Respaldo & BD** (arriba a la derecha)

Dentro del panel encontrarás dos opciones:
1. **Descargar Respaldo Completo (.JSON):**
   - Guarda en un solo archivo todos tus insumos con sus mermas, recetas de costeo, paquetes de menú, tarifas de garzones, proveedores y cotizaciones.
   - Si formateas tu equipo o cambias de computador, solo usas el botón **"Restaurar Datos"** y recuperas todo al instante.
2. **Descargar Script Base de Datos (.SQL):**
   - Genera un archivo `.sql` estándar de PostgreSQL con todas las tablas (`CREATE TABLE`), restricciones y sentencias `INSERT` con tus datos actuales.

---

## 2. ¿Por qué el demo no cargó ayer? (Explicación Transparente)

El enlace de prueba que termina en `...run.app` generado por Google Cloud AI Studio es un **entorno de desarrollo ("Sandbox Preview")**.

Tiene dos características que debes conocer:
1. **Suspensión por Inactividad ("Spin-down"):** Si pasan horas sin que nadie interactúe con el entorno de pruebas, el contenedor de Google Cloud entra en modo reposo para ahorrar recursos.
2. **Texto accidental en el enlace:** En el mensaje de ayer, el enlace copiado tenía agregado el texto `+no cargo me preocupa` al final (`...run.app+no cargo me preocupa`). Cualquier caracter extra rompe la dirección web.

---

## 3. La Solución para tu Emprendimiento: Despliegue 24/7 Gratuito

Para que tu cotizador esté **100% activo, cargue en menos de 1 segundo y nunca se caiga ante un cliente**, la mejor combinación de la industria (utilizada por miles de startups y empresas gastronómicas) es:

### A) Base de Datos: **Supabase** (PostgreSQL)
- **Costo:** 100% Gratuito (Plan Free incluye 500 MB y 50.000 usuarios activos mensuales).
- **Archivos listos en tu proyecto:**
  - `supabase/schema.sql` (Todas las tablas con relaciones y seguridad RLS).
  - `supabase/seed.sql` (Datos gastronómicos iniciales de Dominga Eventos).
  - `src/lib/supabase.ts` (Cliente de conexión preparado en TypeScript).

**Cómo activarlo en Supabase en 2 minutos:**
1. Ve a [https://supabase.com](https://supabase.com) y crea tu cuenta gratuita.
2. Crea un nuevo proyecto (ej. `dominga-eventos`).
3. En el menú lateral izquierdo, haz clic en **SQL Editor**.
4. Abre el archivo `supabase/schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
5. Haz clic en **Run** (Ejecutar). ¡Listo! Todas las tablas quedarán creadas.
6. Copia tu `Project URL` y tu `anon public key` desde *Project Settings > API*.

---

### B) Alojamiento Web: **Vercel** o **Netlify**
- **Costo:** 100% Gratuito.
- **Ventajas:**
  - **Uptime 99.99% garantizado:** Nunca entra en reposo. Tus clientes siempre verán el sitio al instante.
  - **Dominio propio gratis:** Puedes conectarle tu propio dominio como `cotizador.domingaeventos.cl` o usar el subdominio gratuito `dominga-eventos.vercel.app`.
  - **Certificado SSL / HTTPS:** Candado verde de seguridad automático.

**Pasos para publicar en Vercel:**
1. Sube tu proyecto a una cuenta de GitHub (privada o pública).
2. Entra en [https://vercel.com](https://vercel.com) y haz clic en **"Add New Project"**.
3. Importa tu repositorio de GitHub.
4. En la sección **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase (ej: `https://xyzcompany.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Tu Anon Key de Supabase
5. Haz clic en **Deploy**. En 45 segundos tu sistema estará en vivo para todo el mundo.

---

## 4. Estructura de Tablas en Supabase

| Tabla | Descripción |
|---|---|
| `empresas` | Soporte multi-empresa (Dominga Eventos, Finca La Toscana, etc.) |
| `insumos` | Maestro de materias primas con precios por kg/L y porcentaje de merma |
| `recetas` | Fichas técnicas de costeo (fondos, entradas, postres) |
| `receta_ingredientes` | Insumos que componen cada plato con cantidades brutas |
| `menus` | Paquetes de menús para eventos con precio sugerido por persona |
| `staff_tarifas` | Valores de jornales (garzones, cocineros, aseo, maitre) |
| `proveedores` | Servicios adicionales (DJ, Iluminación, Vajilla, Bar) |
| `estilos_decoracion` | Catálogo de ambientaciones |
| `cotizaciones` | Registro de cotizaciones guardadas con desglose financiero |
| `reservas` | Calendario de eventos y reservas |
