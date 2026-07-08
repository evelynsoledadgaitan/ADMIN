# 0001 — Arquitectura general

## Decisión
React + TypeScript + Vite en el frontend. Supabase (PostgreSQL + Auth + Storage) como backend. Tailwind + shadcn/ui para estilos. Despliegue en Vercel. Repositorio en GitHub.

Organización interna en tres capas dentro de `src/`:
- **`core/`** — todo lo reutilizable por cualquier módulo (componentes, hooks, theming). Ningún módulo debe reimplementar algo que ya existe acá.
- **`modules/`** — un directorio por módulo de negocio (`clientes/`, `proveedores/`, etc.), cada uno con su propia API, tipos y componentes específicos.
- **`app/`** — configuración transversal: rutas, providers globales.

## Por qué
Este stack fue definido por el cliente en el brief original y fue evaluado como correcto para el tipo de proyecto: prioriza velocidad de desarrollo con un backend gestionado, sin sacrificar control sobre el modelo de datos (Supabase expone PostgreSQL real, no una base propietaria).

La separación `core` / `modules` existe por un motivo concreto pedido en el brief: *"toda la aplicación debe sentirse uniforme… si existen dos maneras de resolver un problema, se elige la más simple"*. Si cada módulo pudiera construir su propia lista, su propio formulario o su propio botón, la uniformidad dependería de la disciplina de quien programe cada módulo. Poniendo esos elementos en `core/` y haciendo que los módulos los consuman, la uniformidad queda garantizada por la arquitectura, no por buena voluntad.

## Alternativas descartadas
- **Un directorio por tipo de archivo** (`components/`, `hooks/`, `pages/` todos juntos, sin separar por módulo de negocio): descartado porque con 10 módulos de negocio ya definidos, esta organización se vuelve difícil de navegar rápidamente pasado cierto tamaño.
- **Monorepo con paquetes separados** (`packages/core`, `packages/app`): es una complejidad que no se justifica para una sola aplicación con un solo equipo. Se puede migrar a esto más adelante si hiciera falta, sin reescribir la lógica de negocio.
