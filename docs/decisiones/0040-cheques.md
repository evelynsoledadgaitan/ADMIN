# 0040 — Módulo Cheques (completo)

## Decisión

Quinto y último ítem del documento "Mejoras para implementar en ADMIN" — con esto se completa la lista entera. Documento de diseño completo: `docs/sistemas/cheques-diseno.md`.

**Decisión central (aprobada explícita): Cheques se apoya en el Motor de Pagos, no es una cuenta corriente paralela.** Recibir un cheque de un cliente genera un cobro normal (`movimientos`, medio de pago "Cheque" — ya estaba en el catálogo desde la Fase 0, sin conectar a nada hasta ahora); entregarlo a un proveedor genera un pago normal. La tabla `cheques` guarda los datos específicos (banco, número, titular, fechas, estado, foto) y se vincula a esos movimientos vía `movimiento_cobro_id`/`movimiento_pago_id` — mismo mecanismo que `facturas.movimiento_id` (Flujo B de Facturación).

**`estado` es un campo real que se guarda** — primera excepción justificada a "nunca persistir lo que se puede calcular": que un banco acredite o rechace un cheque es información externa, no derivable de nada que ADMIN ya sepa.

**Sin `archived_at`**: "Anulado" es uno de los 6 estados (Disponible/Entregado/Depositado/Acreditado/Rechazado/Anulado), siempre visible en su propia pestaña de filtro — a diferencia del patrón Activos/Archivados que usa el resto del sistema.

**Historial automático sin ninguna tabla nueva**: reutiliza `registrar_auditoria()` + `HistorialAuditoria`, el mismo mecanismo que ya usan Clientes/Proveedores/Empleados/Contador.

**Foto del frente opcional** (decisión aprobada) — se puede cargar en el alta o sumar después desde la Ficha.

**Vencimientos**: una sola tarjeta de "Próximo a vencer" en Pendientes de Inicio (7 días, mismo umbral que Contador) — decisión aprobada explícita, en vez de 3 tramos separados (ADMIN no tiene ningún sistema de notificaciones push/email, nunca lo tuvo).

**Rechazo simétrico** (decisión aprobada, extendida a los dos sentidos): si un cheque se rechaza estando "Depositado", se anula el cobro original (la deuda del cliente vuelve); si se rechaza estando "Entregado", se anula el pago al proveedor. Mismo criterio en los dos casos — se anula el movimiento que había asumido que el cheque era plata real. La confirmación explícita del cliente cubrió el segundo caso (entregado→rechazado); el primero (depositado→rechazado) se extendió por el mismo principio y queda documentado acá para que se revise si no era la intención.

**Trazabilidad de "Entregar a un proveedor"** (pedido explícito): la Ficha del cheque muestra a qué proveedor se entregó y un enlace directo a su Estado de Cuenta, donde se ve el pago generado.

**Depositar no genera ningún movimiento nuevo** (decisión aprobada explícita) — el ingreso ya se registró al recibir el cheque; depositar solo cambia el estado (Disponible → Depositado).

## Por qué

Aplica el documento de diseño ya aprobado, con las 4 confirmaciones y los 2 comportamientos adicionales incorporados antes de programar.

## Alcance de lo implementado
- Migraciones `0056` (tabla `cheques`), `0057` (RLS + prefijo `cheques` en Storage).
- `src/modules/cheques/`: `types.ts`, `validaciones.ts`, `api.ts` (alta con cobro automático, depositar, marcar acreditado/rechazado, entregar a proveedor con pago automático, anular), `EstadoChequeBadge`, `ListadoCheques` (7 pestañas), `AltaCheque`, `FichaCheque`.
- `HistorialAuditoria` extendido para aceptar `cheques`.
- Quinta y última fuente de "Pendientes" en Inicio.

## Alternativas descartadas
- **Cheques como cuenta corriente independiente**: descartada explícitamente por el cliente — hubiera duplicado la lógica de saldos ya construida y probada en Clientes/Proveedores.
- **3 tramos de aviso de vencimiento** (7/3/día): descartados a favor de un solo umbral — sin infraestructura de notificaciones, los 3 tramos no aportarían nada que la tarjeta única no muestre ya.

## Estado del roadmap

Con Cheques cerrado, **se completan los 5 ítems del documento "Mejoras para implementar en ADMIN"** (Facturación: tercer flujo → Siempre factura → Informes → IVA por línea → Cheques). Queda pendiente, tal como se definió en su momento: las Etapas 2 y 3 de la revisión integral (consistencia/UX y rendimiento, pospuestas cuando llegó este documento de mejoras), y al final de todo, el alta de usuarios con PIN.
