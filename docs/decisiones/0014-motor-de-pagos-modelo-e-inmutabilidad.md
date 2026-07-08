# 0014 — Motor de Pagos: modelo de datos e inmutabilidad (Sprint 3)

## Decisión

**Modelo de datos:** una tabla `movimientos` con columnas `cliente_id`/`proveedor_id` nullable (cada una con su `FOREIGN KEY` real) en vez de una asociación polimórfica (`entidad_tipo` + `entidad_id` sin FK). Un `CHECK` exige que, según `tipo` (`'cobro' | 'pago'`), esté completa exactamente la columna que corresponde. Conectado en este Sprint únicamente a `clientes` y `proveedores` — `empleado_id`/`contador_item_id` se agregan cuando esos módulos existan, sin migrar filas existentes.

**Inmutabilidad:** un movimiento nunca se edita. Solo se puede anular (`archived_at`, `anulado_por`, `motivo_anulacion` opcional). Se reutiliza el nombre de columna `archived_at` (igual que `clientes`/`proveedores`/`productos`) a propósito: el trigger genérico de auditoría (`registrar_auditoria()`, Fase 0) ya sabe detectar cuándo `archived_at` pasa de `NULL` a una fecha y registrarlo como `accion = 'archive'` en `audit_log` — sin tocar ese trigger ni el `CHECK` de `audit_log.accion`. En la interfaz esto se llama siempre "Anular"/"ANULADO", nunca "Archivar" — es el verbo correcto para dinero, aunque el mecanismo técnico sea el mismo.

**Número interno visible (`MOV-000001`):** columna `numero_interno bigint generated always as identity`, secuencial y única, además del `id` (uuid). Se muestra formateada (`formatearNumeroMovimiento()`) — el `uuid` nunca aparece en ninguna pantalla.

**Preparado, sin implementar todavía:**
- `cheque_id uuid` sin `FOREIGN KEY` (la tabla `cheques` no existe aún).
- `comprobante_path text` sin bucket de Storage todavía (para adjuntar transferencia/recibo/comprobante escaneado más adelante).

## Por qué

**FK reales en vez de asociación polimórfica:** ver el documento de arquitectura (`docs/sistemas/motor-de-pagos-arquitectura.md`, sección 3.1) — es la misma prioridad de integridad referencial que ya se aplicó en toda la Fase 0 (catálogos en vez de strings libres, `CHECK` de formato en la migración `0009`). Cambiar de criterio acá para ahorrar dos columnas hubiera sido inconsistente.

**Reusar `archived_at` en vez de inventar un mecanismo de "anulación" nuevo:** el cliente pidió explícitamente en el punto E de su aprobación "un único sistema de auditoría, no mecanismos paralelos". La forma más directa de cumplir eso es que la anulación use exactamente el mismo mecanismo técnico (una columna `archived_at` que el trigger genérico ya sabe interpretar), y que la diferencia de vocabulario ("Anular" vs "Archivar") quede solo en la capa de interfaz, no en la base de datos.

**`numero_interno` con `GENERATED ALWAYS AS IDENTITY`:** PostgreSQL garantiza unicidad y orden creciente incluso con escrituras concurrentes, sin necesitar lógica propia de la aplicación (nada de "buscar el máximo actual y sumarle 1", que tiene condiciones de carrera). Es la forma más simple y más robusta de lograr "MOV-000001, MOV-000002..." sin construir nada a mano.

## Alternativas descartadas
- **Calcular el número interno en el frontend** (contar filas existentes + 1): descartado por condición de carrera — dos movimientos creados casi al mismo tiempo podrían calcular el mismo número.
- **Un mecanismo de auditoría específico para anulaciones** (ej. una tabla `movimientos_anulaciones`): descartado por el pedido explícito del cliente de no duplicar el sistema de auditoría.
