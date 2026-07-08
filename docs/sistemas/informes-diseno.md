# Informes: diseño funcional y técnico

Documento de diseño. No incluye implementación. Estructurado en las 4 preguntas fijas de siempre.

Marco: consultar rápido lo que ADMIN ya registra — sin Business Intelligence, sin gráficos obligatorios, sin crear información nueva, sin tablas nuevas.

---

## 1. ¿Qué reutiliza de los módulos ya existentes?

Casi todo. Informes no inventa ningún dato — junta y presenta lo que cada módulo ya calcula o guarda:

| Informe pedido | De dónde sale (ya existe) |
|---|---|
| Clientes: saldos pendientes / a favor / mayor deuda | `saldos_clientes()` (migración `0031`) |
| Proveedores: deudas pendientes | `saldos_proveedores()` |
| Proveedores: pagos realizados | `movimientos` (tipo='pago') |
| Facturación: emitidas / pendientes de emitir / total por período | `facturas` (columna `estado`, ya calculada) |
| Empleados: pagos / adelantos | `pagos_empleados` (columna `tipo`) |
| Empleados: aguinaldos registrados | `pagos_empleados.concepto` — ver nota importante abajo |
| Contador: pendientes / vencidas / próximos vencimientos | `obligaciones_contador` + `calcularEstadoVencimiento()`, ya existe |

**Nota importante sobre "Aguinaldos registrados"**: no existe ningún campo que marque una fila de `pagos_empleados` como "esto es un aguinaldo" — vos mismo la venís cargando como texto libre en Concepto ("Aguinaldo 3/4"). Este informe funciona **buscando la palabra "aguinaldo" dentro de Concepto**, no como un dato estructurado. Es la única forma de cumplir "sin crear información nueva" — pero tiene un límite real: si algún aguinaldo se cargó sin escribir esa palabra, no va a aparecer en este informe. ¿Te sirve así, o preferís que lo dejemos afuera de esta primera versión?

---

## 2. ¿Qué tablas nuevas necesita?

**Ninguna.** Como pediste. Pero hay una aclaración técnica que quiero dejar explícita: aunque no hace falta ninguna tabla nueva, sí hacen falta **algunas consultas nuevas** (no tablas — funciones que leen datos que ya existen). La razón: casi todo lo que ya está construido en ADMIN consulta datos de **una entidad a la vez** (los pagos de tal proveedor, los movimientos de tal cliente) porque así están pensadas las Fichas — Informes necesita, en cambio, "todos los pagos de todos los proveedores en marzo", que es una forma distinta de mirar los mismos datos, no un dato nuevo.

Ejemplo concreto: `useMovimientos(tipo, entidadId)` ya existe pero exige un proveedor puntual — Informes necesita una versión sin ese requisito, filtrada por fecha en cambio. Mismo dato, mismo `movimientos`, otra forma de pedirlo.

---

## 3. ¿Qué pantallas nuevas agrega?

- **`/informes`** — pantalla principal, 5 tarjetas (una por módulo: Clientes, Proveedores, Facturación, Empleados, Contador), cada una lleva a su categoría.
- **`/informes/clientes`, `/informes/proveedores`, `/informes/facturacion`, `/informes/empleados`, `/informes/contador`** — una pantalla por categoría, con sus informes como secciones dentro de la misma pantalla (no una ruta por informe — 14 rutas para 14 informes sería demasiada navegación para algo que se quiere "rápido de consultar").
- **Filtro de período compartido** (Hoy/Esta semana/Este mes/Este año/Rango personalizado) — un único componente reutilizado en todas las categorías donde aplica.

### Una distinción importante: no todos los informes se pueden filtrar por período

Los saldos (Clientes con saldo pendiente/a favor/mayor deuda, Deudas pendientes de Proveedores) son una **foto del momento actual** — no tiene mucho sentido preguntarles "¿cuál era el saldo la semana pasada?", porque reconstruir eso exigiría recalcular todo el historial hasta esa fecha (justamente el tipo de cálculo contable que no querés). Esos informes **no llevan el filtro de período** — siempre muestran la situación de hoy.

Los que sí son "actividad dentro de un período" (facturas emitidas, pagos realizados, adelantos, obligaciones vencidas en tal rango) **sí** llevan el filtro completo.

---

## 4. ¿Qué impacto tiene sobre el resto del sistema?

**Ninguno.** Es el primer módulo del roadmap que es puramente de lectura — no inserta, no modifica, no anula nada en ningún otro módulo. Cero riesgo de romper algo ya cerrado (Clientes, Proveedores, Facturación, Empleados, Contador) porque Informes no les pide nada que ellos no supieran responder ya.

**Permisos**: nuevo permiso `informes` (ya estaba previsto desde la Fase 0). Una pregunta real acá: ¿alcanza con el permiso `informes` para ver todo, o cada informe debería exigir también el permiso del módulo que consulta (por ejemplo, para ver el informe de Empleados hace falta `informes` **y** `empleados`)? Lo señalo porque es una decisión de seguridad, no solo de diseño visual.

---

## 5. Lo que necesito confirmar antes de programar

1. **"Aguinaldos registrados" por búsqueda de texto en Concepto** — ¿de acuerdo con la limitación que implica, o lo sacamos de esta primera versión?
2. **Permisos**: ¿`informes` alcanza solo, o se exige además el permiso del módulo correspondiente por cada informe?
3. **"Mayor deuda" de Clientes**: ¿un top fijo (ej. los 10 con más deuda) o la lista completa ordenada de mayor a menor, sin cortar?
4. Confirmás que los informes de saldo (Clientes, Proveedores) **no** llevan filtro de período — siempre son la situación de hoy, como expliqué en la sección 3.
