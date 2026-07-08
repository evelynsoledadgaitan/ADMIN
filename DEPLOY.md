# Desplegar ADMIN — guía paso a paso

Esta guía asume que es la primera vez que hacés un deploy. No se da nada por sentado: cada paso incluye exactamente dónde hacer clic o qué comando escribir.

---

## 0. Lo que ya revisé y corregí antes de este paso

Antes de escribir esta guía, revisé el proyecto pensando específicamente en "¿esto anda si lo despliego ahora mismo?". Encontré y corregí dos problemas reales:

1. **Faltaba `vercel.json`.** ADMIN es una aplicación de una sola página (SPA): todas las rutas (`/clientes`, `/proveedores/abc123`, etc.) las resuelve el navegador, no el servidor. Sin decirle explícitamente a Vercel que redirija cualquier ruta a `index.html`, refrescar la página en `/clientes` (o instalarla directo ahí) iba a dar un error 404. Ya está agregado.
2. **Faltaba la configuración de ESLint.** Había un script `lint` en `package.json` y las dependencias instaladas, pero ningún archivo de configuración — `npm run lint` fallaba directamente. No bloqueaba el deploy (Vercel solo corre `build`, no `lint`), pero es una herramienta de calidad que corresponde que funcione. Ya está agregada y corre sin errores.

Todo lo demás — `package.json`, la configuración de Vite, el manifest de la PWA, los íconos, las variables de entorno esperadas, las rutas, TypeScript — ya estaba en orden. `npm run build` termina sin errores y sin advertencias de TypeScript.

---

## 1. Crear una cuenta en GitHub (si no tenés una)

GitHub es donde va a vivir el código fuente de ADMIN. Vercel se conecta directo a un repositorio de GitHub para desplegar.

1. Andá a **[github.com](https://github.com)** → **Sign up**.
2. Completá email, contraseña y nombre de usuario. Verificá el email cuando te llegue.

Si ya tenés cuenta, pasá directo al paso 2.

---

## 2. Crear el repositorio

1. Ya logueado en GitHub, hacé clic en el **+** de arriba a la derecha → **New repository**.
2. **Repository name**: `admin` (o el nombre que prefieras).
3. **Visibility**: elegí **Private** — ADMIN va a manejar datos reales de tu negocio, no tiene sentido que el código (aunque no tenga datos, sí tiene la estructura completa) sea público.
4. **No marques** ninguna casilla de "Add a README", "Add .gitignore" ni "Choose a license" — el proyecto que tenés ya incluye todo eso, y si GitHub crea sus propios archivos vamos a tener un conflicto al subir.
5. Clic en **Create repository**.

GitHub te va a mostrar una pantalla con comandos — no los uses todavía, seguí con el paso 3 primero.

---

## 3. Subir el proyecto a GitHub

### 3.1 Instalar Git (si no lo tenés)

Abrí una terminal y escribí:
```bash
git --version
```
Si te muestra un número de versión, ya lo tenés y podés saltar a 3.2. Si te dice que el comando no existe:
- **Windows**: descargá e instalá [Git for Windows](https://git-scm.com/download/win) (dejá todas las opciones por defecto durante la instalación).
- **Mac**: escribí `git --version` en la Terminal — macOS te va a ofrecer instalar las "Command Line Tools" automáticamente, aceptá.
- **Linux**: `sudo apt install git` (o el gestor de paquetes de tu distribución).

### 3.2 Descomprimir el proyecto

Descomprimí el archivo `.zip` que te compartí. Vas a tener una carpeta llamada `admin` — **adentro** de esa carpeta está `package.json`, `src/`, `supabase/`, etc. Es importante que el repositorio de Git se cree **desde adentro** de esa carpeta, no desde una carpeta que la contenga.

### 3.3 Inicializar el repositorio y subirlo

Abrí una terminal **dentro** de la carpeta `admin` (donde está `package.json`) y ejecutá, uno por uno:

```bash
git init
git add .
git commit -m "Beta 0.1"
git branch -M main
```

Ahora conectá tu repositorio local con el que creaste en GitHub. Reemplazá `TU-USUARIO` por tu nombre de usuario de GitHub:

```bash
git remote add origin https://github.com/TU-USUARIO/admin.git
git push -u origin main
```

Te va a pedir que inicies sesión (usuario y, en vez de contraseña, un *token de acceso personal* — GitHub te va a guiar si no tenés uno configurado; también podés usar [GitHub Desktop](https://desktop.github.com/) si preferís no usar la terminal para este paso).

Cuando termine, refrescá la página de tu repositorio en GitHub — deberías ver todos los archivos del proyecto ahí.

---

## 4. Crear el proyecto en Supabase (producción)

Hasta ahora usaste Supabase solo para pruebas. Para la Beta con datos reales, conviene un proyecto de Supabase dedicado (no el mismo que usaste, si era de prueba).

1. Andá a **[supabase.com](https://supabase.com)** → **Start your project** → iniciá sesión (podés usar tu cuenta de GitHub).
2. **New project**.
3. Elegí una organización (si es tu primera vez, Supabase crea una automáticamente).
4. **Name**: `admin` (o el nombre que prefieras).
5. **Database Password**: generá una contraseña fuerte y **guardala en un lugar seguro** (gestor de contraseñas) — la vas a necesitar si algún día accedés a la base directamente.
6. **Region**: elegí la más cercana a donde vas a usar la app (para Argentina, `South America (São Paulo)` suele ser la más rápida).
7. Clic en **Create new project**. Tarda 1-2 minutos en aprovisionarse.

### 4.1 Instalar la Supabase CLI

En tu terminal (puede ser desde cualquier carpeta):

```bash
npm install -g supabase
```

Si te da un error de permisos en Mac/Linux, probá con `sudo npm install -g supabase`.

### 4.2 Conectar la CLI con tu proyecto

Volvé a la terminal, **dentro de la carpeta `admin`**, y ejecutá:

```bash
supabase login
```

Se va a abrir el navegador para que autorices el acceso. Volvé a la terminal cuando termine.

Ahora necesitás el **Project Reference** de tu proyecto de Supabase: en el panel de Supabase, andá a **Project Settings** (ícono de engranaje) → **General** → copiá el valor de **Reference ID** (algo como `abcdefghijklmnop`).

```bash
supabase link --project-ref TU-REFERENCE-ID
```

Te va a pedir la contraseña de la base de datos que generaste en el paso 3 de la creación del proyecto.

### 4.3 Aplicar las migraciones (crear todas las tablas)

```bash
supabase db push
```

Esto ejecuta, en orden, todos los archivos de `supabase/migrations/` contra tu base de datos real — crea todas las tablas, funciones, triggers y políticas de seguridad de una sola vez.

### 4.4 Cargar los catálogos iniciales

**Importante:** `supabase db seed` **no existe** como comando de la CLI (es un error común — ni siquiera versiones viejas lo tuvieron). El seeding automático solo pasa con `supabase db reset` o `supabase start`, y ninguno de los dos sirve acá (`reset` borraría y reaplicaría todo desde cero contra tu base real). El camino confiable es pegar el contenido de `seed.sql` directo en el SQL Editor:

1. En el panel de Supabase, andá a **SQL Editor** → **New query**.
2. Abrí `supabase/seed.sql` en tu editor de texto, copiá todo su contenido, y pegalo en el SQL Editor de Supabase.
3. Clic en **Run**.

Esto carga los catálogos de condición frente al IVA, estados de cheque y modalidad de pago. El catálogo de medios de pago (Efectivo, Transferencia, Cheque, etc.) **no** está en `seed.sql` — se carga solo, como parte de la migración `0011_medios_pago.sql`, en el paso anterior (`db push`). No hace falta ningún paso adicional para ese catálogo.

### 4.5 Crear tu primer usuario (el admin)

Esto se hace en dos pasos, porque la autenticación (quién puede entrar) y los datos de negocio del usuario (nombre, rol) viven en dos lugares distintos.

**Paso A — crear las credenciales de acceso:**
1. En el panel de Supabase, andá a **Authentication** → **Users** → **Add user** → **Create new user**.
2. Completá tu email y una contraseña.
3. **Importante**: marcá la casilla **Auto Confirm User** (si no, el usuario queda esperando un email de confirmación que todavía no configuramos).
4. Clic en **Create user**. Anotá o copiá el **User UID** que aparece en la lista (un uuid largo) — lo vas a necesitar en el paso B.

**Paso B — darle sus datos de negocio y marcarlo como admin:**
1. Andá a **SQL Editor** (ícono de consola, en el menú izquierdo) → **New query**.
2. Pegá esto, reemplazando `EL-UUID-QUE-COPIASTE` y los datos de tu nombre/email:

```sql
insert into public.usuarios (id, nombre, email, rol, activo)
values ('EL-UUID-QUE-COPIASTE', 'Tu Nombre', 'tu-email@ejemplo.com', 'admin', true);
```

3. Clic en **Run**. Si no da error, tu usuario admin ya existe.

### 4.6 Copiar las credenciales que necesita la aplicación

Andá a **Project Settings** → **API**. Vas a necesitar dos valores para el próximo paso:
- **Project URL** (algo como `https://abcdefghijklmnop.supabase.co`)
- **anon public** key (una clave larga, empieza con `eyJ...`)

Dejalos copiados a mano — los vas a pegar en Vercel en el paso 5.

---

## 5. Conectar el repositorio con Vercel

1. Andá a **[vercel.com](https://vercel.com)** → **Sign Up** → elegí **Continue with GitHub** (así Vercel puede ver tus repositorios directamente).
2. Autorizá el acceso cuando te lo pida GitHub.
3. En el panel de Vercel, clic en **Add New...** → **Project**.
4. Vas a ver la lista de tus repositorios de GitHub — buscá `admin` y clic en **Import**.
5. Vercel detecta automáticamente que es un proyecto Vite (**Framework Preset: Vite**) — no cambies nada ahí.

### 5.1 Configurar las variables de entorno

**Antes de tocar "Deploy"**, expandí la sección **Environment Variables** en esa misma pantalla y agregá las dos que copiaste de Supabase:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | tu Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu anon public key de Supabase |

Si te olvidás este paso, la aplicación va a compilar bien pero al abrirla te va a mostrar un error de configuración (el mismo mensaje que agregamos en `src/lib/supabase/client.ts` para justamente detectar esto rápido).

### 5.2 Desplegar

Clic en **Deploy**. Vercel va a instalar las dependencias y correr `npm run build` — tarda entre 1 y 3 minutos. Cuando termine, te va a mostrar una captura de la app y un botón para visitarla, con una URL del tipo `https://admin-tu-usuario.vercel.app`.

Abrí esa URL en el navegador de tu computadora primero, e iniciá sesión con el usuario que creaste en el paso 4.5 — confirmá que entrás bien a la Pantalla Principal antes de instalarlo en el celular.

---

## 6. Instalar la PWA en tu Android

1. Abrí **Chrome** en tu celular Android (tiene que ser Chrome, no otro navegador, para que la instalación funcione igual que se probó).
2. Escribí la URL de Vercel (`https://admin-tu-usuario.vercel.app`) y entrá.
3. Iniciá sesión con tu usuario.
4. Chrome debería mostrar automáticamente un banner abajo que dice algo como **"Agregar ADMIN a la pantalla de inicio"** o **"Instalar app"**. Si no aparece solo:
   - Tocá el ícono de **⋮** (tres puntos) arriba a la derecha.
   - Elegí **"Instalar app"** o **"Agregar a pantalla de inicio"**.
5. Confirmá. Va a aparecer un ícono de ADMIN (el monograma azul) en tu pantalla de inicio, como cualquier otra app.
6. Abrilo desde ahí — debería abrir en pantalla completa, sin la barra de direcciones de Chrome.

---

## 7. Para los próximos Sprints (cómo van a llegar las actualizaciones)

Vale la pena que sepas esto desde ahora, porque va a ser el flujo normal de acá en adelante:

- **Cambios de código** (pantallas, componentes, lógica): cuando te pase una nueva versión del proyecto, subís los cambios a GitHub (`git add .`, `git commit`, `git push`) y **Vercel despliega solo** — no hay ningún paso manual extra.
- **Cambios de base de datos** (nuevas tablas, columnas, funciones — los archivos en `supabase/migrations/`): esto **no se aplica solo**. Cada vez que haya migraciones nuevas, necesitás correr `supabase db push` de nuevo contra tu proyecto real, igual que en el paso 4.3. Si un Sprint agrega una migración y te olvidás de correr `db push`, la aplicación nueva va a fallar buscando una tabla o columna que todavía no existe en tu base — es el error más común al actualizar, y ahora ya sabés exactamente qué mirar si pasa.

---

## Resumen de lo que necesitás tener a mano

- Usuario y contraseña de GitHub.
- La contraseña de la base de datos de Supabase (la que generaste en el paso 4).
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API en Supabase) — cargadas en Vercel.
- Tu usuario y contraseña de ADMIN (el que creaste en el paso 4.5) para loguearte en el celular.
