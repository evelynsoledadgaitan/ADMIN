# 0022 — Etapa 3: DataTable, Restaurar y refinamientos finales

## Decisión

**`DataTable`** (`core/components/DataTable.tsx`) es un componente nuevo y paralelo a `ListView`, no un reemplazo — cada uno resuelve su dispositivo (celular sigue con `ListView` sin cambios; escritorio ≥1024px usa `DataTable`). Ambos operan sobre los mismos datos ya cargados por los hooks de cada módulo (`useClientes()`, etc.) — ninguno dispara una consulta propia a Supabase. Búsqueda, orden por columna y paginación son, los tres, presentación pura sobre un array ya en memoria.

**`useRestaurar`** (`core/hooks/useRestaurar.ts`) es la única pieza de esta etapa que toca algo más que la interfaz — es la contracara de `useArchivable` (pone `archived_at` de vuelta en `NULL`). No requirió ninguna migración ni política de RLS nueva: la que ya autorizaba "archivar" es un `UPDATE` sobre la misma columna en cualquier dirección.

**`EstadoFiltroTabs`** (Activos/Archivados) es el mismo componente en `ListView` y `DataTable` — restaurar un registro no es una capacidad exclusiva de escritorio.

## Las 5 mejoras pedidas antes de programar

1. **Total y filtrados**: el pie de `DataTable` distingue "Mostrando X–Y de Z" de "(de N en total)" cuando la búsqueda achica el resultado — sin eso, un usuario que busca y ve "3 de 3" no sabe si existen más clientes fuera de esa búsqueda.
2. **Filas por página**: selector con las 4 opciones pedidas (10/20/50/100), primera opción como default.
3. **Tooltips**: componente `Tooltip` nuevo (Radix, mismo patrón que `Dialog`/`Select`), usado en cada ícono de acción por fila.
4. **Preparado para columnas configurables / acciones masivas / exportación**: documentado como comentario en el propio archivo de `DataTable.tsx`, con el punto de extensión concreto para cada una (no como props sin usar — un prop que no hace nada todavía es peor API que un comentario que explica dónde enganchar la función el día que se necesite).
5. **Formularios a 2 columnas máximo**: `FormBlock` ahora acepta `columnas={2}` (`md:grid-cols-2`, celular siempre quedó en 1 columna). Se aplicó a los bloques con más de 2 campos relacionados (Facturación en Clientes, Datos del proveedor, Datos del producto) — nunca a bloques de un solo campo, ahí no aporta nada. El contenido de cada formulario además quedó acotado a un ancho máximo centrado (`max-w-2xl`) en escritorio, para que 2 columnas no se estiren de punta a punta de una pantalla ancha.

## Por qué

**Un componente nuevo en vez de extender `ListView`**: `ListView` ya resuelve bien su problema (celular) con una API simple. Sumarle búsqueda+filtros+orden+paginación+acciones+tooltips lo hubiera convertido en dos componentes disfrazados de uno, con ramas condicionales por todos lados según el ancho de pantalla. Separarlos es más código en total, pero cada uno se entiende solo, y es exactamente lo que pediste en el punto 4 de la propuesta ("no una única interfaz estirada").

**Extensibilidad documentada, no implementada como props muertas**: agregar `accionesMasivas?: never` o `onExportar?: never` a la interfaz de `DataTable` da la sensación de una función a medio construir sin dar ningún valor real hoy. Un comentario que dice exactamente qué agregar y dónde cumple el pedido ("diseñado pensando en...") sin ensuciar la API pública del componente con algo que nadie puede usar todavía.

## Alcance real de esta etapa
Aplicado a los 3 módulos que ya son funcionales: Clientes, Proveedores, Productos. Empleados, Cheques, Notas, Contador e Informes siguen siendo la pantalla vacía del esqueleto (Sprint 1) — no tienen datos ni columnas que mostrar en una tabla todavía. Cuando a cada uno le toque su Sprint de desarrollo, va a nacer directamente usando `DataTable`/`ListView` desde el primer día — no va a hacer falta un "Sprint de migración" aparte para ellos.
