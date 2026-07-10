# Facturación — tercer flujo: comprobante de una deuda ya generada

Documento de diseño. No incluye implementación.

---

## El hallazgo que simplifica todo esto

Revisé cómo funciona hoy el vínculo factura↔deuda (Flujo A, el que genera deuda) y hay algo que cambia el planteo: **no hace falta ninguna columna nueva**. Flujo A ya deja a la deuda con su `factura_id` apuntando a la factura que la generó — y `useDeudaDeFactura(facturaId)` ya busca "¿qué deuda tiene este `factura_id`?" para mostrar el enlace "Ver la deuda" en la Ficha.

El Flujo C ("comprobante de una deuda ya generada") es, en los hechos, **el mismo estado final que el Flujo A** — una deuda con su `factura_id` apuntando a una factura. La única diferencia real es el momento: en el Flujo A, la deuda se crea en el mismo instante que la factura; en el Flujo C, la deuda ya existía de antes y solo se la vincula. La base de datos no necesita saber cuál de las dos pasó — ya sabe leer ese vínculo.

Esto también responde solo tu pedido de "marcar la deuda como Facturada": no hace falta un estado nuevo — una deuda está facturada exactamente cuando su `factura_id` no es nulo. Mismo criterio que ya usás en todo ADMIN: no guardar lo que se puede calcular.

---

## Cómo se ve en la pantalla

En "Nueva factura", el paso "¿Qué estás haciendo?" pasa de 2 a 3 opciones:

```
○ Genera una deuda nueva      ○ Es el comprobante de un      ○ Es el comprobante de una
  (venta a cuenta corriente)     cobro ya registrado             deuda ya generada
```

Al elegir la tercera, aparece un selector — mismo componente que ya existe para elegir un cobro (`SeleccionarCobroDialog`), adaptado para deudas: muestra las deudas del cliente que **todavía no tienen ninguna factura** (`factura_id` vacío) — Fecha, Concepto, Monto por fila.

Al elegir una deuda, se precompleta automáticamente **una línea** en la factura: descripción = la descripción de la deuda, cantidad 1, importe = el monto de la deuda. Vos podés editar esa línea o agregar más — no queda bloqueada. Aclaro esto porque una deuda de ADMIN no tiene "artículos" cargados uno por uno (es un monto con una descripción) — no hay de dónde sacar un detalle línea por línea que no existe, así que la única forma honesta de "completar automáticamente" es con esa única línea de partida.

**Si el total de la factura termina siendo distinto al monto de la deuda** (por si editás la línea): mismo criterio que ya aprobaste para el Flujo B — no se bloquea, se muestra una advertencia y se pide confirmar antes de guardar.

Al guardar: se actualiza esa deuda existente (`factura_id` = la factura nueva) — no se crea ninguna deuda. La Ficha de la factura va a mostrar "Ver la deuda" exactamente igual que en el Flujo A — es el mismo mecanismo, ya construido.

---

## Qué deudas aparecen en el selector

Solo las que **todavía no tienen factura** — en la práctica, las cargadas a mano con "Agregar deuda" (no las que ya nacieron de una factura por el Flujo A, esas ya tienen su `factura_id` puesto desde el momento en que se crearon, así que no vuelven a aparecer acá). Sin límite de tiempo, mismo criterio que el selector de cobros — con buscador para cuando la lista crezca.

---

## Qué cambia en cada pantalla

- **Nueva factura**: tercera opción + selector de deudas + precompletado de una línea.
- **Ficha de la factura**: sin cambios — "Ver la deuda" ya funciona para cualquiera de los dos flujos que terminan en una deuda vinculada.
- **Anular una factura de este flujo**: mismo criterio que el Flujo A — anular la factura anula también la deuda vinculada (el código de anulación ya hace esto, sin cambios).
- **Estado de Cuenta del cliente**: sin cambios — una deuda facturada por este flujo se ve exactamente igual que una del Flujo A.

---

## Qué impacto tiene sobre el resto del sistema

Ninguno fuera de Facturación. Reutiliza el 100% de lo que ya existe para el Flujo A y el Flujo B — es la combinación de ambos, no una pieza nueva.

---

## Lo único que necesito que confirmes

¿Coincidís en que la deuda "se marca como facturada" con solo mirar si tiene `factura_id` cargado (sin ningún estado nuevo que guardar), o preferís un indicador más explícito en el listado de deudas (por ejemplo, una etiqueta visual "Facturada" junto a las que ya lo están)? Si querés esa etiqueta, es un agregado chico y sin riesgo — te lo sumo sin problema, solo quiero confirmar si hace falta antes de dar el diseño por cerrado.
