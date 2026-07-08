# Facturación — dos flujos: genera deuda vs. asociada a un cobro existente

Documento de diseño. No incluye implementación.

---

## 1. Los dos flujos, en criollo

**Flujo A — "Genera una deuda nueva" (el único que existe hoy)**
Vendiste algo a cuenta corriente. Facturás, y esa factura genera automáticamente la Deuda correspondiente. Sin cambios respecto a lo que ya funciona.

**Flujo B — "Es el comprobante de un cobro ya registrado" (nuevo)**
1. Cobraste algo (Motor de Pagos, como siempre — sin que exista ninguna factura todavía).
2. Después, en algún momento, emitís la factura real en ARCA para esa venta.
3. Volvés a ADMIN y cargás esa factura, pero en vez de que genere una Deuda nueva (que sería incorrecto — ya se cobró), la **asociás** al cobro que ya está cargado. La factura queda como el comprobante fiscal de algo que ya pasó, sin tocar el saldo del cliente para nada.

---

## 2. Cómo se elige — un paso obligatorio, no una casilla opcional

Al entrar a "Nueva factura", después de elegir el cliente y antes de cargar las líneas, aparecen dos opciones igual de visibles (mismo estilo que ya usás en otras decisiones binarias del sistema, ej. el signo de un Ajuste):

```
¿Qué estás haciendo?

○ Genera una deuda nueva          ○ Es el comprobante de un
  (venta a cuenta corriente)         cobro ya registrado
```

No hay un valor por defecto que se pueda pasar por alto sin mirar — el formulario no deja avanzar sin elegir una de las dos, a propósito (pedido explícito: "el usuario debe elegir explícitamente").

**Si elige "Genera una deuda nueva"**: el formulario sigue exactamente como ahora.

**Si elige "Es el comprobante de un cobro ya registrado"**: aparece un selector — "Elegí el cobro" — con los cobros de ese cliente que todavía no tienen ninguna factura asociada (reutiliza `SelectorEntidadDialog`, el mismo componente genérico de siempre, mostrando fecha y monto de cada cobro). Una vez elegido, se sigue cargando la factura con sus líneas normalmente — lo único que cambia es que, al guardar, **no se crea ninguna Deuda**.

Un cobro que ya tiene una factura asociada no vuelve a aparecer en ese selector — así ninguna factura puede "reclamar" un cobro que ya fue documentado por otra.

---

## 3. Modelo de datos

Una sola columna nueva, nada más:

```
facturas.movimiento_id  -- opcional, referencia a movimientos (el cobro)
```

**Cómo queda cada flujo, sin ambigüedad**:
- Flujo A: `facturas.movimiento_id` queda vacío, y existe una fila en `deudas_clientes` con `factura_id` apuntando a esta factura (exactamente como ya funciona hoy).
- Flujo B: `facturas.movimiento_id` apunta al cobro elegido, y **no se crea ninguna fila en `deudas_clientes`**.

No hace falta ninguna columna que diga "modo A o modo B" — cuál de los dos se usó queda determinado por los datos mismos, sin guardar nada redundante (mismo criterio que ya usamos para el estado Pendiente de emitir/Emitida).

---

## 4. Qué cambia en cada pantalla

- **Nueva factura**: el paso nuevo de elección + el selector de cobro cuando corresponde. Nada más cambia del formulario existente.
- **Ficha de la factura**: donde hoy dice "Ver la deuda en el Estado de Cuenta" (Flujo A), en el Flujo B va a decir **"Ver el cobro en el Estado de Cuenta"**, apuntando al mismo lugar (el libro contable del cliente), donde ese cobro ya se ve desde que se cargó, con o sin factura.
- **Anular una factura**:
  - Flujo A: sigue anulando también la Deuda automáticamente, como hoy.
  - Flujo B: anular la factura **no toca el cobro para nada** — el cobro existía antes que la factura y sigue existiendo después. Solo se pierde el comprobante fiscal, no el dinero ya registrado.
- **Listado de Facturación**: sin cambios visibles — una factura del Flujo B se ve igual que cualquier otra, la diferencia solo importa puertas adentro.

---

## 5. Lo que necesito confirmar antes de programar

1. ¿El monto de la factura tiene que coincidir exactamente con el monto del cobro elegido, o pueden ser distintos (por ejemplo, redondeos, o una factura que agrupa parte de un cobro más grande)? Mi propuesta: no bloquear si no coinciden, pero mostrar un aviso comparando los dos montos, para que el usuario lo note si fue un error.
2. ¿El selector de cobros muestra **todos** los cobros sin factura de ese cliente, sin importar cuánto tiempo pasó, o tiene sentido acotarlo (ej. últimos 6 meses) para que la lista no se haga larga con el tiempo?
