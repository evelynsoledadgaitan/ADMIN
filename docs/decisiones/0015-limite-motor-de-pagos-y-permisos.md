# 0015 — Motor de Pagos vs. Cuenta Corriente (límite de responsabilidad) y permisos heredados

## Decisión

**El Motor de Pagos (`movimientos`) no calcula saldos.** Solo registra hechos: qué se cobró o pagó, cuándo, por qué medio. Interpretar esos hechos para obtener saldo deudor o saldo a favor es responsabilidad de un futuro módulo, **Cuenta Corriente**, que todavía no existe y que va a necesitar además el concepto de "cargo" (factura o deuda), que hoy tampoco existe en ningún lado del sistema. No se construye nada de esto en este Sprint.

**Sin módulo de permiso "Pagos" nuevo.** La autorización de un movimiento depende siempre del permiso sobre la entidad de origen: registrar/ver/anular un cobro requiere permiso sobre **Clientes**; un pago, sobre **Proveedores**. Implementado en las políticas de RLS de la migración `0013` — no hay ninguna fila de `permisos` con `modulo = 'pagos'`, porque ese módulo no existe en la lista fija del brief.

## Por qué

**Separar "registrar" de "interpretar":** el cliente lo resumió con precisión en su aprobación — "Motor de Pagos → registra hechos. Cuenta Corriente → interpreta esos hechos." Es la aplicación directa de mantener cada pieza haciendo una sola cosa: si `movimientos` intentara también calcular saldo, tendría que conocer reglas de negocio (qué es una deuda, cómo se compensa) que no le corresponden y que, además, todavía no están definidas en ningún otro lado del sistema. Mezclarlas ahora hubiera significado inventar esas reglas sin que el cliente las haya definido — exactamente lo que la metodología de este proyecto pide evitar.

**Permisos heredados de la entidad, no un módulo nuevo:** el brief original fue explícito ("todos los módulos ya fueron definidos, no agregar nuevos") y el cliente lo reafirmó en su aprobación. Además, es coherente con cómo ya funciona el historial de auditoría desde la migración `0010` (permiso de la tabla de origen, no de un módulo aparte) — un único criterio para las dos cosas, en vez de dos reglas de autorización distintas conviviendo en la misma app.

## Alternativas descartadas
- **Que el Motor de Pagos calcule un saldo "provisorio"** (solo a partir de cobros, sin restar deuda): era una de las opciones que propuse originalmente; el cliente la descartó explícitamente a favor de separar completamente el registro de la interpretación — con razón, porque un número llamado "saldo" que en realidad no representa lo que el usuario cree que representa es peor que no mostrar ningún número.
- **Un permiso "Pagos" independiente**: descartado porque contradice la lista fija de módulos del brief y porque un usuario con permiso de Clientes pero sin el permiso nuevo hubiera quedado, sin razón aparente, sin poder cobrarle a sus propios clientes.
