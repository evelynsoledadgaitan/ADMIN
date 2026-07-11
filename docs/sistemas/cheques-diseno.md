# Cheques: diseño funcional y técnico

Documento de diseño. No incluye implementación. Quinto y último ítem del documento "Mejoras para implementar en ADMIN" — el más grande de los 5, con la misma profundidad de diseño que Empleados o Contador en su momento.

---

## La decisión de arquitectura central — necesito que la confirmes antes de todo

Un cheque de terceros, en tu operatoria, tiene dos momentos financieros reales:
1. **Lo recibís** de un cliente, como forma de pago — eso ya reduce lo que te debe, exactamente igual que si te hubiera pagado en efectivo o transferencia.
2. **Después, o lo depositás vos** (se convierte en dinero en tu cuenta), **o se lo entregás a un proveedor** como forma de pago — eso reduce lo que vos le debés a él.

Los dos momentos son, ni más ni menos, **un cobro y un pago** — exactamente lo que ya hace el Motor de Pagos hoy para efectivo, transferencia o tarjeta. `"Cheque"` ya existe como medio de pago en el catálogo desde la Fase 0, sin conectar a nada específico todavía.

**Mi propuesta**: Cheques no es un módulo financiero paralelo — es una capa de **datos específicos** (banco, número, titular, fechas, estado, foto, historial) que se **apoya** en el Motor de Pagos que ya existe, en vez de duplicarlo:

- Recibir un cheque de un cliente = un cobro normal (Motor de Pagos, medio de pago "Cheque") — reduce su saldo, como cualquier cobro.
- Entregar ese cheque a un proveedor = un pago normal (Motor de Pagos) — reduce lo que le debés, como cualquier pago.
- La tabla nueva de Cheques guarda los datos específicos y **se vincula** a esos movimientos (mismo mecanismo que ya construimos para "Es el comprobante de un cobro ya registrado" en Facturación) — no inventa una segunda cuenta corriente paralela.

Con esto, "vincular automáticamente con una factura o una deuda" (tu pedido original) sale gratis: el cobro que generó el cheque ya puede estar vinculado a una factura (Flujo B, ya construido) o simplemente reducir una deuda existente, como cualquier cobro.

**¿Coincidís con este enfoque?** Es la decisión más importante de todo el diseño — si preferís que Cheques sea independiente de la cuenta corriente (una cartera separada, sin tocar saldos), el diseño completo cambia bastante y prefiero que lo definas ahora, no a mitad de la implementación.

---

## 1. ¿Qué reutiliza de lo que ya existe?

- **Motor de Pagos** (`movimientos`, medio de pago "Cheque" ya cargado) — para el cobro al recibirlo y el pago al entregarlo, si aplica.
- **`ArchivoAdjunto`/`VisorAdjunto`** — para la foto del frente (nunca del dorso, como pediste).
- **`registrar_auditoria()` + `HistorialAuditoria`** — el "historial automático" que pediste (Creado, Depositado, Acreditado...) no necesita ninguna tabla nueva: es el mismo trigger de auditoría que ya usan Clientes, Proveedores, Empleados y Contador, aplicado a la tabla de Cheques. Cada cambio de estado ya queda registrado, con quién y cuándo, sin construir nada aparte.
- **El patrón "Pendientes" en Inicio** — cheques próximos a vencer, quinta fuente, mismo mecanismo que Contador.
- **`DataTable`/`ListView`, `EstadoFiltroTabs`** (adaptado — ver más abajo), `SelectorEntidadDialog`.

## 2. ¿Qué tablas nuevas necesita?

Una sola: `cheques`.

```
banco, numero, importe, titular, cuit (opcional),
fecha_emision, fecha_vencimiento,
estado ('disponible' | 'entregado' | 'depositado' | 'acreditado' | 'rechazado' | 'anulado'),
observaciones (opcional),
comprobante_path (foto del frente, opcional — mismo criterio que el resto de los adjuntos del sistema),

cliente_id (de quién se recibió),
proveedor_id (a quién se entregó, si corresponde — vacío hasta que pase),
movimiento_cobro_id (el cobro que registra la recepción — Motor de Pagos),
movimiento_pago_id (el pago que registra la entrega a un proveedor, si corresponde)
```

**`estado` es un campo real que se guarda** — a diferencia de otros lugares de ADMIN donde el estado se calcula solo (Facturación, Contador), acá no hay forma de derivarlo: que un banco acredite o rechace un cheque es información que viene de afuera, alguien tiene que cargarla. Es la primera vez que un módulo de ADMIN necesita esto, y es la excepción correcta — no todo se puede calcular.

**Sin `archived_at`** — "Anulado" es uno de los 6 estados, no un archivado aparte. Un cheque anulado sigue visible en su propia pestaña de filtro, nunca desaparece de la vista principal (a diferencia del resto del sistema, donde "archivado" se esconde en una pestaña separada). Es la forma correcta de que tu pedido de "Filtros: Disponibles, Entregados, Depositados, Acreditados, Rechazados, Anulados, Todos" funcione tal como lo describiste.

## 3. ¿Qué pantallas incorpora?

- **Listado de Cheques**: buscador, pestañas de estado (las 6 + Todos, no el "Activos/Archivados" habitual), cada fila con Banco/Número/Titular/Cliente o proveedor/Importe/Fecha emisión/Fecha vencimiento/Estado.
- **Alta de cheque**: Banco, Número, Importe, Titular, CUIT (opcional), Fecha emisión, Fecha vencimiento, Cliente (de quién se recibe), Observaciones, Foto del frente — al guardar, genera el cobro correspondiente en el Motor de Pagos del cliente elegido, automáticamente.
- **Ficha del cheque**: los datos, el estado actual (con color, mismo criterio que el resto del sistema), Actividad (el historial automático), y los botones de acción según el estado actual:
  - Disponible → Depositar / Entregar a un proveedor / Anular
  - Depositado → Marcar acreditado / Marcar rechazado
  - Entregado → Marcar rechazado (si el proveedor avisa que no se pudo acreditar)
  - Depositado, Acreditado, Rechazado, Anulado → sin más acciones (estados finales)

## 4. ¿Qué impacto tiene sobre el resto del sistema?

- **Motor de Pagos**: se genera un cobro automáticamente al recibir un cheque, y un pago automáticamente al entregarlo a un proveedor — mismos mecanismos ya construidos, sin tocar su código.
- **Inicio**: quinta fuente de "Pendientes" — cheques próximos a vencer (mismo umbral de 7 días que ya usa Contador, salvo que prefieras otro).
- **Clientes/Proveedores**: sin cambios — un cheque recibido se ve en su Estado de Cuenta como cualquier otro cobro/pago, sin necesitar ninguna pantalla nueva ahí.
- **Permisos**: `cheques` ya estaba previsto como módulo de permiso desde la Fase 0.

---

## Lo que necesito que confirmes antes de programar

1. **La decisión central** (arriba de todo): ¿Cheques se apoya en el Motor de Pagos (mi propuesta), o preferís que sea independiente de la cuenta corriente?
2. **Foto del frente**: ¿opcional (como el resto de los adjuntos del sistema) u obligatoria para poder guardar el cheque?
3. **Avisos de vencimiento**: pediste 7 días antes / 3 días antes / día del vencimiento como 3 avisos separados — como ADMIN no tiene ningún sistema de notificaciones (ni push, ni email, nada de eso existe en el proyecto), lo único que puede hacer es mostrarlo en Pendientes de Inicio. Mi propuesta: un solo umbral de "próximo a vencer" (7 días), mismo criterio que ya usa Contador, en vez de 3 tramos distintos. ¿Te alcanza así, o preferís que la tarjeta distinga visualmente los 3 tramos (por ejemplo, un color distinto en el último día)?
4. **"Entregado" y "Rechazado" al mismo tiempo**: si un cheque ya fue entregado a un proveedor y después rebota, ¿el pago que se había generado en el Motor de Pagos del proveedor se anula automáticamente (mismo criterio que ya usamos en Facturación cuando se anula una factura), o preferís revisarlo vos a mano en ese caso puntual?
