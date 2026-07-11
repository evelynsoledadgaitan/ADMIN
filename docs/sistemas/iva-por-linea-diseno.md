# Facturación — IVA por línea de artículo

Documento de diseño. No incluye implementación. Cuarto ítem, el de mayor riesgo arquitectónico de los 5 — lo trato con el mismo cuidado que un módulo nuevo completo.

---

## Qué cambia, en criollo

Hoy: una factura tiene **un** IVA (Exento/10,5%/21%/27%), aplicado sobre el total completo. Vas a poder tener: **cada línea con su propio IVA** — una factura con un artículo exento, otro al 10,5% y otro al 21%, todo junto, sin tener que separar en 3 facturas.

---

## El cambio de datos

- **Se saca** `facturas.iva` (la tasa única de toda la factura).
- **Se agrega** `factura_items.iva` (la tasa de cada línea).

`precio_unitario` sigue significando lo mismo de siempre — el precio final que carga el usuario, IVA ya incluido (como cualquier precio de venta al público) — eso no cambia. Lo que cambia es que ahora, para "desarmar" ese precio final en Neto + IVA, hay que saber la tasa **de esa línea puntual**, no una tasa única para toda la factura.

### Un detalle real de la migración: las facturas que ya existen

Las facturas ya cargadas tienen sus líneas sin ninguna tasa propia — solo la factura entera tenía una. La migración va a copiar, una sola vez, la tasa que tenía cada factura hacia todas sus líneas, antes de sacar la columna vieja. Ninguna factura existente pierde su información — simplemente pasa a tener la misma tasa repetida en cada una de sus líneas, que es matemáticamente idéntico a lo que tenía antes.

---

## Cómo se ve en "Nueva factura"

Cada línea (donde hoy están Descripción, Cantidad, Precio unitario) suma un cuarto campo: **IVA**, con las mismas 4 opciones de siempre (Exento/10,5%/21%/27%). El selector de IVA que hoy está arriba de todo, aplicado a toda la factura, desaparece — cada línea lo elige por su cuenta.

**Precarga razonable**: una línea nueva arranca con la misma tasa que tenía la línea anterior (si cargaste 3 artículos al 21% seguidos, no tenés que elegir "21%" 3 veces) — la primera línea de una factura nueva arranca en "Exento", como hoy.

## Cómo se ve el resumen económico (Nueva factura y Ficha de factura)

Con una sola tasa en toda la factura, se ve exactamente igual que hoy: Neto / IVA / Total. Con más de una tasa mezclada, se desglosa por tasa — es, de hecho, la forma correcta de discriminar IVA en una factura real:

```
Exento                          Neto  $10.000
10,5 %      Neto  $5.000        IVA   $525
21 %        Neto  $8.000        IVA   $1.680
──────────────────────────────────────────
Total                                 $25.205
```

Con una sola tasa (el caso más común, probablemente), se ve simple, sin la tabla — no se le agrega complejidad visual a la factura típica de una sola tasa por algo que solo hace falta cuando de verdad se mezclan tasas.

---

## Qué NO cambia

- La inmutabilidad de las líneas — una vez guardada la factura, cada línea (con su tasa) queda fija para siempre, mismo criterio que ya rige todo lo demás.
- Los 3 flujos de Facturación (genera deuda / comprobante de un cobro / comprobante de una deuda) — ninguno de los tres depende de la tasa de IVA, siguen exactamente igual.
- La impresión — mismo mecanismo (`window.print()`, sin librerías), el desglose por tasa aparece ahí también cuando corresponde.
- Informes — el "Total facturado" ya suma `factura.total` (el precio final de cada factura), que sigue significando lo mismo; no hace falta tocar nada ahí.

---

## Qué impacto tiene sobre el resto del sistema

- **`NuevaFactura.tsx`**, **`FichaFactura.tsx`**: los dos lugares que hoy leen `factura.iva` — se actualizan para leer la tasa por línea en cambio.
- **Ningún otro módulo** lee `factura.iva` directamente — confirmé la búsqueda en todo el proyecto antes de escribir este documento.

---

## Lo único que necesito que confirmes

¿Coincidís con la precarga (una línea nueva hereda la tasa de la anterior, la primera de una factura arranca en Exento), o preferís que cada línea nueva arranque siempre en blanco, obligando a elegir la tasa cada vez?
