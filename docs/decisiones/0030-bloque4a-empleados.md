# 0030 — Bloque 4A: Empleados

## Decisión

Empleados administra el dato maestro del empleado, su documentación y un historial cronológico simple de pagos y adelantos — **sin ningún cálculo laboral**: sin liquidación de sueldos, sin recibos, sin AFIP, sin vacaciones ni aguinaldo automáticos (extiende la decisión `0025` a este módulo). Es el primer módulo del roadmap completamente autocontenido — no se integra con Clientes, Proveedores, Productos ni Facturación.

**Tabla propia (`pagos_empleados`), no una extensión del Motor de Pagos** (decisión aprobada, punto 1): `movimientos` ya es una pieza compartida, probada y cerrada de Clientes y Proveedores — sumarle una tercera entidad hubiera sido más riesgo (RLS, índices, cualquier consulta que asuma "es cliente o proveedor") que crear una tabla chica nueva. Mismo criterio que ya separó `deudas_clientes` de `compras` en su momento. Sin saldo, sin cuenta corriente (confirmado, punto 4) — un historial cronológico, nada más.

**`documentos_empleados` — primera relación "uno a muchos" de adjuntos del sistema**: hasta ahora, cualquier cosa con un adjunto (una deuda, un ingreso, un movimiento, una factura) tenía como mucho un archivo. Un empleado puede tener varios documentos a la vez. La solución es una tabla propia — el sistema de adjuntos en sí (`ArchivoAdjunto`/`VisorAdjunto`) no cambió nada, se reutiliza tal cual, una vez por documento.

**Catálogo de tipo de documento** (decisión aprobada, punto 2): DNI, Contrato, Apto médico, CV, Certificado, Otro — con descripción libre obligatoria cuando se elige "Otro" (`CHECK` en la base, no solo validación de formulario).

**Pago y Adelanto son dos botones distintos en la Ficha**, pero un único componente parametrizado por `tipo` (decisión aprobada, punto 3) — mismo criterio que `RegistrarMovimientoDialog` para cobro/pago.

**Campo nuevo `cargo`**: no estaba en el brief original de 3 campos (Nombre y apellido, Modalidad de pago, Valor) — se agregó durante este Sprint para el resumen de la Ficha, opcional, texto libre.

**Indicador de documentación completa/incompleta**: `DOCUMENTOS_REQUERIDOS = ['dni', 'contrato']` es una decisión propia, no pedida explícitamente con ese detalle — los otros tipos (Apto médico, CV, Certificado, Otro) son complementarios y no afectan el indicador. Es una constante de una línea (`types.ts`), documentada en el propio código, para poder ajustarla sin tocar nada más si el criterio real es otro.

## Por qué

Es la aplicación directa del documento de diseño ya aprobado (`docs/sistemas/bloque4a-empleados-diseno.md`), respondido en las 4 preguntas fijas que se establecieron como criterio para cualquier módulo nuevo (Sprint anterior).

## Alcance de lo implementado
- Migraciones `0039` (`empleados`), `0040` (`documentos_empleados`), `0041` (`pagos_empleados`), `0042` (RLS + prefijo `empleados` en Storage).
- `src/modules/empleados/`: tipos, validaciones, hooks, formulario compartido, listado, Ficha (resumen + documentación + pagos/adelantos), 2 diálogos.
- Reutiliza `modalidades_pago_empleado` (catálogo sembrado desde la Fase 0, sin usar hasta ahora) y `medios_pago` (Motor de Pagos).
- `useArchivable`/`useRestaurar` extendidos para aceptar `empleados` (el primero ya lo tenía preparado; el segundo se sumó ahora).

## Cierre del módulo — gestión de pagos completa

Después de la primera entrega, se completó lo que había quedado a mitad de camino y se sumó lo pedido explícitamente en esta segunda vuelta:

- **`concepto` reemplaza a `nota`** en `pagos_empleados`, y pasa a ser obligatorio (antes era opcional y no alcanzaba para explicar de qué se trataba un pago) — migración con backfill para las filas que ya existían.
- **`numero_comprobante`** (opcional), mismo patrón que ya usan `deudas_clientes`/`compras`.
- **`frecuencia_pago`** en `empleados` — semanal/quincenal/mensual/por hora/por jornada/otro, puramente informativo, sin ningún cálculo ni disparador automático (confirmado explícitamente).
- **"Actividad" en la Ficha**: se había omitido en la primera entrega — `HistorialAuditoria` ahora también acepta `'empleados'`.

### Migraciones de este cierre
`0043` (concepto obligatorio + numero_comprobante), `0044` (frecuencia_pago).

## Tres ajustes finales al formulario de pago

Pedidos después de probar la primera versión — mejoras de experiencia sobre lo ya construido, sin cambiar el alcance:

1. **Monto precargado**: si la modalidad es "Importe fijo" y es un Pago (no un adelanto), el campo Monto arranca con el `valor` acordado del empleado — editable igual.
2. **Horas trabajadas**: si la modalidad es "Por hora", aparece un campo de horas que sugiere el monto (horas × valor/hora) — el dato que se guarda siempre es el monto final, nunca las horas en sí.
3. **Descuento opcional dentro del mismo pago** (`descuento`, `motivo_descuento`, migración `0045`) — resuelto explícitamente como **opción (a)** de dos alternativas presentadas: un ajuste de una sola vez, dentro de una única operación, sin ningún saldo que se arrastre entre pagos. Se descartó explícitamente la opción (b) — un registro de consumos acumulados con su propio saldo pendiente — por ser, en los hechos, una cuenta corriente de empleados, que ya se había confirmado que no se quería. El monto guardado (`monto`) sigue significando lo mismo de siempre: lo efectivamente pagado (neto). El bruto no se persiste aparte — se reconstruye siempre como `monto + descuento`.

### Migración de este ajuste
`0045` (`descuento`, `motivo_descuento`, con `CHECK` de que el motivo es obligatorio en cuanto hay descuento).

## Alternativas descartadas
- **Extender `movimientos` a una tercera entidad**: descartado explícitamente por el cliente — es "la única limitación real de escala" ya señalada en la decisión `0023`, y este Sprint confirma que se prefiere pagar el costo de una tabla más antes que tocar algo ya cerrado.
- **Reutilizar el sistema de adjuntos tal cual (un solo archivo por registro)**: no alcanzaba para "documentación" en plural — de ahí `documentos_empleados` como tabla propia.
