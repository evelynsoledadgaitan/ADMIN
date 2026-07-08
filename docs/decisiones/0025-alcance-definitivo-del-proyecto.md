# 0025 — Alcance definitivo del proyecto

## Decisión

**ADMIN es un sistema de gestión comercial y administrativa. No es, y no va a ser, un sistema contable, un ERP industrial ni un sistema oficial de facturación.** Su objetivo es ayudar a administrar el negocio de manera simple, rápida y práctica — no reemplazar a un contador, ni llevar la contabilidad formal del negocio, ni cumplir funciones que le corresponden a un sistema fiscal homologado.

De esta definición se desprenden tres exclusiones permanentes, no solo para el Sprint actual:

### 1. Sin módulo de Caja
Los cobros a Clientes y los pagos a Proveedores son operaciones **independientes entre sí** — no se relacionan automáticamente, no hay conciliación, no hay flujo de fondos consolidado, no hay apertura/cierre de caja ni arqueo. El Motor de Pagos ya funciona así desde el Sprint 3; esta decisión confirma que ese comportamiento es definitivo, no un paso intermedio hacia algo más grande.

### 2. Sin control de stock
Productos queda exclusivamente como gestión de **listas de precios**: catálogo, importación de listas, actualización de precios, historial de precios. No hay control de existencias físicas, no hay movimientos de entrada/salida de inventario, no hay valoración de stock. Un "Ingreso de mercadería" (Proveedores) sigue siendo un movimiento de cuenta corriente — nunca un movimiento de inventario.

### 3. Facturación exclusivamente interna, sin ARCA/AFIP
Facturación es una herramienta comercial, no fiscal. Genera un comprobante propio de ADMIN (numeración interna, sin validez fiscal), exportable/imprimible en PDF, y puede generar automáticamente una Deuda en Cuenta Corriente cuando corresponde. **Nunca** va a incorporar: CAE, certificados digitales, Web Services de ARCA/AFIP, homologación fiscal, ni ninguna dependencia de servicios externos para emitir comprobantes. Esto no es una limitación temporal del Sprint — es parte del objetivo del producto. Ningún Sprint futuro debe dejar "arquitectura preparada" para una eventual integración fiscal — hacerlo sería construir en una dirección que el proyecto explícitamente no persigue.

### Confirmado, dentro de este mismo alcance
**Revertido.** La versión original de este documento confirmaba que Productos incorporaría el concepto de costo, para calcular margen y precio sugerido de venta. Esa decisión se revirtió después: el módulo Productos queda exclusivamente orientado a la administración de listas de precios (catálogo, precios, categorías, importación) — sin costo, sin margen, sin precio sugerido, bajo ningún concepto. Se deja esta nota en vez de borrar el párrafo original para que quede trazabilidad de que fue una decisión explícita, tomada y luego corregida, no un olvido.

## Por qué

Este documento existe porque el alcance del proyecto se amplió y se corrigió varias veces en la misma conversación (se propuso Caja y Stock, se descartaron ambos; se confirmó Facturación pero acotada). Dejarlo señalado en un solo lugar, con la misma jerarquía que el brief original y las demás decisiones de arquitectura, evita que un Sprint futuro reintroduzca por error algo que ya se decidió explícitamente que ADMIN no va a ser.

## Impacto en el roadmap

Con esto, la planificación queda en 5 bloques (ver `docs/sistemas/roadmap-bloques-funcionales.md`):
1. Cerrar Clientes y Proveedores (CUIT real, comprobante adjunto).
2. Productos: administración de categorías, importación con Excel, mejoras a la importación existente.
3. Facturación interna, integrada únicamente con Clientes y Cuenta Corriente.
4. Empleados y Contador.
5. Informes, Configuración y Notas.

Ninguno de los cinco incluye Caja, Stock ni integración fiscal — por diseño, no por omisión.
