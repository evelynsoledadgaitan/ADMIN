# ADMIN

> Ahorrar tiempo y no olvidar nada.

PWA de administración de negocio. Stack: React + TypeScript + Vite, Tailwind + shadcn/ui, Supabase (PostgreSQL + Auth + Storage), Vercel.

Este repositorio contiene los **cimientos** del proyecto (Fase 0): configuración, sistema de componentes reutilizables, autenticación y modelo inicial de base de datos. Todavía no incluye ningún módulo funcional — eso empieza en la próxima etapa aprobada.

## Historial de cambios y estado del proyecto

`CHANGELOG.md` — una entrada por Sprint (Agregado / Cambios / Errores corregidos / Pendiente), se actualiza al cerrar cada Sprint.
`ROADMAP.md` — tabla de estado de todos los Sprints, se actualiza al cerrar y al arrancar cada uno.
`BETA.md` — qué incluye y qué no incluye la Release Beta 0.1, y cómo instalarla para probarla con datos reales.
`DEPLOY.md` — guía paso a paso para desplegar en Vercel + Supabase e instalar la PWA en Android.
`WORKFLOW.md` — cómo se entregan los cambios a partir de la Beta 0.1: parches de Git, no ZIPs completos.

## Decisiones técnicas

Antes de tocar código, leer `docs/decisiones/` — ahí está el porqué de cada elección de arquitectura (auditoría por triggers, permisos, preparación multiempresa, PWA sin offline, sistema de diseño, navegación, colores semánticos).

## Sistema de componentes

Antes de construir una pantalla nueva, revisar `docs/sistema-de-componentes.md` — el catálogo completo de componentes reutilizables (formularios, listados, confirmaciones, feedback) con ejemplos de uso. Casi cualquier elemento de interfaz que necesites ya existe ahí.

## Requisitos

- Node.js 20+
- Cuenta y proyecto en [Supabase](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalada (`npm install -g supabase` o via el gestor de paquetes del sistema)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
# completar .env.local con la URL y anon key del proyecto de Supabase
```

### Base de datos

Las migraciones en `supabase/migrations/` son la fuente de verdad del esquema — no se edita el esquema a mano desde el panel de Supabase.

```bash
supabase login
supabase link --project-ref <tu-project-ref>
supabase db push        # aplica las migraciones
supabase db seed        # carga los catálogos iniciales (condiciones IVA, estados de cheque, etc.)
```

### Generar tipos de TypeScript desde el esquema real

```bash
export SUPABASE_PROJECT_ID=<tu-project-ref>
npm run gen:types
```

Esto sobrescribe `src/lib/supabase/database.types.ts`. No editar ese archivo a mano.

### Crear el primer usuario admin

Los usuarios se crean primero en Supabase Auth (panel o CLI) y luego necesitan su fila correspondiente en `public.usuarios` con `rol = 'admin'`. Esto se automatiza en el módulo de Usuarios (próxima etapa); por ahora se hace a mano una vez.

### Desarrollo

```bash
npm run dev
```

## Estructura

```
src/
├── app/        # rutas y providers globales
├── core/       # componentes, hooks y theme reutilizables por todos los módulos
├── lib/        # cliente de Supabase y tipos generados
├── modules/    # un directorio por módulo de negocio
└── pages/      # Pantalla Principal (Pendientes)
supabase/
├── migrations/ # esquema versionado (fuente de verdad de la base de datos)
└── seed.sql    # datos iniciales de catálogos
docs/
└── decisiones/ # por qué de cada decisión de arquitectura
```

## Reglas que no se negocian

Ver el brief original y `docs/decisiones/`, pero en resumen:

- Nunca se elimina un cliente/proveedor/producto/empleado — se archiva (`archived_at`).
- Toda escritura queda auditada automáticamente (triggers de PostgreSQL, no lógica de frontend).
- Los cuatro colores de acción son fijos: Guardar (verde), Modificar (amarillo), Cancelar (gris), Archivar (negro) — usar siempre `core/components/Button`, nunca un botón con color propio.
- Todo listado usa `core/components/ListView`; todo formulario, `core/components/FormBlock`.
