# Módulo Proveedores — Propuesta funcional y técnica (Sprint 4)

Documento de diseño. No incluye implementación. Enfoque pedido: el módulo parte de la **gestión de compras**, no de la gestión de pagos — un pago es siempre la consecuencia de una compra ya registrada, nunca un hecho aislado.

---

## 1. La idea central, en una frase

Un proveedor nos entrega mercadería o un servicio (**compra** — lo que le debemos) y en algún momento se lo pagamos (**pago**, a través del Motor de Pagos del Sprint 3 — lo que reduce esa deuda). La diferencia entre lo que compramos y lo que pagamos es el **saldo**. Esto es, en los hechos, la primera implementación real de una "Cuenta Corriente" — pero acotada a Proveedores, no como el módulo genérico que se dejó pendiente en el Sprint 3 (ver sección 7).

---

## 2. Modelo de datos

### 2.1 `proveedores` — sin cambios de estructura

La tabla ya existe desde la Fase 0 con exactamente los campos del brief original (`nombre`, `razon_social`, `cuit`, `condicion_iva_id`, todos menos `nombre` opcionales). No propongo agregar ningún campo nuevo acá.

**Sí propongo una migración chica de paridad con Clientes**: agregar el mismo `CHECK` de formato de CUIT que ya existe para `clientes` (migración `0009`) — hoy `proveedores.cuit` no tiene ninguna validación de formato en la base, lo cual es una inconsistencia que se arrastra desde la Fase 0, no algo nuevo de este Sprint.

### 2.2 `compras` — tabla nueva

```
compras
  id                 uuid pk
  proveedor_id       uuid not null references proveedores(id)
  descripcion        text not null        -- qué se compró, breve (ver pregunta 3.4)
  numero_comprobante text                 -- factura/remito del proveedor, dato externo, texto libre
  monto              numeric(12,2) not null check (monto > 0)
  fecha              date not null default current_date check (fecha <= current_date)

  -- Mismo patrón de inmutabilidad que `movimientos` (Sprint 3) — ver pregunta 3.1
  archived_at        timestamptz
  anulado_por        uuid references usuarios(id)
  motivo_anulacion   text
  check (archived_at is null or anulado_por is not null)

  created_at         timestamptz not null default now()
  updated_at         timestamptz not null default now()
```

`numero_comprobante` es un dato que **el proveedor** nos da (el número de su propia factura), por eso es texto libre sin formato validado — no tiene relación con el `numero_interno` de `movimientos`, que es un correlativo que genera ADMIN.

### 2.3 Saldo — función de base de datos, no una columna

El saldo de un proveedor es `SUM(compras activas) − SUM(pagos activos)`. Propongo calcularlo con una función de PostgreSQL, no guardarlo en una columna:

```sql
create function saldo_proveedor(p_proveedor_id uuid) returns numeric ...
  -- SUM(compras.monto where proveedor_id = p_proveedor_id and archived_at is null)
  -- menos
  -- SUM(movimientos.monto where proveedor_id = p_proveedor_id and tipo = 'pago' and archived_at is null)
```

**Por qué función y no columna:** una columna de saldo hay que mantenerla sincronizada a mano (o con triggers) cada vez que se crea o anula una compra o un pago — es una fuente más de bugs si algún día se llega a esa lógica desde un lugar que no está previsto. Una función siempre calcula el número real a partir de los hechos (mismo espíritu que "Motor de Pagos → registra hechos, Cuenta Corriente → interpreta esos hechos", que ya aprobaste en el Sprint 3). Con los volúmenes de este proyecto (una empresa, no miles de proveedores con miles de compras cada uno) el costo de calcularlo en cada consulta es insignificante.

### 2.4 Nada nuevo en `movimientos` ni en el Motor de Pagos

El Sprint 3 ya soporta `tipo = 'pago'` + `proveedor_id` — un pago a un proveedor se registra exactamente con los mismos `RegistrarMovimientoDialog` / `useRegistrarMovimiento('pago', proveedorId)` que ya existen. **Cero cambios al Motor de Pagos.**

---

## 3. Preguntas abiertas (necesito tu decisión antes de programar)

### 3.1 ¿Compras inmutables, igual que los movimientos?
Propongo que una compra, una vez cargada, tampoco se pueda editar — mismo criterio que aprobaste para los pagos en el Sprint 3, por la misma razón (un registro financiero corregido "en el lugar" pierde el rastro de qué decía antes). Corrección = anular + cargar la compra correcta. ¿Confirmás el mismo criterio acá?

### 3.2 ¿Compra simple o con detalle de productos?
Dos niveles posibles:
- **(a) Simple** (lo que propongo): una compra es un monto total + una descripción breve en texto libre ("Mercadería varias", "Reposición góndola 3"). No se vincula con el módulo Productos.
- **(b) Con detalle**: la compra se compone de líneas, cada una con un producto del catálogo, cantidad y precio — requiere que el módulo Productos ya tenga funcionalidad real (hoy todavía es la pantalla vacía del esqueleto) y es un salto de complejidad considerable.

Recomiendo (a) para este Sprint — es coherente con "la simplicidad tiene prioridad" y con que Productos todavía no está implementado. (b) quedaría como una evolución posible una vez que Productos exista de verdad.

### 3.3 ¿Saldo agregado simple o pagos asignados a compras puntuales?
- **(a) Agregado simple** (lo que propongo): el saldo es un número único por proveedor (todo lo comprado menos todo lo pagado). No se sabe "qué compra puntual ya está paga" — es cómo funciona la caja de la mayoría de los negocios chicos.
- **(b) Asignación detallada**: cada pago se aplica a una o más compras específicas (una compra puede estar "parcialmente pagada"), lo que requiere una tabla intermedia nueva y una pantalla para elegir a qué compra(s) se aplica cada pago.

Recomiendo (a). (b) es un subsistema de cuentas por pagar considerablemente más complejo, y nada en el brief original lo pide.

### 3.4 ¿La descripción de la compra es obligatoria?
Propongo que sí — un monto sin ninguna descripción no aporta nada útil al revisar el historial más adelante ("¿esa compra de $45.000 de marzo, qué era?"). CUIT y número de comprobante siguen opcionales.

### 3.5 ¿Fecha de compra no futura?
Mismo criterio que los movimientos (Sprint 3, punto 4 aprobado): una compra representa algo que ya ocurrió. Propongo la misma regla (`CHECK (fecha <= current_date)`), salvo que quieras permitir cargar compras "programadas".

---

## 4. Pantallas

Mismo patrón de navegación que Clientes (Sprint 2): todo dentro de `/proveedores`, rutas anidadas, `AppShell` común.

| Ruta | Pantalla |
|---|---|
| `/proveedores` | Listado |
| `/proveedores/nuevo` | Alta |
| `/proveedores/:id` | Ficha |
| `/proveedores/:id/editar` | Modificación |
| `/proveedores/:id/cuenta` | Estado de cuenta |

### 4.1 Listado de proveedores
Idéntico en estructura al Listado de Clientes (`ListView`, buscador insensible a acentos, orden alfabético desde la base). **Cero componentes nuevos.**

### 4.2 Alta / Modificación de proveedor
Un formulario más simple que el de Clientes — no existe el concepto de `factura_config` ni sus campos condicionales. Un solo `FormBlock`:

```
┌ Datos del proveedor ─────────────┐
│ Nombre *              [TextField]│
│ Razón social          [TextField]│
│ CUIT                  [TextField]│
│ Condición frente al IVA [Select] │
└───────────────────────────────────┘
[Cancelar]  [Guardar / Modificar]
```

**Cero componentes nuevos** — mismas piezas que Clientes (`TextField`, `Select`, `FormBlock`, `Button`). No propongo extraer un `EntidadForm` compartido entre Clientes y Proveedores: son parecidos, pero Clientes tiene lógica condicional (campos que aparecen/desaparecen según `factura_config`) que Proveedores no tiene — forzar una abstracción común hoy sería más complejidad que la que ahorra. Si en Empleados aparece un tercer formulario con la misma forma, ahí sí valdría la pena reconsiderarlo.

### 4.3 Ficha del proveedor
Igual patrón que Clientes: datos en modo lectura (`CampoSoloLectura`), acciones `Modificar` / `Archivar` / `Ver estado de cuenta`. Sin `id`, sin fechas técnicas. **Cero componentes nuevos.**

### 4.4 Estado de cuenta del proveedor

A diferencia de Clientes (donde esta pantalla todavía no tiene "para qué" mostrar saldo, porque no existe el concepto de deuda), acá sí hay saldo real:

```
┌───────────────────────────────────┐
│ [Nombre del proveedor]             │
│ Saldo: $ 45.000                    │  ← nuevo, vía saldo_proveedor()
├───────────────────────────────────┤
│ Compras                    [+]     │  ← nuevo: ListaCompras + RegistrarCompraDialog
│  Reposición góndola 3   $30.000    │
│  Mercadería varias      $15.000    │
├───────────────────────────────────┤
│ Pagos                      [+]     │  ← ya existe: ListaMovimientos + RegistrarMovimientoDialog (tipo="pago")
│  MOV-000004              $20.000   │
├───────────────────────────────────┤
│ Actividad                          │  ← ya existe: HistorialAuditoria
└───────────────────────────────────┘
```

**Componentes nuevos, justificados:**
- `RegistrarCompraDialog` — mismo espíritu que `RegistrarMovimientoDialog` pero para `compras` (monto, fecha, descripción, número de comprobante). No lo unifico con `RegistrarMovimientoDialog` en este Sprint: son dos conceptos de negocio distintos (compra vs. movimiento de dinero) con validaciones y tablas propias; si en el futuro aparece un tercer caso con la misma forma, ahí conviene evaluar un componente base compartido — hoy sería generalizar a partir de un solo ejemplo.
- `ListaCompras` — lista cronológica de compras de un proveedor, mismo patrón que `ListaMovimientos` (de solo lectura salvo anular, sin buscador ni FAB propio).

Ambos viven en `src/modules/proveedores/` — a diferencia del Motor de Pagos, `compras` no la va a reusar ningún otro módulo (no tiene sentido que Clientes o Empleados "compren"), así que no corresponde ponerlo en una carpeta compartida tipo `modules/pagos/`.

**Estados vacío/carga/error:** mismo criterio que ya está establecido — `EmptyState` ("Todavía no hay compras."), `Skeleton` mientras carga, sin necesidad de ningún componente nuevo para esto tampoco.

---

## 5. Flujo completo (casos de uso)

### Alta / Modificación / Archivado de proveedor
Idéntico al de Clientes (Sprint 2), con el formulario más simple de la sección 4.2. Auditoría automática vía el trigger genérico, sin cambios.

### Registrar una compra
1. Desde la Ficha del proveedor → "Ver estado de cuenta" → "+" en Compras.
2. Completa monto, fecha, descripción (obligatoria), número de comprobante (opcional).
3. Guarda → `INSERT` a `compras` → el trigger de auditoría lo registra → el saldo se recalcula solo (es una función, no hay nada que actualizar a mano) → `toast.exito('Compra registrada')`.

### Registrar un pago
Exactamente el flujo del Sprint 3, sin cambios: "+" en Pagos → `RegistrarMovimientoDialog` con `tipo="pago"` → el saldo baja porque la función `saldo_proveedor()` ya lo contempla.

### Anular una compra
Mismo patrón que anular un movimiento (sección 3.1, si se aprueba): confirmación, motivo opcional, queda visible como "ANULADA", nunca desaparece, el saldo se recalcula solo porque la compra anulada deja de sumar.

### Consultar estado de cuenta
Se abre la pantalla, se calcula `saldo_proveedor(id)`, se listan compras y pagos por separado, más la actividad de auditoría del proveedor.

---

## 6. Validaciones

| Campo | Frontend | Base de datos |
|---|---|---|
| `nombre` (proveedor) | Requerido | `NOT NULL` (ya existe) |
| `cuit` (proveedor) | 11 dígitos si se completa | **Nuevo:** mismo `CHECK` que `clientes.cuit` |
| `compras.monto` | Requerido, mayor a cero | `CHECK (monto > 0)` |
| `compras.fecha` | Requerida, no futura | `CHECK (fecha <= current_date)` (sujeto a pregunta 3.5) |
| `compras.descripcion` | Requerida (sujeto a pregunta 3.4) | `NOT NULL` si se confirma |
| `compras.numero_comprobante` | Ninguna (texto libre opcional) | Ninguna |

---

## 7. Integración con auditoría

Sin mecanismos nuevos: `compras` se suma a la lista de tablas con el trigger genérico `registrar_auditoria()` (Fase 0), exactamente igual que `clientes`, `proveedores`, `productos` y `movimientos`. Reutiliza también el mismo patrón de `archived_at` para que el trigger detecte la anulación como `'archive'` automáticamente (mismo razonamiento que en `movimientos`, Sprint 3).

---

## 8. Integración con el Motor de Pagos

Cero cambios al Motor de Pagos del Sprint 3. Proveedores lo consume tal cual quedó diseñado: `RegistrarMovimientoDialog` con `tipo="pago"`, `ListaMovimientos` con `tipo="pago"`, permisos heredados del módulo Proveedores (ya resuelto en la migración `0013`). Esto confirma que el diseño del Sprint 3 efectivamente sirve para más de un módulo, que era todo el objetivo de construirlo antes de tiempo.

---

## 9. Resumen de preguntas abiertas

1. **Compras inmutables** (3.1) — mismo criterio que movimientos, ¿confirmás?
2. **Compra simple vs. con detalle de productos** (3.2) — recomiendo simple.
3. **Saldo agregado vs. asignación de pagos a compras puntuales** (3.3) — recomiendo agregado.
4. **Descripción obligatoria** (3.4) — recomiendo sí.
5. **Fecha de compra no futura** (3.5) — recomiendo sí, misma regla que movimientos.

Con estas cinco definiciones, la migración de `compras` + la función `saldo_proveedor()` + `RegistrarCompraDialog` + `ListaCompras` + la integración completa del módulo quedan listas para programarse.
