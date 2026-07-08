# 0017 — Saldo de Proveedores: función de base de datos, sin asignación de pagos (Sprint 4)

## Decisión
`saldo_proveedor(uuid)` es una función SQL (`stable`, sin `security definer`) que calcula `SUM(compras activas) − SUM(pagos activos)` en cada consulta. No existe ninguna columna de saldo en ninguna tabla. No existe ninguna relación entre un pago puntual y una compra puntual — un pago reduce el saldo general del proveedor, no una factura específica.

## Por qué

**Función en vez de columna:** confirma exactamente el límite que se definió en el Sprint 3 ("Motor de Pagos → registra hechos, Cuenta Corriente → interpreta esos hechos") — acá, por primera vez, un módulo (Proveedores) hace ese trabajo de interpretación, y lo hace sin guardar ningún número derivado. Si se guardara un saldo en una columna, cada `INSERT`/anulación de una compra o un pago necesitaría además actualizar esa columna — una sincronización manual que es, en sí misma, una fuente de bugs (¿y si la actualización falla después de guardar el movimiento? ¿y si alguien corrige un dato directo en la base?). Con una función, el número siempre sale de los hechos reales, así que no puede desincronizarse — es la misma razón por la que la auditoría se resuelve con triggers en vez de lógica de frontend (Fase 0).

**Sin `security definer`:** para que las políticas de RLS de `compras` y `movimientos` se apliquen también dentro de la función — nadie puede ver, a través de `saldo_proveedor()`, un número calculado a partir de datos que no podría consultar directamente.

**Sin asignación de pagos a compras específicas:** decisión explícita del cliente — "el usuario necesita conocer cuánto debe a un proveedor, no necesita administrar la imputación de cada pago a cada factura". Es una elección consciente de simplicidad sobre precisión contable formal: ADMIN informa un saldo general, no un libro de cuentas por pagar con antigüedad de saldos por factura. Si esa necesidad aparece en el futuro, el cliente ya adelantó que sería una evolución del sistema, no parte del núcleo — es decir, algo que se construye *sobre* este modelo (agregando una tabla de asignación), no algo que reemplace lo que existe.

## Alternativas descartadas
- **Trigger que mantenga una columna `saldo` actualizada en `proveedores`**: descartado por las razones de sincronización mencionadas arriba, y porque el cliente pidió explícitamente no almacenar saldos calculados.
- **Tabla de asignación pago↔compra** (cuentas por pagar con imputación): descartada explícitamente por el cliente para esta versión — queda documentada acá como la evolución posible si algún día hace falta, para no tener que redescubrir la decisión.
