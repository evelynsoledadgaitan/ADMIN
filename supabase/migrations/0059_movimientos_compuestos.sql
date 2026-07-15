-- 0059: Cobros y pagos compuestos — varios medios de pago en un mismo
-- cobro/pago (decisión aprobada, punto 2 del diseño). Ver
-- docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md.
--
-- Una sola columna nueva, sin ninguna tabla nueva: `grupo_id` agrupa
-- varias filas de `movimientos` que se cargaron juntas, como un mismo
-- "recibo" (efectivo + cheque + transferencia, por ejemplo). Cada línea
-- sigue siendo, por dentro, exactamente el mismo tipo de registro que ya
-- existe — `saldos_clientes()`/`saldos_proveedores()` y todo lo que ya
-- lee `movimientos` sigue funcionando sin ningún cambio, porque suman
-- cada fila igual que siempre. `grupo_id` es puramente para mostrarlas
-- juntas en pantalla — no cambia ningún cálculo.
--
-- Sin FK a ninguna tabla — no existe una tabla "recibos" a propósito
-- (no hacía falta ninguna, evita construir una pieza nueva solo para
-- una etiqueta de agrupación).

alter table public.movimientos add column grupo_id uuid;
create index movimientos_grupo_idx on public.movimientos (grupo_id) where grupo_id is not null;
