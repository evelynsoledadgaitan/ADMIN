# 0037 — Clientes "Siempre factura": tareas pendientes de facturación

## Decisión

Segundo ítem del documento "Mejoras para implementar en ADMIN" (orden acordado con el cliente). Ninguna tarea pendiente se guarda en ninguna tabla nueva — se deriva en el momento, cruzando `deudas_clientes` (sin `factura_id`, sin `archived_at`) con `clientes.factura_config = 'siempre'`. Documento completo: `docs/sistemas/siempre-factura-diseno.md`.

**Corrección previa necesaria, al Flujo C de Facturación** (decisión aprobada explícita): anular una factura distingue ahora de dónde vino el vínculo con la deuda, mirando `origen`:
- `origen = 'factura'` (Flujo A, la deuda nació con la factura) → se anula también, sin cambios respecto a como funcionaba.
- Cualquier otro origen (Flujo C, la deuda ya existía y solo se vinculó) → no se anula, se le limpia `factura_id` — vuelve a estar "sin factura" y disponible para facturarse de nuevo.

**Ubicación de la lista completa — cambiada durante la aprobación**: la propuesta original la ubicaba dentro de Informes; el cliente pidió explícitamente que no — "las tareas pendientes pertenecen al trabajo diario, no al análisis". Se resolvió con una pantalla propia en Facturación (`PendientesFacturar`, ruta `/facturacion/pendientes`), no dentro de Informes.

**`TablaSimple` promovida de Informes a `core/components/`** — antes se llamaba `TablaInforme` y vivía en `modules/informes/`; ahora la usa también Facturación, así que se movió a un lugar compartido en vez de hacer que un módulo dependiera de otro por un componente de presentación genérico. Sin cambios de comportamiento, solo de ubicación — los 5 informes que ya la usaban (Clientes, Proveedores, Facturación, Empleados, Contador) se actualizaron para importarla del nuevo lugar.

**Cuarta fuente de "Pendientes" en Inicio**: con una sola deuda pendiente, la tarjeta lleva directo a Nueva Factura con esa deuda ya elegida (Flujo C) — mismo patrón "uno solo = directo, más de uno = al listado" que ya usan Notas y Facturación.

**Indicador en la Ficha del cliente**: solo visible para clientes "Siempre factura" con algo pendiente — reutiliza `useDeudasCliente` (ya existía) filtrado en el cliente, sin ninguna consulta nueva dedicada a esto.

## Por qué

Aplica el documento de diseño ya aprobado, con la corrección al Flujo C y el cambio de ubicación de la lista incorporados antes de programar.

## Alcance de lo implementado
- `useAnularFactura` corregido (distingue Flujo A de Flujo C).
- `useDeudasPendientesFacturarSiempreFactura()`, `useDeuda(id)` (nuevas, ambas de solo lectura).
- `PendientesFacturar.tsx` (pantalla nueva en Facturación) + ruta `/facturacion/pendientes`.
- `TablaSimple` movida de `modules/informes/TablaInforme.tsx` a `core/components/TablaSimple.tsx`.
- `NuevaFactura.tsx` acepta `?deuda=ID` — preselecciona el Flujo C solo.
- Cuarta fuente de Pendientes en Inicio.
- Indicador en `FichaCliente.tsx`.
- Sin ninguna migración — cero cambios de estructura de base de datos.

## Alternativas descartadas
- **Guardar la tarea pendiente como una fila propia** (con su propio estado "resuelta"/"pendiente"): descartado explícitamente por el cliente — preferible derivar siempre desde `factura_id`, sin duplicar información.
- **Mostrar la lista completa en Informes**: descartado explícitamente durante la aprobación — Informes queda reservado para consulta y análisis, las tareas pendientes son trabajo operativo del día.
