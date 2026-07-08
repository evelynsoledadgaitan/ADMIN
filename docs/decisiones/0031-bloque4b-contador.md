# 0031 — Bloque 4B: Contador

## Decisión

Contador organiza vencimientos, honorarios, impuestos y documentación — sin ningún cálculo automático de impuestos, sin liquidación, sin integración con ARCA (extiende la decisión `0025`). Autocontenido, mismo criterio que Empleados: no se integra con ningún otro módulo.

**Lenguaje visible: "Vencimiento", no "Obligación"** (decisión aprobada) — el nombre técnico de la tabla (`obligaciones_contador`) no cambió, mismo criterio que "Compra"/"Ingreso de mercadería".

**Estado calculado, nunca guardado**, con un cuarto estado explícito pedido para tener su propio color: **Pagado / Vencido / Próximo a vencer / Pendiente** — se recalcula siempre comparando fechas contra hoy, sin ningún trigger (más simple todavía que el de Facturación, que necesitaba comparar dos columnas nulificables a la vez). El umbral de "Próximo a vencer" es de 7 días, propuesto y sin objeción.

**Colores de estado protagonistas** (decisión aprobada) — `EstadoVencimientoBadge` es deliberadamente más grande y con ícono que otras insignias del sistema (ej. la de Facturación): acá el color es la información principal de un vistazo, no un detalle secundario.

**Honorarios distinguidos de Impuestos por ícono, no por color** — los colores ya están ocupados por el estado (que es lo que se pidió priorizar), así que la distinción de tipo usa un ícono distinto (`TipoObligacionIcono`) en vez de competir por el mismo canal visual.

**Dos tablas**, mismo criterio que Empleados: `obligaciones_contador` (el core, con su comprobante de pago opcional) y `documentos_contador` (documentación general, no atada a un vencimiento puntual — varios archivos a la vez, mismo patrón que `documentos_empleados`).

**"Marcar como pagado" es la única edición** que admite un vencimiento después de creado — mismo criterio que el número real de ARCA en Facturación. El resto es inmutable, solo se anula.

**Selector de cobros/documentos sin límite de tiempo** (mismo criterio ya usado en Facturación) — el selector de documentos generales y el listado de vencimientos no ocultan nada por antigüedad, con buscador para cuando la lista crezca.

**Segunda fuente de "Pendientes" en Inicio**: vencidos + próximos a vencer, misma tarjeta que Facturación, ahora la sección soporta más de una fuente a la vez.

## Por qué

Es la aplicación del documento de diseño ya aprobado (`docs/sistemas/bloque4b-contador-diseno.md`), con los 6 ajustes de lenguaje y experiencia incorporados antes de programar.

## Alcance de lo implementado
- Migraciones `0047` (`obligaciones_contador`, `documentos_contador`), `0048` (RLS + prefijo `contador` en Storage).
- `src/modules/contador/`: tipos, validaciones, hooks, `Contador` (pantalla con pestañas Vencimientos/Documentación), `FichaVencimiento`, diálogos de alta, `EstadoVencimientoBadge`, `TipoObligacionIcono`.
- `HistorialAuditoria` extendido para aceptar `obligaciones_contador`.
- Pendientes en Inicio: rediseñado para soportar múltiples fuentes a la vez (antes solo Facturación).

## Alternativas descartadas
- **Umbral de "próximo a vencer" distinto a 7 días**: se propuso y no hubo objeción — queda como el valor por defecto, ajustable en una constante de una línea (`DIAS_PROXIMO_A_VENCER`, `types.ts`) si el uso real pide otro número.
