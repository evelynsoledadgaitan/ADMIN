# Informes — mejoras: períodos, ordenamiento, filtros, resumen

Documento de diseño. No incluye implementación. Tercer ítem del orden acordado.

---

## Una regla que no cambia, y quiero dejar clara antes de todo

El pedido original menciona "agregar filtro por tiempo" en general, pero **los informes de saldo (Clientes, Deudas pendientes de Proveedores) siguen sin filtro de período** — es una decisión ya aprobada (`docs/sistemas/informes-diseno.md`) y sigue siendo correcta: un saldo es la situación de *hoy*, no algo que varíe eligiendo "mes anterior" sin recalcular todo el historial hasta esa fecha — el tipo de cálculo contable que se descartó explícitamente desde el principio del proyecto. Lo que sí cambia con este pedido son las otras dos cosas: **ordenamiento y filtros**, que sí tienen sentido sobre una foto del momento actual.

---

## 1. Períodos — se agregan 2 opciones a lo que ya existe

El selector de período (`FiltroPeriodo`) ya tiene Hoy/Esta semana/Este mes/Este año/Personalizado — se agregan **Mes anterior** y **Año anterior**, en los mismos informes que ya lo usan (Proveedores: Pagos realizados; Facturación: Emitidas y Total facturado; Empleados: Pagos y Adelantos; Contador: Próximos vencimientos). No se agrega a los informes de saldo, por la regla de arriba.

## 2. Ordenamiento — para Clientes, con una pregunta sobre Proveedores

Un selector "Ordenar por": Mayor deuda / Menor deuda / Cliente A-Z / Cliente Z-A — en los 3 informes de Clientes (hoy "Mayor deuda" ya ordena de mayor a menor fijo; pasa a ser el valor por defecto de un selector, no el único orden posible).

**Pregunta**: el pedido solo menciona Clientes explícitamente. Proveedores tiene un informe análogo ("Deudas pendientes") — ¿sumo el mismo selector ahí también, por consistencia, o lo dejás como está?

## 3. Filtros — con dos ambigüedades que necesito que resuelvas

Un selector adicional en los informes de Clientes: **Todos / Sólo con deuda / Sólo saldo a favor / Sin movimientos** — más dos campos numéricos opcionales, **Desde** / **Hasta**, para acotar por importe.

**Ambigüedad 1 — "Sin movimientos"**: puede significar dos cosas distintas:
- (a) Saldo exactamente $0 — sin importar el historial (pudo tener deudas y pagos que se cancelaron entre sí).
- (b) Nunca tuvo ninguna deuda, cobro ni ajuste cargado — un cliente completamente nuevo, sin ninguna actividad.

Mi propuesta: (a), porque es lo que ya tenemos calculado (el saldo) sin necesitar ninguna consulta nueva — (b) exigiría revisar el historial completo de cada cliente para confirmar "cero movimientos alguna vez", más pesado y sin necesidad real aparente. ¿Coincidís con (a), o te referías específicamente a (b)?

**Ambigüedad 2 — "Deuda mayor a / menor a / entre importes"**: ¿estos filtros de importe se aplican sobre el **saldo con signo** (un cliente con saldo a favor de $500 quedaría "menor a $1.000", por ejemplo) o sobre el **monto de la deuda, en valor absoluto** (ignora si es a favor o en contra, solo mira la magnitud)? Mi propuesta: valor absoluto — es más intuitivo pensar "quiero ver deudas entre $10.000 y $50.000" sin tener que acordarte del signo. ¿Coincidís?

## 4. Resumen superior

Una tarjeta de resumen arriba del listado de Clientes — mismo patrón visual que ya usan Contador e Informes de Facturación (`ResumenVencimientos`, el cuadro de "Total facturado"):

- Cantidad de clientes con deuda
- Total adeudado
- Promedio de deuda

Se calcula sobre lo que ya está filtrado en pantalla (si filtraste por "Sólo con deuda entre $10.000 y $50.000", el resumen refleja ese subconjunto, no todos los clientes) — mismo criterio que "la exportación respeta los filtros".

## 5. Exportación respeta los filtros

Ya funciona así por construcción — `BotonExportar` siempre recibe exactamente las filas que están filtradas y ordenadas en pantalla en ese momento, nunca la lista completa sin filtrar. Con el ordenamiento y los filtros nuevos, esto sigue siendo cierto sin que haga falta tocar nada del propio exportador — un beneficio directo de cómo ya estaba armado.

---

## Qué impacto tiene sobre el resto del sistema

Ninguno fuera de Informes. Todo se resuelve con estado local de la pantalla (selects, inputs) y cálculos en el cliente sobre datos que ya se traen — ninguna consulta nueva a la base, ninguna tabla, ninguna migración.

---

## Lo que necesito que confirmes antes de programar

1. ¿Sumo el mismo ordenamiento a "Deudas pendientes" de Proveedores, o solo a Clientes?
2. "Sin movimientos" — ¿opción (a) saldo en cero, o (b) sin ninguna actividad histórica?
3. Los filtros de importe — ¿sobre el valor absoluto, o respetando el signo (a favor/en contra)?
