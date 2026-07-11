# 0039 — Facturación: IVA por línea de artículo

## Decisión

Cuarto ítem del documento "Mejoras para implementar en ADMIN", el de mayor riesgo arquitectónico de los 5. `facturas.iva` (una tasa para toda la factura) se reemplaza por `factura_items.iva` (una tasa por línea) — permite mezclar Exento, 10,5%, 21% y 27% dentro de la misma factura. Documento completo: `docs/sistemas/iva-por-linea-diseno.md`.

**Migración de datos**: las facturas ya cargadas no pierden información — se copia la tasa que tenía cada factura hacia todas sus líneas antes de sacar la columna vieja (`UPDATE ... FROM facturas`), matemáticamente idéntico a lo que tenían.

**`calcularDesgloseIva()` reemplaza a `calcularNetoEIva()`** — agrupa las líneas por tasa (orden fijo: Exento, 10,5%, 21%, 27%, sin importar el orden de carga) y desarma cada grupo en Neto + IVA. Con una sola tasa en toda la factura (el caso más común), el resultado tiene un solo grupo — se ve exactamente igual que antes. Con varias tasas mezcladas, un grupo por tasa — la forma correcta de discriminar IVA en una factura real.

**Herencia de tasa entre líneas** (decisión aprobada, con el matiz confirmado): una línea nueva hereda la tasa de la línea anterior — para no elegir "21%" varias veces seguidas al cargar artículos iguales. La primera línea de una factura nueva siempre arranca en "Exento".

**Radio de impacto acotado, confirmado antes de programar**: solo 2 archivos leían `factura.iva` en todo el proyecto (`NuevaFactura.tsx`, `FichaFactura.tsx`) — ningún otro módulo (Informes incluido) depende de la tasa de IVA. Se confirmó con una búsqueda completa antes y después de la implementación.

**Lo que no cambió**: la inmutabilidad de las líneas, los 3 flujos de Facturación (ninguno depende de la tasa), el mecanismo de impresión, y cómo Informes suma `factura.total` (sigue siendo el mismo precio final de siempre).

## Por qué

Aplica el documento de diseño ya aprobado, con la herencia de tasa y el detalle de la primera línea confirmados antes de programar.

## Alcance de lo implementado
- Migración `0055`: `factura_items.iva` (nueva, con backfill desde `facturas.iva`), `facturas.iva` eliminada.
- `types.ts`: `calcularDesgloseIva()` (nueva), `TasaIva` ahora deriva de `FacturaItem` en vez de `Factura`, `nuevaLineaVacia(tasaHeredada)`.
- `NuevaFactura.tsx`: selector de IVA por línea (antes, uno solo arriba de todo), resumen con desglose multi-tasa, herencia de tasa al agregar una línea.
- `FichaFactura.tsx`: columna IVA en la tabla de líneas, resumen con desglose multi-tasa.
- `useRegistrarFactura`: `iva` se inserta por línea, no en la cabecera de la factura.

## Alternativas descartadas
- **Mantener `facturas.iva` además de la nueva columna por línea** (por compatibilidad o "por las dudas"): descartado — sería información redundante y potencialmente contradictoria (¿cuál vale si no coinciden?), en contra del criterio de todo el proyecto.
