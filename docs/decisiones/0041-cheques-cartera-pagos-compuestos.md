# 0041 — Cheques como cartera + pagos/cobros compuestos + Transferencia entre cuentas

## Decisión

Reapertura del módulo Cheques y del Motor de Pagos, a partir de dos situaciones reales de uso planteadas por el cliente (un cheque que se recibe, se reparte entre deuda/compra/vuelto, y después se entrega a un proveedor; una clienta que paga con varios cheques cubriendo su propia cuenta y la de otras dos personas). Documento de diseño completo: `docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md`.

### Pieza 1 — Cheques pasa a ser una cartera

Da vuelta la decisión `0040`/`0056`: un cheque se carga **sin cliente**, sin generar ningún cobro automático — queda `en_cartera`. Recién se vincula cuando se lo elige como medio de pago en un cobro o pago real.

**Hallazgo que simplificó el diseño**: `movimientos.cheque_id` ya existía desde la migración **0012** (el primer Sprint del Motor de Pagos), "preparado para cuando exista el módulo Cheques". Los punteros que se habían agregado del lado de `cheques` (`movimiento_cobro_id`/`movimiento_pago_id`, migración 0056) quedaron redundantes y se sacaron — la relación vive en `movimientos.cheque_id`, que admite que un mismo cheque se referencie desde más de un movimiento a lo largo de su vida (el cobro que lo recibe, y más tarde el pago que lo entrega).

**Máquina de estados extendida**: `en_cartera` (nuevo, estado inicial) → `disponible` (usado en un cobro) → `entregado`/`depositado` → `acreditado`/`rechazado` → `anulado`. Un cheque puede ir derecho de `en_cartera` a `entregado` (a un proveedor), sin pasar por ningún cliente — decisión aprobada explícita (punto 5, "misma cartera para Clientes y Proveedores").

**Un cheque nunca se usa dos veces** (decisión aprobada, punto 6): en cuanto se lo elige en un cobro o un pago, cambia de estado automáticamente y deja de aparecer en el selector — no hay ningún mecanismo que pudiera, por error, ofrecerlo dos veces.

### Pieza 2 — Cobros y pagos compuestos

`RegistrarMovimientoDialog` (el componente único, compartido entre Clientes y Proveedores) pasa de un monto único a **varias líneas**, cada una con su propio medio de pago — mismo criterio visual que las líneas de una factura (decisión aprobada, punto 2). Cuando una línea usa "Cheque", el monto no se tipea: se completa solo con el importe del cheque elegido de la cartera — un cheque no se puede usar a medias.

**Bajo riesgo, apoyado en lo que ya existía**: una sola columna nueva, `movimientos.grupo_id` — agrupa las líneas que se cargaron juntas, sin ninguna tabla nueva. Cada línea sigue siendo, por dentro, exactamente el mismo tipo de registro de siempre — `saldos_clientes()`/`saldos_proveedores()` y todo lo que ya lee `movimientos` sigue funcionando sin ningún cambio.

### Pieza 3 — El "vuelto"

No necesitó ninguna pieza nueva — se resuelve con un Ajuste de cuenta corriente (ya existía), con el motivo identificado como corresponde para mantener la trazabilidad (decisión aprobada, punto 3).

### Pieza 4 — Transferencia entre cuentas (la única genuinamente nueva)

Herramienta general (decisión aprobada explícita: "prefiero construir una herramienta general y reutilizable antes que una solución específica"), no acotada al caso de la clienta que paga por otros. Tabla nueva `transferencias_cuenta` (cabecera con origen, destino, importe, fecha, motivo) que, por dentro, genera **dos Ajustes con signo opuesto** — reutiliza el cálculo de saldo que ya existía, sin ninguna lógica nueva en `saldos_clientes()`.

**Pide confirmación explícita antes de ejecutarse** (decisión aprobada, condición explícita del cliente) — mueve saldo entre dos cuentas a la vez, así que el diálogo muestra un resumen claro ("se va a transferir $X de la cuenta de A hacia la cuenta de B") antes de guardar.

**Trazabilidad completa** (pedido explícito: quién transfirió, quién recibió, importe, fecha, usuario, motivo) — quién/cuándo lo captura `registrar_auditoria()`, el mismo trigger de siempre, sin ninguna columna dedicada a esto.

### Corrección a `useAnularMovimiento` (Motor de Pagos)

Al anular un movimiento que tenía un cheque vinculado, el cheque vuelve al estado que le corresponda — a `en_cartera` si no tenía ningún otro uso activo, o de vuelta a `disponible` si se anula un pago pero el cobro que lo recibió sigue en pie. Mismo criterio que ya se usa al anular una factura del Flujo C de Facturación.

## Por qué

Aplica el documento de diseño ya aprobado, con las 6 confirmaciones y el agregado del punto 6 (un cheque nunca se usa dos veces) incorporados antes de programar.

## Alcance de lo implementado
- Migraciones `0058` (Cheques → cartera, conecta `movimientos.cheque_id`), `0059` (`movimientos.grupo_id`), `0060` (`transferencias_cuenta` + `ajustes_cuenta.transferencia_id`).
- `cheques/`: `types.ts`, `validaciones.ts`, `api.ts`, `AltaCheque.tsx`, `FichaCheque.tsx`, `ListadoCheques.tsx` reescritos para la cartera. `SeleccionarChequeDialog.tsx` (nuevo).
- `pagos/`: `types.ts`, `validaciones.ts`, `api.ts`, `RegistrarMovimientoDialog.tsx` reescritos para líneas múltiples — mismo contrato externo (props), así que Clientes/Proveedores/Inicio no necesitaron ningún cambio.
- `cuentaCorriente/`: `TransferenciaDialog.tsx` (nuevo), hooks de transferencia, enlace "+ Transferir a otra cuenta" en `EstadoCuentaCliente.tsx`.
- Sin ninguna migración de estructura para Empleados ni Contador — fuera del alcance de este pedido.

## Alternativas descartadas
- **Una tabla `recibos` propia** para agrupar las líneas de un cobro/pago compuesto: descartada — `movimientos.grupo_id` (una columna, sin FK a ningún lado) alcanza para agrupar visualmente, sin construir una pieza nueva ni arriesgar todo lo que ya lee `movimientos`.
- **Transferencia acotada solo al caso de "pagar en nombre de otro cliente en el mismo cobro"**: descartada explícitamente por el cliente en favor de la herramienta general.
