# Clientes "Siempre factura" — tareas pendientes de facturación

Documento de diseño. No incluye implementación. Respondo tus 9 puntos, en orden, más la corrección al Flujo C que hace falta primero.

---

## 0. Corrección previa: anular una factura del Flujo C

Hoy, anular cualquier factura anula automáticamente la deuda vinculada, sin distinguir el origen. Se corrige para que:

- **Flujo A** (`deuda.origen = 'factura'`, nació junto con la factura): sigue igual — se anula la deuda también, como hasta ahora.
- **Flujo C** (cualquier otro origen, la deuda existía antes y se vinculó después): la deuda **no se anula** — se le limpia `factura_id` (vuelve a quedar en `null`), así que vuelve a aparecer como "Sin factura" y disponible para facturarse de nuevo. La deuda en sí nunca estuvo mal — lo único que se invalidó fue su comprobante fiscal.

Esta corrección es la base de tu punto 8, más abajo.

---

## El principio que ordena todo el diseño

Ninguna "tarea pendiente" se va a guardar en ningún lado. Se **deriva** en el momento, cruzando dos datos que ya existen:

- `deudas_clientes` — las que tienen `factura_id` vacío y `archived_at` vacío (sin factura, sin anular).
- `clientes.factura_config = 'siempre'`.

Una deuda de un cliente "Siempre factura", sin factura y sin anular, **es** la tarea pendiente — no hace falta crear nada aparte para que exista, ni borrar nada aparte para que desaparezca.

---

## 1. Cómo se genera la tarea pendiente

No se genera explícitamente — nace sola. En el momento en que cargás una deuda nueva (con "Agregar deuda", como siempre) para un cliente "Siempre factura", esa deuda ya cumple la condición (sin factura + cliente 'siempre') apenas se guarda. No se toca el formulario de "Agregar deuda" para nada.

## 2. Dónde se almacena

En ningún lado nuevo. Una sola consulta nueva, que cruza `deudas_clientes` y `clientes` — sin tabla, sin columna, sin ningún dato adicional guardado.

## 3. Cómo aparece en Inicio

Cuarta fuente de "Pendientes" (junto a Facturación, Contador, Notas) — "N deuda(s) pendiente(s) de facturar". Con una sola, lleva directo a Nueva Factura con ese cliente y esa deuda ya preseleccionada en el Flujo C (vos solo confirmás). Con más de una, lleva a la lista completa — ver punto siguiente.

## 4. Dónde se ve la lista completa

Se suma como una sección nueva dentro de Informes → Facturación (ya existe esa pantalla, con sus propias secciones) — mismo criterio que "no modificar la arquitectura si no es necesario": reutiliza la pantalla que ya filtra/exporta, en vez de crear una pantalla nueva solo para esto. Cada fila: cliente, fecha de la deuda, monto — tocarla lleva a Nueva Factura con todo preseleccionado, igual que desde Inicio.

## 5. Cómo se visualiza en la Ficha del cliente

Para un cliente "Siempre factura" con alguna deuda pendiente, una línea nueva en su Ficha: "Facturación pendiente: N deuda(s)", con un enlace a su Estado de Cuenta — donde el indicador 🟡 "Sin factura" que ya construimos la vez pasada muestra exactamente cuáles son, fila por fila. No hace falta duplicar esa vista adentro de la Ficha.

## 6. Cómo se vincula con la deuda existente

Con el Flujo C que ya está construido y funcionando — no hace falta ningún mecanismo nuevo. "Resolver la tarea" es, ni más ni menos, "elegir esa deuda en el Flujo C de Nueva Factura".

## 7. Qué ocurre cuando se emite la factura

Lo de siempre en el Flujo C: la deuda queda con `factura_id` cargado. Como la tarea pendiente es derivada (punto 2), en cuanto eso pasa, esa deuda deja de cumplir la condición y desaparece sola de Pendientes — no hay ningún paso de "marcar como resuelta" por separado.

## 8. Qué ocurre si la deuda se anula antes de facturar

`archived_at` se carga (el anular-deuda de siempre, sin cambios) — la consulta de tareas pendientes ya filtra `archived_at is null`, así que desaparece sola de Pendientes, sin ningún caso especial.

## 9. Qué ocurre si la factura se anula después de emitida

Con la corrección del punto 0: la deuda no se anula, solo se le limpia `factura_id`. Como vuelve a estar "sin factura" y sigue siendo de un cliente "Siempre factura", **vuelve a aparecer en Pendientes automáticamente** — que es exactamente lo que tiene que pasar: se emitió mal o se canceló la operación, así que sigue pendiente de resolver.

## 10. Cómo se evita que una misma deuda genere más de una tarea

No hay nada que se pueda duplicar — no se inserta ninguna fila por deuda. Una deuda con `factura_id` vacío aparece una vez en la consulta porque es una sola fila en `deudas_clientes`; en el momento en que deja de cumplir la condición, deja de aparecer. No hay ningún mecanismo de creación que pudiera, por error, crear la tarea dos veces.

---

## Qué impacto tiene sobre el resto del sistema

- **Ninguna tabla ni columna nueva** — cero migraciones de estructura.
- **Una corrección** al `anular` de Facturación (punto 0) — necesaria para que este diseño funcione bien, no es una funcionalidad nueva en sí.
- **Inicio**: cuarta fuente de Pendientes.
- **Informes → Facturación**: una sección nueva.
- **Ficha de Cliente**: una línea nueva, solo visible para clientes "Siempre factura" con algo pendiente.
- **Nueva factura**: acepta llegar con una deuda ya preseleccionada (vía parámetro en la URL, mismo patrón que ya usa con `?cliente=`).

---

## Nada que necesite tu confirmación esta vez

Todo el diseño se apoya en datos que ya existen, sin ninguna decisión de fondo pendiente — la única duda real (dónde mostrar la lista completa) la resolví reutilizando Informes en vez de inventar una pantalla nueva, siguiendo tu propio criterio de "no modificar la arquitectura si no es necesario". Si preferís otro lugar para esa lista, decímelo; si no, doy esto por listo para programar.
