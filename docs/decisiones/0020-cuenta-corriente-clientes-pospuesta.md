# 0020 — Cuenta Corriente de Clientes: pospuesta deliberadamente

## Decisión
El módulo Clientes entra a la Beta 0.1 sin saldo calculado, y así va a seguir hasta que exista un Sprint específico para definirlo. No se va a inventar un modelo de "deuda de cliente" a partir de suposiciones — la definición correcta va a salir de observar el uso real de ADMIN durante la Beta, no de una decisión de escritorio.

## Por qué
El cliente lo explicó con precisión: la deuda de un cliente puede originarse de formas muy distintas según el negocio — facturación formal, ventas a cuenta, cargos manuales, u otros conceptos que todavía no se nombraron. Cualquiera de esos caminos implica decisiones de modelo de datos distintas (¿hay una tabla de facturas? ¿un cargo es un tipo de movimiento o algo aparte? ¿se permite un cargo sin comprobante?) que no corresponde resolver por anticipado. Es la misma disciplina que ya guio el Sprint 3 (no calcular saldo de cliente sin un concepto de deuda) y el Sprint 4 (saldo agregado simple, sin imputación de pagos a facturas) — dejar que la necesidad real, no la suposición, defina el alcance.

## Alcance actual del módulo Clientes (confirmado, no es un pendiente técnico)
- Datos del cliente.
- Movimientos (cobros) — Motor de Pagos, sin cambios.
- Actividad (auditoría).
- **Sin saldo.**

## Qué va a informar la definición futura
Observaciones del uso real durante la Beta 0.1 — específicamente, cómo el negocio determina hoy, en la práctica, cuánto le debe un cliente. Esa respuesta, y no una lista de opciones hipotéticas, es la que va a definir el modelo de datos del Sprint de Cuenta Corriente de Clientes.
