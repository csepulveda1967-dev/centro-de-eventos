# 🌸 SOLVI Flow · Gestión Integral de Centros de Eventos y Productoras
> **«Todo fluye. Todo conecta»** · Desarrollado por **CS Consultoría**

Plataforma profesional en **React 19, TypeScript, Tailwind CSS y Supabase** diseñada para centros de eventos, banquetearías, centros campestres y productoras de eventos. Integra en un solo flujo la cotización en vivo con márgenes comerciales, escandallo gastronómico con mermas por porción, explosión automática de compras a proveedores, tarifas de staff y calendario de reservas.

---

## 🚀 Inicio Rápido (Local)

### Requisitos Previos
- **Node.js 18+** o superior.
- **npm** (o **bun** / **pnpm**).

### Pasos de Instalación
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# 3. Compilar para producción (carpeta dist/)
npm run build
```

---

## 🐙 Cómo Subir Este Proyecto a GitHub en 3 Pasos

> **IMPORTANTE**: GitHub es un sistema de control de versiones Git, **no subas archivos `.zip`**. Este proyecto está completamente limpio y listo para conectarse a tu repositorio.

1. **Crea un repositorio nuevo en [GitHub.com](https://github.com/new)**:
   - Ponle un nombre (ejemplo: `solvi-flow` o `dominga-eventos`).
   - Déjalo **vacío** (no marques la casilla *"Add a README file"*, ya tenemos este).

2. **Abre la terminal en la carpeta del proyecto y ejecuta:**
   ```bash
   git init
   git add .
   git commit -m "feat: SOLVI Flow - Proyecto limpio y completo"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```
   *(Reemplaza `TU-USUARIO/TU-REPOSITORIO` con el enlace de tu repositorio de GitHub).*

3. **¡Listo!** Cada cambio que hagas en el código lo sincronizas con:
   ```bash
   git add .
   git commit -m "Actualización"
   git push
   ```

---

## 📁 Estructura Limpia del Proyecto

```text
├── src/
│   ├── components/            # Módulos del cotizador, recetas, compras y calendario
│   ├── config/                # Tarifas por defecto, recetas base e insumos gastronómicos
│   ├── lib/                   # Conector Supabase en TypeScript con fallback offline
│   ├── types/                 # Interfaces estrictas en TypeScript
│   ├── utils/                 # Cálculo de escandallo, mermas y respaldos
│   ├── App.tsx                # Aplicación principal
│   └── main.tsx               # Punto de entrada Vite + React
├── supabase/
│   ├── schema.sql             # Estructura DDL para PostgreSQL con políticas RLS
│   └── seed.sql               # Insumos y recetas iniciales en pesos chilenos (CLP)
├── .env.example               # Ejemplo de variables de entorno (Supabase opcional)
├── .gitignore                 # Exclusiones seguras de Git (evita subir node_modules o zips)
├── index.html                 # HTML raíz con metadatos y fuentes
├── package.json               # Dependencias y scripts limpios
├── tsconfig.json              # Configuración de compilador TypeScript
└── vite.config.ts             # Configuración de Vite + Tailwind
```

---

## ☁️ Conexión con Supabase (Base de Datos en la Nube - Opcional)

El sistema funciona **100% de manera autónoma en el navegador** (guardando datos en `localStorage`). Si deseas activar base de datos PostgreSQL persistente en la nube:

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Ve a la sección **SQL Editor**.
3. Copia el contenido de `supabase/schema.sql` y ejecútalo para crear las tablas.
4. (Opcional) Copia el contenido de `supabase/seed.sql` para cargar los insumos gastronómicos iniciales.
5. Copia tu `Project URL` y `anon public key` en tu archivo `.env` o en el panel de Vercel/Netlify:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

---

## 🌐 Publicación en Producción 24/7 (Vercel / Netlify)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** y selecciona tu repositorio `solvi-flow`.
3. Vercel detectará automáticamente que es un proyecto **Vite**.
4. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Haz clic en **Deploy**. Tendrás tu sitio web activo las 24 horas con dominio SSL seguro.

---

## 📄 Licencia y Autor
- **Desarrollado por:** CS Consultoría
- **Propiedad:** Todos los derechos reservados.
