# Estado de cuenta como columna de listado — Clientes y Proveedores

Documento técnico breve (no es un Sprint del roadmap de bloques — es un cambio de diseño sobre un módulo ya cerrado). Cubre las dos decisiones técnicas no explícitas en el pedido original.

## 1. El problema de fondo: evitar N+1 consultas

`saldo_cliente(id)`/`saldo_proveedor(id)` ya existían, pero están pensadas para una sola entidad (la Ficha, el Estado de Cuenta). Pedirle a cada fila de un listado de 80 clientes que llame a esa función por separado son 80 consultas a Supabase solo para pintar la pantalla.

**Solución**: dos funciones nuevas, `saldos_clientes()` y `saldos_proveedores()` (migración `0031`), que devuelven el saldo de **todos** los clientes/proveedores activos en una sola consulta (agregación por `GROUP BY` en vez de una función por fila). Mismo criterio de cálculo exacto que las funciones individuales — deben coincidir siempre. El frontend arma un `Map<id, saldo>` una sola vez y lo consulta por id al pintar cada fila, sin ninguna consulta adicional.

## 2. El signo mostrado no es el signo interno

`saldo_cliente()`/`saldo_proveedor()` usan la convención interna ya establecida (positivo = hay una deuda pendiente, sea de quien sea). Lo que pediste es un lenguaje único e inequívoco en pantalla — rojo y negativo siempre "hay algo pendiente de saldar", azul y positivo siempre "a favor" — igual para Clientes que para Proveedores.

**Fórmula**: `mostrado = -saldo`, aplicada en un único lugar (`estadoCuentaDe()`, `modules/cuentaCorriente/EstadoCuentaBadge.tsx`). Verificación con tus propios ejemplos:
- Cliente con deuda: `saldo_cliente() > 0` → `mostrado < 0` → rojo, negativo. ✅
- Le debo al proveedor: `saldo_proveedor() > 0` → `mostrado < 0` → rojo, negativo. ✅
- Saldo a favor (cualquiera de los dos): `saldo < 0` → `mostrado > 0` → azul, positivo. ✅

Como la traducción vive en un solo componente compartido, Clientes y Proveedores quedan visualmente idénticos por construcción — no por que alguien haya copiado el mismo código dos veces.

## 3. Qué se sacó y dónde quedó

`Razón social` y `Facturación` (Clientes) y `Razón social` y `CUIT` (Proveedores) siguen existiendo exactamente igual — solo se sacaron del listado. Todo eso sigue disponible en la Ficha de cada uno, sin ningún cambio ahí.

## 4. Alcance

- Migración `0031`: `saldos_clientes()`, `saldos_proveedores()`.
- `modules/cuentaCorriente/EstadoCuentaBadge.tsx`: el componente visual único, compartido.
- `useSaldosClientes()` (`modules/cuentaCorriente/api.ts`), `useSaldosProveedores()` (`modules/proveedores/api.ts`) — gemelas, mismo criterio que el resto de las funciones de saldo del sistema.
- `ListadoClientes.tsx`/`ListadoProveedores.tsx`: nueva columna "Estado de cuenta" (ordenable), nuevo filtro (Todos/Con deuda/Al día/Saldo a favor), fila de celular actualizada con el mismo badge.
- La pestaña "Archivados" no muestra el badge (esas entidades no están en `saldos_clientes()`/`saldos_proveedores()`, que solo cubren activos) — se muestra un guión, no un ícono de carga infinita.
