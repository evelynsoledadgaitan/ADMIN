# 0016 — Compras: mismo criterio de inmutabilidad que Movimientos (Sprint 4)

## Decisión
`compras` sigue exactamente el mismo patrón que `movimientos` (Sprint 3, decisión `0014`): nunca se edita, solo se anula (`archived_at`, `anulado_por`, `motivo_anulacion` opcional), con número interno visible (`COMP-000001`, vía `GENERATED ALWAYS AS IDENTITY`) y espacio reservado sin implementar para adjuntar comprobante (`comprobante_path`, sin bucket de Storage todavía).

La descripción es **obligatoria** (a diferencia de la nota de `movimientos`, que es opcional) — decisión explícita del cliente: "no debe existir una compra sin una referencia que permita reconocerla meses después".

## Por qué
No hay ninguna razón para que una compra tenga una regla de integridad distinta a un pago — son la misma clase de dato (un hecho financiero que, una vez ocurrido, no debería poder reescribirse) y tratarlos distinto sin un motivo de negocio real solo generaría preguntas de "¿por qué acá sí y allá no?" más adelante. El cliente lo confirmó explícitamente pidiendo "exactamente el mismo criterio utilizado para los movimientos".

La descripción obligatoria en compras (vs. nota opcional en movimientos) sí tiene una razón de negocio distinta: un pago ya está identificado por su relación con el proveedor, el monto y la fecha — alcanza para reconocerlo. Una compra, en cambio, es la única pieza de información que explica *qué* se compró; sin descripción, revisar el historial meses después es indescifrable.

## Alternativas descartadas
- **Permitir editar una compra dentro de una ventana de tiempo corta** (ej. "hasta 24hs después de cargada"): descartado por agregar una regla de negocio con una excepción temporal que el cliente no pidió y que complica tanto el modelo de datos como la interfaz sin necesidad.
