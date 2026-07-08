# 0035 — Notas (cierre del roadmap funcional de ADMIN v1.0)

## Decisión

Notas es el módulo más simple de ADMIN — anotador rápido para el trabajo diario, sin categorías, prioridades, etiquetas, colores, usuarios asignados, subtareas, comentarios ni adjuntos (todo explícitamente descartado). Con este módulo cerrado, el roadmap funcional original de ADMIN v1.0 queda completo.

**Primera y única excepción a la inmutabilidad de todo el sistema** (decisión aprobada, punto 1): una nota se edita directamente — título, descripción, fecha, recordatorio — sin anular ni recrear. Esta excepción aplica exclusivamente a Notas; el resto de los módulos sigue exactamente igual. Por esa misma razón, la tabla no tiene `anulado_por` ni `motivo_anulacion` — archivar sigue siendo una acción simple (mismo comportamiento que `useArchivable` ya tenía, sin exigir motivo).

**Un único diálogo para crear y editar** (decisión aprobada, punto 2) — sin Ficha independiente. `NotaDialog` recibe `nota: Nota | null`: `null` es alta, una nota es edición, mismo componente para las dos.

**Recordatorios como tercera fuente de "Pendientes" en Inicio** (decisión aprobada, punto 3), junto a Facturación y Contador — con un matiz resuelto en la implementación: si hay exactamente una nota con recordatorio pendiente, la tarjeta lleva directo a esa nota (`/notas?abrir=ID`, sin necesitar una Ficha propia — el listado lee ese parámetro y abre el diálogo de edición solo); si hay más de una, no hay ninguna "correspondiente" única, así que lleva al listado general.

**Notas realizadas permanecen visibles, tachadas** (decisión aprobada, punto 4) — un checkbox por fila, independiente de archivar.

**Búsqueda por título y descripción únicamente** (decisión aprobada, punto 5) — sin filtros adicionales.

**Una sola vista de lista para cualquier tamaño de pantalla**, sin duplicar en una tabla de escritorio aparte — mismo criterio de simplicidad que ya se aplicó al libro contable y a los informes; para un anotador rápido, una tabla con columnas hubiera sido la complejidad que se pidió evitar.

**Se evaluó sumar "Actividad" (auditoría) y se dejó afuera a propósito** — es gratis técnicamente (el trigger ya existe), pero hubiera significado agregar una sección a un módulo pensado para ser mínimo, sin que se haya pedido.

## Por qué

Aplica el documento de diseño ya aprobado (`docs/sistemas/notas-diseno.md`), con las 6 confirmaciones incorporadas antes de programar.

## Alcance de lo implementado
- Migraciones `0052` (`notas`), `0053` (RLS).
- `src/modules/notas/`: `types.ts`, `validaciones.ts`, `api.ts`, `NotaDialog`, `ListadoNotas`.
- `useArchivable`/`useRestaurar` extendidos para `notas`.
- Pendientes en Inicio: tercera fuente sumada (Notas), con el caso especial de "una sola nota pendiente abre directo".

## Ajuste — "Nueva nota" como acceso rápido en Inicio

Pedido después de la primera entrega: crear una nota directo desde Inicio, sin pasar por el listado. A diferencia de los otros 5 accesos rápidos (todos empiezan eligiendo un cliente o proveedor), Notas no tiene ninguna entidad que elegir — se abre el mismo `NotaDialog` de siempre, directo, sin selector previo. `entidadTipo` pasó a ser opcional en `AccionRapida` para que este acceso pudiera sumarse sin duplicar la estructura de los demás.

Sobre el segundo pedido de ese mismo mensaje ("que aparezca hasta resolverla como recordatorio/tarea pendiente"): ya funcionaba así desde la entrega original — la consulta de Pendientes usa `recordatorio <= hoy`, no `recordatorio = hoy`, así que una vez que el recordatorio vence, la nota sigue apareciendo todos los días hasta marcarla como realizada. No hizo falta ningún cambio ahí, solo confirmarlo.

## Estado del roadmap
Con Notas cerrado, el desarrollo funcional de ADMIN v1.0 queda completo — el único pendiente explícito que queda es el alta de usuarios con PIN, pospuesta a pedido del cliente para el final, después de la puesta en producción.
