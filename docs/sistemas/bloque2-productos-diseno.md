# Bloque 2 — Productos: categorías e importación (revisado)

Documento de diseño. No incluye implementación. Reemplaza a la versión anterior — **costo, margen y precio sugerido quedaron fuera del alcance**, por decisión explícita: Productos se mantiene exclusivamente orientado a la administración de la lista de precios.

---

## 0. Ya construido — no hace falta programar nada

| Pedido original | Estado real |
|---|---|
| Vista previa antes de confirmar (nuevos/actualizados/errores) | ✅ Ya existe desde el Sprint 5 |
| Buscar por nombre y por código de barras | ✅ Ya existe desde la Etapa 3 del rediseño |

---

## 1. Administración de categorías

Hoy `categorias_productos` es un catálogo mínimo (`id`, `nombre`) que se completa al vuelo desde el formulario de producto ("+ Nueva categoría") — nunca se edita ni se archiva.

**Cambios a la tabla:** sumar `archived_at`, `created_at`, `updated_at` y el trigger de auditoría genérico — mismo patrón que cualquier otra entidad archivable del sistema.

**Pantalla nueva:** listado con pestañas Activos/Archivados, alta, edición (solo el nombre), archivar/restaurar — reutiliza `EstadoFiltroTabs`, `useArchivable`, `useRestaurar` tal cual están, sin construir nada nuevo en esa parte.

**Dónde vive:** como Configuración todavía no es un módulo real (eso es el Bloque 5), propongo que esta pantalla viva dentro de Productos — un enlace "Administrar categorías" desde el listado. Cuando llegue el Bloque 5, Configuración simplemente enlaza hacia acá, sin reconstruir nada. **¿De acuerdo con esto?**

**Productos con categoría archivada:** siguen funcionando con total normalidad — la categoría archivada deja de aparecer como opción al crear/editar otro producto, nada más.

---

## 2. Importación con Excel (.xlsx)

Se suma la librería `xlsx` (SheetJS) para leer archivos `.xlsx`, con la misma lógica de detección de columnas por nombre que ya tiene el CSV — un único punto de reconocimiento de columnas (`codigo_barras`, `nombre`, `precio` y sus alias) compartido entre los dos formatos, para no duplicar esa lógica. El usuario elige cualquiera de los dos desde el mismo selector de archivo, sin ningún paso adicional.

---

## 3. Mejoras a la importación/actualización existente

Acá necesito que me digas algo más concreto — "mantener y mejorar las funciones ya existentes" puede significar cosas bastante distintas y no quiero adivinar. Algunas cosas puntuales que podrían entrar acá, a modo de ejemplo, para que elijas o me digas otra:

- ¿Algún caso real que te haya fallado o resultado confuso al importar una lista hasta ahora?
- ¿Mejor manejo de columnas con formatos de precio raros (con separador de miles, con "$", con coma en vez de punto)?
- ¿Un resumen más claro de qué cambió exactamente en cada producto actualizado (por ejemplo, mostrar precio anterior → precio nuevo en la vista previa, no solo el conteo total)?
- ¿Algo de la pantalla de Productos en sí (el listado, la Ficha) que sientas incompleto, más allá de la importación?

Decime cuáles de estos (o cuál otra cosa que tenías en mente) forman parte de este punto, y lo sumo al diseño antes de programar.

---

## 4. Resumen de migraciones necesarias

| # | Contenido |
|---|---|
| Nueva | `categorias_productos`: agregar `archived_at`/`created_at`/`updated_at` + trigger de auditoría + RLS de archivar (hereda permiso `productos`) |

Una sola migración nueva — mucho más chico que la versión anterior del bloque.

---

## 5. Lo que necesito antes de programar

1. Confirmar que la administración de categorías viva dentro de Productos por ahora (sección 1).
2. Qué significa concretamente "mejorar las funciones ya existentes" (sección 3) — con ejemplos para elegir o contame la tuya.
