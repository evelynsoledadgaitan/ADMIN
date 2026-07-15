# Cheques como cartera + pagos compuestos + transferencia entre cuentas

Documento de diseño. No incluye implementación. Tu situación de Mari y la de la clienta que paga por otros dos revelan que hacen falta **3 piezas**, relacionadas pero distintas. Las separo así a propósito, para que puedas aprobar cada una por separado si preferís avanzar de a partes.

---

## Pieza 1 — Cheques se cargan solos, sin cliente todavía

Hoy, cargar un cheque exige elegir un cliente en el momento y genera el cobro automáticamente. Eso da vuelta: un cheque se va a poder cargar **como un papel en tu cajón** — banco, número, importe, titular, fechas, foto — sin ningún cliente todavía. Queda "Disponible", esperando que lo uses.

Recién cuando registrás un cobro real (desde Clientes, "Registrar cobro") y elegís "Cheque" como medio de pago, ahí elegís **de esa cartera** cuál cheque corresponde — y ahí, recién ahí, se vincula a ese cliente y genera el cobro. Mismo cheque, se puede después "Entregar a un proveedor" desde su Ficha, exactamente como ya funciona.

Esto es lo que resuelve tu ejemplo de Mari: cargás el cheque de $600.000 sin cliente, después lo elegís al cobrarle a Mari, y días después lo entregás al frigorífico — un solo cheque, un solo recorrido, cada paso registrado en el momento en que pasa de verdad.

## Pieza 2 — Un cobro o un pago con varios medios a la vez

Esto es lo que ya me habías pedido en tu primer mensaje (punto 3) y es lo que hace falta para que el cheque de Mari conviva con el efectivo en el mismo cobro. "Registrar cobro" pasa a admitir **varias líneas** — cada una con su propio medio de pago y su monto — en vez de un monto único con un solo medio. Mismo criterio visual que ya usás en una factura con varias líneas de artículos.

Técnicamente es un cambio de bajo riesgo, aunque toque una pieza central: cada línea sigue siendo, por dentro, exactamente el mismo tipo de registro que ya existe (un movimiento) — sólo se agrupan varias bajo un mismo "recibo", para que se vean y se carguen juntas. No hace falta reconstruir el Motor de Pagos desde cero.

## Pieza 3 — El "vuelto" de Mari: reutiliza algo que ya existe

Los $100.000 que le devolvés en efectivo porque el cheque valía más de lo que necesitabas cobrarle — no hace falta ninguna pieza nueva para esto. Es exactamente lo que ya hace un **Ajuste de cuenta corriente** (lo mismo que usás hoy para correcciones manuales): un movimiento con signo, con su motivo, que le devuelve a Mari lo que sobró. El cobro del cheque entero ($600.000) genera un saldo a favor de $100.000 apenas se registra — el ajuste solo lo lleva a cero, con el motivo "Vuelto en efectivo".

---

## La cuarta pieza — la más nueva de todas, necesito tu confirmación

Tu segundo ejemplo (Cliente C paga $500 con 2 cheques, cubriendo $150 de A, $50 de B y $300 suyo) es distinto a todo lo anterior — no es "varios medios en un pago", es **un pago que cubre la deuda de otra persona**. Hoy, en ADMIN, cada cobro pertenece a un solo cliente — no existe ningún mecanismo para que la plata de uno "salte" a la cuenta de otro.

Mi propuesta: una **Transferencia entre cuentas** — una acción nueva, chica, que dice "de la cuenta de Cliente C, aplicá $150 a la cuenta de Cliente A" — deja un movimiento con motivo en las dos cuentas (aumenta el saldo a favor de C, reduce la deuda de A), completamente trazable, sin tocar nada de lo que ya existe. Se usaría así en tu ejemplo:

1. Cobro a Cliente C por $500 (2 cheques, Pieza 2) — su saldo pasa a $200 a favor (cobró $500, debía $300).
2. Transferencia de $150 desde la cuenta de C hacia la cuenta de A — la deuda de A baja a 0, el saldo a favor de C baja a $50.
3. Transferencia de $50 desde la cuenta de C hacia la cuenta de B — la deuda de B baja a 0, el saldo a favor de C queda en $0.

**¿Es esto lo que necesitás, o tenías en mente algo más simple?** Por ejemplo, una alternativa más chica: en vez de una Transferencia genérica, que el propio cobro permita elegir "a nombre de quién" además de "quién paga" — funcionalmente parecido, pero una pieza más chica y más acotada a este caso puntual. Quiero que elijas vos antes de construir cualquiera de las dos.

---

## Resumen de lo que necesito de vos

1. ¿Avanzamos con las 3 primeras piezas (cartera de cheques, cobro/pago compuesto, reutilizar Ajustes para el vuelto) tal como las describí?
2. Para la cuarta pieza: ¿Transferencia entre cuentas (más general, sirve para cualquier caso futuro parecido) o algo más acotado, pensado solo para "pagar en nombre de otro cliente en el mismo cobro"?
3. ¿Esto aplica también del lado de Proveedores (un pago compuesto con varios medios, cheques de una cartera), o por ahora es solo para Clientes?
