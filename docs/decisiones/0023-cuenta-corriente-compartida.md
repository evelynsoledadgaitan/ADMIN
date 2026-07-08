# 0023 — Cuenta Corriente compartida: tablas gemelas, Ajustes único

## Decisión

**Deudas de Clientes** (`deudas_clientes`) y **Compras de Proveedores** (`compras`, ya existente) son tablas **gemelas, no fusionadas** — mismo patrón (inmutable, solo se anula, número interno visible, comprobante reservado), cada una con el campo propio que su negocio necesita (`origen` en Deudas, sin equivalente en Compras). Misma decisión que ya se tomó con `movimientos` en el Sprint 3: preferir columnas específicas por entidad con integridad referencial real, sobre una tabla polimórfica.

**Ajustes** (`ajustes_cuenta`) es la única tabla genuinamente compartida entre los dos módulos — mismo patrón que `movimientos` (columnas `cliente_id`/`proveedor_id` nullable con `CHECK` de que solo una esté completa). No hay ninguna diferencia de negocio entre ajustar el saldo de un cliente o el de un proveedor, así que acá sí se comparte la tabla, los hooks y los dos componentes de interfaz (`RegistrarAjusteDialog`, `ListaAjustes`).

**Origen de la deuda de Clientes** (decisión 6.1, ya no pospuesta): el usuario elige entre Cuenta del mes, Venta, Factura u Otro al registrar una deuda — un `CHECK` de 4 valores fijos, no un catálogo editable (no se espera que el usuario amplíe esta lista). Esto reemplaza/completa la decisión `0020`, que dejaba pendiente definir el origen — ya no es una pregunta abierta.

**Permiso "ajustes"** (decisión 6.4): se amplió el `CHECK` de `permisos.modulo` para incluir `'ajustes'` como un permiso independiente de Clientes/Proveedores/Modificar — es una excepción deliberada al criterio "sin módulos de permiso nuevos" que rigió el resto del proyecto, justificada porque un ajuste es una intervención discrecional sobre el saldo sin un hecho comercial verificable detrás. No es un módulo nuevo en el Menú ni una ruta nueva — solo una fila más de permiso que un admin puede asignar.

**Saldo**: `saldo_cliente()` (nueva) es la función gemela de `saldo_proveedor()` (actualizada para sumar ajustes) — mismo criterio exacto de las dos: `stable`, sin `security definer`, nunca persistido. Se evaluó una función genérica parametrizada por tabla y se descartó — requeriría SQL dinámico, que cambia el perfil de seguridad de la función sin necesidad real.

## Por qué

Es la aplicación directa de lo que ya se aprobó en el documento de arquitectura (`docs/sistemas/cuenta-corriente-arquitectura-compartida.md`): compartir poco en la base de datos (donde la integridad referencial importa más que ahorrar líneas de esquema) y compartir mucho en el frontend (donde la duplicación de lógica de UI, validación y estados de carga/error sí es cara de mantener). El resultado: Clientes y Proveedores siguen siendo, para el usuario, dos módulos completamente independientes con su propio lenguaje ("Registrar deuda" vs. "Registrar compra") — pero "Registrar ajuste" es literalmente el mismo botón, el mismo diálogo y el mismo código en los dos.

## Terminología (decisión 6.2)
La interfaz nunca dice "cargo" — dice "deuda" en Clientes y "compra" en Proveedores. "Cargo" es un término interno de la documentación de arquitectura, no aparece en ninguna pantalla.

## Alcance de lo implementado
- Migraciones `0023` a `0027`: `deudas_clientes`, `ajustes_cuenta`, permiso `ajustes`, `saldo_cliente()` + actualización de `saldo_proveedor()`, RLS de las dos tablas nuevas.
- `src/modules/cuentaCorriente/`: tipos, validaciones, hooks y los 2 componentes de Ajustes, compartidos.
- `src/modules/clientes/`: `RegistrarDeudaDialog`, `ListaDeudas`, hooks de Deuda — gemelos de los de Compras en Proveedores.
- Estado de cuenta de Clientes: ahora tiene Saldo, Deudas, Pagos, Ajustes y Actividad (antes solo Pagos + Actividad, sin saldo — decisión `0020` superada).
- Estado de cuenta de Proveedores: se sumó la sección de Ajustes (Saldo, Compras, Pagos y Actividad ya existían desde el Sprint 4).
- Ficha de Cliente: se sumó un resumen de Saldo, y el botón pasó a llamarse "Estado de cuenta" (antes "Ver estado de cuenta") — mismo texto que ya usaba Proveedores, por consistencia.

## Alternativas descartadas
- **Tabla polimórfica única para deudas + compras**: descartada por la misma razón que ya se descartó para `movimientos` en el Sprint 3 — pierde integridad referencial real.
- **Función SQL de saldo genérica parametrizada por tabla**: descartada por requerir SQL dinámico, con peor perfil de seguridad que dos funciones cortas y explícitas.
- **Permiso de ajustes heredado de Clientes/Proveedores** (sin permiso propio): era la opción original del documento de arquitectura, descartada explícitamente por el cliente a favor de un permiso independiente, dado que es una operación sensible.
