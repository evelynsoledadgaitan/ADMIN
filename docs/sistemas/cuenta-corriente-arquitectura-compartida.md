# Cuenta Corriente — arquitectura compartida entre Clientes y Proveedores

Documento de diseño. No incluye implementación. Retoma la decisión `0020` (Cuenta Corriente de Clientes pospuesta) — este documento no la contradice, la completa: sigue sin inventar de dónde sale la deuda de un cliente sin tu confirmación (sección 6), pero ya deja resuelta la arquitectura de cómo se comparte la lógica entre los dos módulos, que es lo que pediste ahora.

---

## 1. Punto de partida: lo que ya existe, y para quién

| Pieza | Existe hoy | Para quién |
|---|---|---|
| Pagos (cobros/pagos de dinero) | `movimientos` (Motor de Pagos, Sprint 3) | **Ambos** — ya es compartido, `tipo='cobro'` o `'pago'` |
| Cargos (qué genera la deuda) | `compras` (Sprint 4) | Solo Proveedores |
| Saldo calculado | `saldo_proveedor()` (función SQL) | Solo Proveedores |
| Auditoría | Trigger genérico | Ambos, automático |
| Historial visual | `HistorialAuditoria` | Ambos, ya reutilizado |

La asimetría real es una sola: **Proveedores tiene "Cargos" (Compras) y Clientes no tiene su equivalente.** Todo lo demás (Pagos, auditoría, historial) ya es compartido desde hace dos Sprints — esto no es un punto de partida desde cero, es completar la pieza que falta con el mismo criterio que ya se usó para las que existen.

---

## 2. El modelo: tres tipos de movimiento, no una tabla nueva por cada uno

Cualquier cuenta corriente, mires Clientes o Proveedores, se explica con tres conceptos:

1. **Cargo** — algo que aumenta lo que se debe. Para Proveedores ya es "Compra". Para Clientes, sección 6 (pendiente de tu definición).
2. **Pago** — algo que lo reduce. Ya existe, es el Motor de Pagos, sin cambios.
3. **Ajuste** — pedido nuevo en este mensaje. Una corrección manual del saldo, en cualquier dirección, con motivo obligatorio (a diferencia de un cargo o un pago, un ajuste es una intervención discrecional — si no se explica por qué, no debería poder cargarse).

El saldo de cualquier entidad, en cualquier módulo, es siempre la misma cuenta: **cargos activos − pagos activos ± ajustes activos.**

---

## 3. Dónde se comparte y dónde no — la decisión central

### 3.1 Base de datos: tablas paralelas, no una tabla polimórfica

Ya se descartó una vez (Motor de Pagos, Sprint 3) la idea de una tabla única con `entidad_tipo` + `entidad_id` sin `FOREIGN KEY` real, a favor de columnas específicas por entidad con integridad referencial real. La misma razón aplica acá con más fuerza todavía, así que **no** propongo fusionar `compras` con un futuro "cargos de clientes" en una tabla polimórfica.

Propongo:
- `compras` sigue exactamente como está — no se toca (ya tiene datos reales de Proveedores en producción, tocar su esquema es un riesgo innecesario).
- Una tabla nueva y paralela para el cargo de Clientes (nombre y campos exactos, sección 6) — misma forma que `compras` (descripción, monto, fecha, comprobante opcional, inmutable, solo se anula), pero con `cliente_id` en vez de `proveedor_id`.
- Una tabla nueva `ajustes_cuenta` — **esta sí es realmente compartida**, con el mismo patrón de columnas específicas por entidad que ya usa `movimientos` (`cliente_id`/`proveedor_id` nullable + `CHECK` de que solo una esté completa). No hay razón para separar Ajustes por módulo: es exactamente el mismo concepto (monto con signo, motivo, quién y cuándo) para los dos.

**Costo real de esta decisión:** un poco de esquema repetido entre `compras` y la tabla nueva de cargos de Clientes (los mismos campos, las mismas restricciones, el mismo trigger de auditoría enganchado dos veces). Es una duplicación deliberada y barata — son migraciones de ~30 líneas, no lógica de negocio — a cambio de mantener integridad referencial real y no arriesgar el esquema de `compras` que ya está en producción.

### 3.2 Funciones de saldo: "gemelas", no una función genérica

`saldo_proveedor()` ya existe. Propongo escribir `saldo_cliente()` con la **misma estructura exacta** (mismo criterio de `SUM` condicional, mismo `stable`, mismo sin `security definer`), ahora sumando también los ajustes. No es técnicamente una única función compartida — PostgreSQL no tiene una forma limpia de parametrizar "de qué tabla sumar" sin SQL dinámico, y el SQL dinámico cambia el perfil de seguridad de la función (deja de poder auditarse con una simple lectura). Dos funciones cortas y gemelas, escritas y revisadas juntas, son más seguras y no menos mantenibles que una sola función genérica con más superficie de ataque.

### 3.3 Frontend: acá es donde se comparte casi todo

Esta es la capa donde duplicar de verdad sale caro, y es donde la propuesta concentra el ahorro. Un módulo interno nuevo, **sin pantalla ni ruta propia** — mismo patrón que `modules/pagos/` (Motor de Pagos):

```
src/modules/cuentaCorriente/
  types.ts       — MovimientoCC (unión de Cargo | Pago | Ajuste, campos comunes)
  api.ts         — useSaldoCC(tipo, entidadId), hooks genéricos de cargos/ajustes
  ListaCargos.tsx           — generaliza ListaCompras (ya existía, se mueve/generaliza acá)
  RegistrarCargoDialog.tsx  — generaliza RegistrarCompraDialog
  RegistrarAjusteDialog.tsx — nuevo, un único componente para los dos módulos
  ListaAjustes.tsx          — nuevo, un único componente para los dos módulos
```

Cada componente recibe la **terminología** como configuración, no la tiene hardcodeada — mismo mecanismo que ya usan `ListView`/`DataTable` (reciben columnas y textos por props, no saben nada de negocio):

```tsx
// Dentro de Proveedores
<ListaCargos tipo="proveedor" entidadId={proveedor.id} etiqueta="Compras" etiquetaSingular="compra" />

// Dentro de Clientes (cuando se defina qué es un cargo — sección 6)
<ListaCargos tipo="cliente" entidadId={cliente.id} etiquetaSingular="cargo" />
```

Así, Proveedores sigue diciendo "Compras" en toda su interfaz y Clientes puede decir "Cargos" (o el término que decidas) — **el usuario nunca ve un módulo de "Cuenta Corriente"**, cada uno mantiene su propia Ficha, su propio Estado de Cuenta, su propia pantalla — pero el código que dibuja la lista, el diálogo de carga, la validación y la anulación es uno solo.

---

## 4. Resumen: qué se reutiliza al 100%, qué es nuevo-pero-compartido, qué queda específico

| | Reutilizado sin cambios | Nuevo, compartido | Específico de cada módulo |
|---|---|---|---|
| Pagos | `movimientos`, Motor de Pagos completo | — | — |
| Auditoría | Trigger genérico, `HistorialAuditoria` | — | — |
| Cargos | — | Patrón de tabla + componentes (`ListaCargos`, `RegistrarCargoDialog`) | Tabla propia por entidad (`compras` ya existe; la de Clientes, a definir), terminología |
| Ajustes | — | Tabla única `ajustes_cuenta`, componentes únicos | Terminología, quizás el permiso requerido (sección 6) |
| Saldo | Patrón ya probado (`saldo_proveedor`) | `saldo_cliente()` gemela | — |
| Interfaz | `ListView`/`DataTable`, `Card`, `Button`, etc. | — | Cada Ficha/Estado de Cuenta sigue siendo su propia pantalla |

---

## 5. Permisos y auditoría — sin sorpresas

Mismo criterio que ya está aprobado desde el Sprint 3/4: nada de un permiso "Cuenta Corriente" nuevo. Un cargo de cliente se autoriza con el permiso de Clientes; un cargo de proveedor, con el de Proveedores — igual que ya pasa con `movimientos` y `compras`. La única pregunta real de permisos es sobre **Ajustes** (sección 6.4) — porque a diferencia de un cargo o un pago, un ajuste modifica el saldo sin un hecho comercial detrás, y podría ameritar un criterio más restrictivo.

La auditoría no requiere ningún mecanismo nuevo: la tabla de cargos de Clientes y `ajustes_cuenta` se suman a la lista de tablas con el trigger genérico, igual que todas las anteriores.

---

## 6. Lo que necesito que definas antes de programar

### 6.1 Origen del cargo de Clientes
Sigue siendo la pregunta central de la decisión `0020`, y sigue sin resolverse sola. Mi recomendación, ahora que tenemos más para apoyarnos: **el camino más simple es que el cargo de Clientes tenga exactamente la misma forma que una Compra** (descripción, monto, fecha, comprobante opcional) — es decir, "cargos manuales" de la lista original de opciones. Es lo que menos construcción nueva pide (reusa el mismo patrón ya construido y probado en Compras) y no cierra la puerta a nada: si en el futuro aparece un módulo de Facturación, esa sería simplemente otra fuente que inserta filas en la misma tabla, no un cambio de arquitectura. ¿Confirmás este camino, o preferís definir otro origen?

### 6.2 Nombre del cargo de Clientes
Relacionado con 6.1 — ¿"Cargo" (genérico, correcto técnicamente) o algo más cercano al lenguaje del negocio ("Venta a cuenta", "Consumo")? Define el nombre de la tabla y de todos los textos de interfaz.

### 6.3 ¿Ajustes puede ser negativo Y positivo?
Asumo que sí (a favor del negocio o a favor del cliente/proveedor) — un campo `monto` con signo, no dos tipos separados de "ajuste positivo"/"ajuste negativo". ¿De acuerdo?

### 6.4 Permiso de Ajustes
¿Se autoriza con el mismo permiso de "modificar" de Clientes/Proveedores (igual que cargos y pagos), o merece un criterio más estricto — por ejemplo, exclusivo del rol admin, dado que es una corrección manual del saldo sin un hecho comercial verificable detrás?

### 6.5 ¿El motivo del ajuste es siempre obligatorio?
Propongo que sí, sin excepción (a diferencia del motivo de anulación, que es opcional) — un ajuste sin explicación es exactamente el tipo de cosa que un historial de auditoría debería poder explicar seis meses después. ¿De acuerdo?

---

## 7. Alcance de esta etapa (si se aprueba)

Con las definiciones de la sección 6, el trabajo queda acotado a:
- Migración: tabla de cargos de Clientes + tabla `ajustes_cuenta` + `saldo_cliente()` + RLS (mismo patrón ya usado tres veces).
- `src/modules/cuentaCorriente/`: tipos, hooks y los 4 componentes compartidos.
- Generalizar `ListaCompras`/`RegistrarCompraDialog` de Proveedores para que consuman los componentes compartidos en vez de tener su propia copia (sin cambiar nada de lo que el usuario ve en Proveedores).
- Sumar Saldo + Cargos + Ajustes al Estado de Cuenta de Clientes (hoy solo tiene Movimientos + Actividad).

No incluye: ningún módulo de Facturación, ninguna imputación de pagos a cargos específicos (eso ya se descartó del núcleo en el Sprint 4, sigue descartado acá por el mismo motivo).
